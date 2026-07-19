import { create } from 'zustand';
import type { GameState, ScreenName, BettingZone, Bet, Card, RoundResult, WalletState, Rank, Suit } from '../lib/midnight/types';
import { isWinningBet } from '../lib/midnight/types';
import { walletService, type DetectedWallet } from '../lib/midnight/wallet';
import { contractService, generateMockHash } from '../lib/midnight/contract';

interface GameActions {
  // Navigation
  setScreen: (screen: ScreenName) => void;

  // Wallet
  connectWallet: (wallet?: DetectedWallet) => Promise<void>;
  disconnectWallet: () => void;
  setWalletState: (state: Partial<WalletState>) => void;
  refreshWalletBalances: () => Promise<void>;

  // Zone Selection
  toggleZone: (zone: BettingZone) => void;
  clearZones: () => void;
  setExactCardFace: (card: Card | null) => void;
  setExactCardNumber: (card: Card | null) => void;
  setFaceCardRank: (rank: Rank | null) => void;
  setNumberCardRank: (rank: Rank | null) => void;
  setAcesSuit: (suit: Suit | null) => void;

  // Betting
  setBets: (bets: Bet[]) => void;
  updateBetAmount: (zone: BettingZone, amount: number) => void;

  // Game Flow
  placeBet: () => Promise<void>;
  commitSeed: () => Promise<void>;
  revealAndSettle: () => Promise<void>;

  // Round
  setCurrentRound: (round: RoundResult | null) => void;
  addToHistory: (round: RoundResult) => void;
  resetForNewRound: () => void;
  
  // UI States
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
}

const initialState: GameState & { toast: null } = {
  wallet: {
    status: 'disconnected',
    address: null,
    nightBalance: 0,
    dustBalance: 0,
  },
  currentScreen: 'landing',
  selectedZones: [],
  exactCardFace: null,
  exactCardNumber: null,
  faceCardRank: null,
  numberCardRank: null,
  acesSuit: null,
  bets: [],
  currentRound: null,
  roundHistory: [],
  streak: 0,
  totalWins: 0,
  totalLosses: 0,
  totalWagered: 0,
  totalPayout: 0,
  toast: null,
};

// Guard against duplicate wallet subscriptions across reconnect cycles
let _unsubscribeWallet: (() => void) | null = null;

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setToast: (toast) => set({ toast }),

  setScreen: (screen) => set({ currentScreen: screen }),

  connectWallet: async (selectedWallet?: DetectedWallet) => {
    set({ wallet: { ...get().wallet, status: 'connecting' } });
    try {
      const state = await walletService.connect(selectedWallet);
      set({ wallet: state, currentScreen: 'dashboard' });

      // Initialize the contract service so circuit calls can proceed.
      // contractService.placeBet / commitShuffleSeed / revealAndSettle all require
      // this to have been called first (it sets the module-private cachedConnectedAPI).
      const connectedAPI = walletService.getAPI();
      if (connectedAPI) await contractService.initialize(connectedAPI as any);

      // Subscribe to wallet service state changes so balance refreshes
      // propagate reactively to the Zustand store.
      if (_unsubscribeWallet) _unsubscribeWallet();
      _unsubscribeWallet = walletService.subscribe((ws) => {
        set({ wallet: ws });
      });
    } catch (error: any) {
      // walletService.connect already sets a specific status (no_wallet, wrong_network, rejected)
      // so read it back rather than blindly overriding
      const currentStatus = walletService.getState().status;
      set({ wallet: { ...get().wallet, status: currentStatus === 'connecting' ? 'rejected' : currentStatus } });
      throw error; // Re-throw so UI can capture and display specific error strings
    }
  },

  disconnectWallet: () => {
    if (_unsubscribeWallet) { _unsubscribeWallet(); _unsubscribeWallet = null; }
    walletService.disconnect();
    contractService.reset(); // Clear stale cachedConnectedAPI so next connect starts fresh
    set({
      wallet: {
        status: 'disconnected',
        name: undefined,
        rdns: undefined,
        address: null,
        nightBalance: 0,
        dustBalance: 0,
      },
      currentScreen: 'landing',
    });
  },

  setWalletState: (state) =>
    set({ wallet: { ...get().wallet, ...state } }),

  /**
   * Explicitly refresh wallet balances from the chain and push into the store.
   * Call this after any transaction to keep the HUD in sync.
   */
  refreshWalletBalances: async () => {
    const { night, dust } = await walletService.refreshBalances();
    set({
      wallet: {
        ...get().wallet,
        nightBalance: night,
        dustBalance: dust,
      },
    });
  },

  toggleZone: (zone) => {
    const current = get().selectedZones;
    const updated = current.includes(zone)
      ? current.filter((z) => z !== zone)
      : [...current, zone];
    set({ selectedZones: updated });
  },

  clearZones: () => set({ selectedZones: [], bets: [], exactCardFace: null, exactCardNumber: null, faceCardRank: null, numberCardRank: null, acesSuit: null }),

  setExactCardFace: (card) => set({ exactCardFace: card }),
  setExactCardNumber: (card) => set({ exactCardNumber: card }),
  setFaceCardRank: (rank) => set({ faceCardRank: rank }),
  setNumberCardRank: (rank) => set({ numberCardRank: rank }),
  setAcesSuit: (suit) => set({ acesSuit: suit }),

  setBets: (bets) => set({ bets }),

  updateBetAmount: (zone, amount) => {
    const bets = get().bets.map((b) =>
      b.zone === zone ? { ...b, amount } : b
    );
    set({ bets });
  },

  placeBet: async () => {
    const { bets, wallet } = get();
    set({ currentScreen: 'wallet_approval' });

    const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);
    if (wallet.nightBalance < totalAmount) return;

    try {
      const zonesHash = crypto.getRandomValues(new Uint8Array(32));
      const nonce = Date.now();
      const seedHash = crypto.getRandomValues(new Uint8Array(32));
      const result = await contractService.placeBetAndCommitSeed(zonesHash, BigInt(totalAmount), BigInt(nonce), seedHash);

      // Refresh balances from chain immediately after transaction
      await walletService.deductBalance(totalAmount);
      const updatedWallet = walletService.getState();

      console.log('[MatkaNight:placeBet] Balance after deduct → NIGHT:', updatedWallet.nightBalance, '| DUST:', updatedWallet.dustBalance);

      const seedHashString = Array.from(seedHash).map(b => b.toString(16).padStart(2, '0')).join('');

      set({
        wallet: updatedWallet,
        currentScreen: 'bet_committed',
        currentRound: {
          id: `round_${Date.now()}`,
          drawnCard: { rank: 'A', suit: 'spades' }, // placeholder
          bets,
          totalWagered: totalAmount,
          totalPayout: 0,
          isWin: false,
          commitmentHash: result.commitmentHash,
          revealedSeed: '',
          shuffleSeed: seedHashString,
          timestamp: Date.now(),
          verificationStatus: 'pending',
        },
      });
    } catch (err: any) {
      console.error('[MatkaNight:placeBet] Error:', err);
      let errorMsg = err?.message || 'Bet cancelled or failed.';
      if (err?.message?.includes('timed out')) {
        errorMsg = 'Transaction timed out. Please check your wallet.';
      }
      set({ currentScreen: 'bet_confirmation', toast: { message: errorMsg, type: 'error' } });
    }
  },

  commitSeed: async () => {
    set({ currentScreen: 'shuffle_seed' });
    // Seed was already committed on-chain during placeBetAndCommitSeed.
    // Add a short delay so the shuffle_seed screen is visible to the user.
    await new Promise(r => setTimeout(r, 900));
    set({ currentScreen: 'shuffle_animation' });
  },

  revealAndSettle: async () => {
    const { bets, currentRound } = get();
    if (!currentRound) return;

    try {
      const { ALL_CARDS } = await import('../lib/midnight/types');
      
      let totalPayout = 0;
      let isWin = false;

      const drawnCard = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];

      const settledBets = bets.map(bet => {
        const betIsWin = isWinningBet(bet, drawnCard);
        
        let payout = 0;
        if (betIsWin) {
          isWin = true;
          const zonePayouts: Record<string, number> = {
            face_cards: 3.5,
            exact_face_card: 12,
            aces: 12,
            number_cards: 1.35,
            exact_number_card: 36,
          };
          payout = bet.amount * zonePayouts[bet.zone];
          totalPayout += payout;
        }

        return { ...bet, drawnCard, isWin, payout };
      });

      const totalWagered = settledBets.reduce((sum, b) => sum + b.amount, 0);

      const result: RoundResult = {
        id: `round_${Date.now()}`,
        drawnCard: settledBets[0].drawnCard!,
        bets: settledBets,
        totalWagered,
        totalPayout,
        isWin,
        commitmentHash: currentRound.commitmentHash,
        revealedSeed: generateMockHash(),
        shuffleSeed: currentRound.shuffleSeed,
        timestamp: Date.now(),
        verificationStatus: 'pending',
      };

      const currentStreak = get().streak;
      const newStreak = result.isWin ? currentStreak + 1 : 0;

      // Show result screen immediately with local evaluation
      set({
        currentRound: result,
        currentScreen: 'card_revealed',
        streak: newStreak,
        totalWins: get().totalWins + (result.isWin ? 1 : 0),
        totalLosses: get().totalLosses + (result.isWin ? 0 : 1),
        totalWagered: get().totalWagered + result.totalWagered,
        totalPayout: get().totalPayout + result.totalPayout,
      });

      // On-chain settlement runs in background — doesn't block UI
      (async () => {
        try {
          const commitmentHashBytes = new Uint8Array(currentRound.commitmentHash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
          
          await contractService.revealAndSettle(
            commitmentHashBytes,
            1n,
            1n,
            BigInt(Math.round(totalPayout))
          );

          console.log('[MatkaNight:settle] On-chain settlement succeeded');

          const balanceBeforeSettle = walletService.getState().nightBalance;
          let updatedWallet = walletService.getState();
          if (result.isWin && result.totalPayout > 0) {
            for (let attempt = 1; attempt <= 20; attempt++) {
              await walletService.refreshBalances();
              updatedWallet = walletService.getState();
              if (updatedWallet.nightBalance !== balanceBeforeSettle) {
                console.log(`[MatkaNight:settle] Balance updated on attempt ${attempt}: NIGHT ${updatedWallet.nightBalance}`);
                break;
              }
              if (attempt === 20) {
                console.warn('[MatkaNight:settle] Balance did not change after settle within timeout.');
              }
              await new Promise(res => setTimeout(res, 1500));
            }
          } else {
            await walletService.refreshBalances();
            updatedWallet = walletService.getState();
          }

          console.log('[MatkaNight:settle] Balance after settle → NIGHT:', updatedWallet.nightBalance, '| DUST:', updatedWallet.dustBalance);

          // Update result verification status and wallet in place
          set((state) => ({
            wallet: updatedWallet,
            currentRound: state.currentRound ? { ...state.currentRound, verificationStatus: 'verified' as const } : state.currentRound,
          }));
        } catch (err: any) {
          console.error('[MatkaNight:settle] Background settlement error:', err);
          set((state) => ({
            currentRound: state.currentRound ? { ...state.currentRound, verificationStatus: 'failed' as const } : state.currentRound,
          }));
        }
      })();
    } catch (err: any) {
      console.error('[MatkaNight:revealAndSettle] Error:', err);
      let errorMsg = err?.message || 'Failed to reveal and settle round.';
      if (err?.message?.includes('timed out')) {
        errorMsg = 'Transaction timed out. Please check your wallet.';
      }
      set({ currentScreen: 'bet_committed', toast: { message: errorMsg, type: 'error' } });
    }
  },

  setCurrentRound: (round) => set({ currentRound: round }),

  addToHistory: (round) =>
    set({ roundHistory: [round, ...get().roundHistory].slice(0, 50) }),

  resetForNewRound: () =>
    set({
      selectedZones: [],
      exactCardFace: null,
      exactCardNumber: null,
      faceCardRank: null,
      numberCardRank: null,
      acesSuit: null,
      bets: [],
      currentRound: null,
      currentScreen: 'zone_selection',
    }),
}));
