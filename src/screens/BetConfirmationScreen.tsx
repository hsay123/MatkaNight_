import { GameHUD } from '../components/layout/GameHUD';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ZONE_CONFIG } from '../lib/midnight/types';
import { displayBalance } from '../lib/midnight/format';

export function BetConfirmationScreen() {
  const bets = useGameStore(s => s.bets);
  const setScreen = useGameStore(s => s.setScreen);
  const placeBet = useGameStore(s => s.placeBet);
  const wallet = useGameStore(s => s.wallet);
  const totalWager = bets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen bg-void">
      <GameHUD />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        <button onClick={() => setScreen('bet_amount')} className="text-xs text-silver-mist hover:text-silver-light transition-colors mb-4 flex items-center gap-1 cursor-pointer tactile-active">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3L5 7L9 11" /></svg>
          Adjust Amounts
        </button>

        <h1 className="font-[family-name:var(--font-display)] font-bold text-2xl text-silver-light mb-6">
          Confirm <em className="font-[family-name:var(--font-accent)] font-semibold italic text-indigo-pulse/90">Your</em> Bet
        </h1>

        {/* Receipt-style summary */}
        <div className="glass-panel rounded-xl overflow-hidden mb-6 border-surface-3/50">
          {/* Header bar */}
          <div className="p-4 border-b border-surface-3/30 bg-surface-2/30">
            <div className="grid grid-cols-3 text-xs text-silver-mist font-medium">
              <span>Zone</span>
              <span className="text-center">Wager</span>
              <span className="text-right">Potential Win</span>
            </div>
          </div>

          {/* Bet rows */}
          {bets.map((bet) => {
            const zone = ZONE_CONFIG[bet.zone];
            return (
              <div key={bet.zone} className="p-4 border-b border-surface-3/20 last:border-0">
                <div className="grid grid-cols-3 items-center">
                  <div>
                    <p className="text-sm text-silver-light font-medium">{zone.name}</p>
                    {bet.exactCard && (
                      <p className="text-xs text-indigo-pulse font-[family-name:var(--font-mono)]">
                        {bet.exactCard.rank} of {bet.exactCard.suit}
                      </p>
                    )}
                  </div>
                  <p className="text-center font-[family-name:var(--font-display)] font-bold text-silver-light">
                    {bet.amount} <span className="text-xs text-silver-mist">NIGHT</span>
                  </p>
                  <p className="text-right font-[family-name:var(--font-display)] font-bold text-teal-bright">
                    {(bet.amount * zone.payout).toFixed(1)} <span className="text-xs text-silver-mist">NIGHT</span>
                  </p>
                </div>
              </div>
            );
          })}

          {/* Total line — dashed separator */}
          <div className="p-4 bg-surface-2/50 border-t border-dashed border-surface-3/50">
            <div className="grid grid-cols-3 items-center">
              <span className="text-sm text-silver-light font-semibold">Total</span>
              <p className="text-center font-[family-name:var(--font-display)] font-bold text-lg text-silver-light">
                {totalWager} <span className="text-xs text-silver-mist">NIGHT</span>
              </p>
              <p className="text-right text-xs text-silver-mist">
                After: {displayBalance(wallet.nightBalance - totalWager)}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Fairness notices */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50 border border-surface-3/30">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5 text-indigo-pulse">
              <path d="M9 2L4 5V9C4 12.31 6.14 15.36 9 16C11.86 15.36 14 12.31 14 9V5L9 2Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div>
              <p className="text-xs text-silver-light font-medium">Privacy Protected</p>
              <p className="text-xs text-silver-mist">Your bet amounts are encrypted using Midnight's zero-knowledge circuits. Only the outcome is visible on-chain.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50 border border-surface-3/30">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5 text-neon-teal">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 9L8 11L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-xs text-silver-light font-medium">Provably Fair</p>
              <p className="text-xs text-silver-mist">The shuffle seed is committed before your bet is placed. After the round, you can verify the commitment matches the revealed seed.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => setScreen('bet_amount')}>
            Edit Bet
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={placeBet}>
            Place Bet - {totalWager} NIGHT
          </Button>
        </div>
      </main>
    </div>
  );
}
