// ─── MatkaNight Types — Midnight Network Integration ───

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type BettingZone =
  | 'face_cards'        // Any J, Q, K — 3.5x
  | 'exact_face_card'   // Specific face card — 12x
  | 'aces'              // Any Ace — 12x
  | 'number_cards'      // Any 2-10 — 1.35x
  | 'exact_number_card'; // Specific number card — 36x

export interface ZoneInfo {
  id: BettingZone;
  name: string;
  description: string;
  payout: number;
  probability: string;
  exampleCards: Card[];
}

export const ZONE_CONFIG: Record<BettingZone, ZoneInfo> = {
  face_cards: {
    id: 'face_cards',
    name: 'Face Cards',
    description: 'Bet on any Jack, Queen, or King being drawn',
    payout: 3.5,
    probability: '23.1%',
    exampleCards: [
      { rank: 'J', suit: 'spades' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'K', suit: 'diamonds' },
    ],
  },
  exact_face_card: {
    id: 'exact_face_card',
    name: 'Exact Face Card',
    description: 'Bet on a specific face card being drawn',
    payout: 12,
    probability: '1.92%',
    exampleCards: [
      { rank: 'Q', suit: 'spades' },
      { rank: 'K', suit: 'hearts' },
    ],
  },
  aces: {
    id: 'aces',
    name: 'Aces',
    description: 'Bet on any Ace being drawn',
    payout: 12,
    probability: '7.69%',
    exampleCards: [
      { rank: 'A', suit: 'spades' },
      { rank: 'A', suit: 'hearts' },
      { rank: 'A', suit: 'clubs' },
    ],
  },
  number_cards: {
    id: 'number_cards',
    name: 'Number Cards',
    description: 'Bet on any card from 2 through 10',
    payout: 1.35,
    probability: '69.2%',
    exampleCards: [
      { rank: '7', suit: 'clubs' },
      { rank: '3', suit: 'hearts' },
      { rank: '10', suit: 'spades' },
    ],
  },
  exact_number_card: {
    id: 'exact_number_card',
    name: 'Exact Number Card',
    description: 'Bet on a specific number card being drawn',
    payout: 36,
    probability: '1.92%',
    exampleCards: [
      { rank: '7', suit: 'diamonds' },
      { rank: '5', suit: 'clubs' },
    ],
  },
};

export interface Bet {
  zone: BettingZone;
  amount: number;
  exactCard?: Card; // only for exact_face_card and exact_number_card
  rankPrediction?: Rank; // for face_cards and number_cards
  suitPrediction?: Suit; // for aces
  drawnCard?: Card; // the specific card drawn for this bet
  isWin?: boolean;
  payout?: number;
}

export interface RoundResult {
  id: string;
  drawnCard: Card;
  bets: Bet[];
  totalWagered: number;
  totalPayout: number;
  isWin: boolean;
  commitmentHash: string;
  revealedSeed: string;
  shuffleSeed: string;
  timestamp: number;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'wrong_network' | 'rejected' | 'no_wallet';
  name?: string;
  rdns?: string;
  address: string | null;
  nightBalance: number;
  dustBalance: number;
}

export interface GameState {
  wallet: WalletState;
  currentScreen: ScreenName;
  selectedZones: BettingZone[];
  exactCardFace: Card | null;
  exactCardNumber: Card | null;
  faceCardRank: Rank | null;
  numberCardRank: Rank | null;
  acesSuit: Suit | null;
  bets: Bet[];
  currentRound: RoundResult | null;
  roundHistory: RoundResult[];
  streak: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: number;
  totalPayout: number;
}

export type ScreenName =
  | 'landing'
  | 'dashboard'
  | 'zone_selection'
  | 'exact_card_picker'
  | 'bet_amount'
  | 'bet_confirmation'
  | 'wallet_approval'
  | 'bet_committed'
  | 'shuffle_seed'
  | 'shuffle_animation'
  | 'card_revealed'
  | 'result'
  | 'payout_confirmation'
  | 'round_summary';

// All 52 cards
export const ALL_CARDS: Card[] = (() => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  return suits.flatMap(suit => ranks.map(rank => ({ rank, suit })));
})();

export const FACE_CARDS: Card[] = ALL_CARDS.filter(c => ['J', 'Q', 'K'].includes(c.rank));
export const NUMBER_CARDS: Card[] = ALL_CARDS.filter(c => !['A', 'J', 'Q', 'K'].includes(c.rank));
export const ACES: Card[] = ALL_CARDS.filter(c => c.rank === 'A');

export function getCardLabel(card: Card): string {
  return `${card.rank} of ${card.suit}`;
}

export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return symbols[suit];
}

export function getSuitColor(suit: Suit): string {
  return suit === 'hearts' || suit === 'diamonds' ? '#E24B4A' : '#A0A0B8';
}

export function isWinningBet(bet: Bet, drawnCard: Card): boolean {
  switch (bet.zone) {
    case 'face_cards':
      return ['J', 'Q', 'K'].includes(drawnCard.rank);
    case 'exact_face_card':
      return bet.exactCard?.rank === drawnCard.rank && bet.exactCard?.suit === drawnCard.suit;
    case 'aces':
      return drawnCard.rank === 'A';
    case 'number_cards':
      return !['A', 'J', 'Q', 'K'].includes(drawnCard.rank);
    case 'exact_number_card':
      return bet.exactCard?.rank === drawnCard.rank && bet.exactCard?.suit === drawnCard.suit;
  }
}
