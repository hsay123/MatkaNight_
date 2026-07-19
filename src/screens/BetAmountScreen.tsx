import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GameHUD } from '../components/layout/GameHUD';
import { BetChip } from '../components/game/BetChip';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ZONE_CONFIG } from '../lib/midnight/types';
import { displayBalance } from '../lib/midnight/format';

const QUICK_AMOUNTS = [25, 50, 100, 250, 500];

export function BetAmountScreen() {
  const bets = useGameStore(s => s.bets);
  const setBets = useGameStore(s => s.setBets);
  const setScreen = useGameStore(s => s.setScreen);
  const wallet = useGameStore(s => s.wallet);
  const [amounts, setAmounts] = useState<Record<string, number>>(
    Object.fromEntries(bets.map(b => [b.zone, b.amount]))
  );

  const totalWager = useMemo(() => Object.values(amounts).reduce((s, v) => s + v, 0), [amounts]);
  const insufficientFunds = totalWager > wallet.nightBalance;

  const updateAmount = (zone: string, amount: number) => {
    setAmounts(prev => ({ ...prev, [zone]: Math.max(1, amount) }));
  };

  const handleContinue = () => {
    const updatedBets = bets.map(b => ({ ...b, amount: amounts[b.zone] || 50, exactCard: b.exactCard }));
    setBets(updatedBets);
    setScreen('bet_confirmation');
  };

  return (
    <div className="min-h-screen bg-void">
      <GameHUD />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <button onClick={() => setScreen('zone_selection')} className="text-xs text-silver-mist hover:text-silver-light transition-colors mb-4 flex items-center gap-1 cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3L5 7L9 11" /></svg>
          Back to Zones
        </button>

        <h1 className="font-[family-name:var(--font-display)] font-bold text-2xl text-silver-light mb-2">Set Your Wagers</h1>
        <p className="text-sm text-silver-mist mb-8">Adjust the bet amount for each selected zone.</p>

        <div className="space-y-4 mb-8">
          {bets.map((bet, i) => {
            const zone = ZONE_CONFIG[bet.zone];
            const amount = amounts[bet.zone] || 50;
            const potentialPayout = amount * zone.payout;

            return (
              <motion.div
                key={bet.zone}
                className="glass-panel rounded-xl p-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] font-semibold text-silver-light">
                      {zone.name} {bet.exactCard ? `(${bet.exactCard.rank} of ${bet.exactCard.suit})` : ''}
                    </h3>
                    <p className="text-xs text-silver-mist">{zone.payout}x payout · {zone.probability} chance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-silver-mist">Potential Win</p>
                    <p className="font-[family-name:var(--font-display)] font-bold text-lg text-teal-bright">
                      {potentialPayout.toFixed(1)} <span className="text-xs text-silver-mist">NIGHT</span>
                    </p>
                  </div>
                </div>

                {/* Amount input */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => updateAmount(bet.zone, Number(e.target.value))}
                      className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-silver-light font-[family-name:var(--font-display)] font-bold text-lg focus:border-indigo-pulse focus:outline-none transition-colors"
                      min={1}
                      max={wallet.nightBalance}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-silver-mist">NIGHT</span>
                  </div>
                </div>

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map(qa => (
                    <BetChip
                      key={qa}
                      amount={qa}
                      selected={amount === qa}
                      onClick={() => updateAmount(bet.zone, qa)}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="glass-panel rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-silver-mist">Total Wager</p>
              <p className={`font-[family-name:var(--font-display)] font-bold text-2xl ${insufficientFunds ? 'text-ember' : 'text-silver-light'}`}>
                {totalWager.toFixed(1)} <span className="text-sm text-silver-mist">NIGHT</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-silver-mist">Balance</p>
              <p className="font-[family-name:var(--font-display)] font-bold text-lg text-silver-light">
                {displayBalance(wallet.nightBalance)} NIGHT
              </p>
            </div>
          </div>
          {insufficientFunds && (
            <p className="text-xs text-ember mt-2">Insufficient NIGHT balance. Reduce your wager or top up.</p>
          )}
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleContinue} disabled={insufficientFunds || totalWager === 0}>
          Review Bet →
        </Button>
      </main>
    </div>
  );
}
