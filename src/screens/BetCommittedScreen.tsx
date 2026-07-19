import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameHUD } from '../components/layout/GameHUD';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';

export function BetCommittedScreen() {
  const currentRound = useGameStore(s => s.currentRound);
  const commitSeed = useGameStore(s => s.commitSeed);

  // Auto-progress to commit seed after a delay (simulating ZK proof generation)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto-trigger the next step to keep the flow smooth
      // In a real app, this might wait for a specific blockchain event
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!currentRound) return null;

  return (
    <div className="min-h-screen bg-void">
      <GameHUD />
      <main className="max-w-2xl mx-auto px-4 pt-24 py-16 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Checkmark icon */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-teal-bright/10 flex items-center justify-center border border-teal-bright/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M11 20L17 26L29 14" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl text-silver-light mb-4">
            Bet Committed
          </h1>
          <p className="text-silver-mist mb-8">
            Your wager has been privately recorded on the Midnight Network via zero-knowledge proof.
          </p>

          <div className="glass-panel rounded-xl p-5 text-left mb-12 border-indigo-pulse/20 inline-block w-full max-w-md">
            <p className="text-xs text-silver-mist mb-2 uppercase tracking-wider font-semibold">Commitment Hash</p>
            <p className="terminal-text break-all text-indigo-pulse bg-indigo-pulse/5 border-indigo-pulse/10">
              {currentRound.commitmentHash}
            </p>
            <div className="flex justify-between items-center mt-4 text-xs text-silver-mist">
              <span>Status: <span className="text-teal-bright">Confirmed</span></span>
              <a href="#" className="text-indigo-pulse hover:underline flex items-center gap-1">
                View on Explorer
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 8L8 4M8 4H5M8 4V7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <Button variant="primary" size="lg" onClick={commitSeed} className="w-full max-w-md">
              Commit Shuffle Seed →
            </Button>
            <p className="text-xs text-silver-mist mt-4">
              Next step: Secure the deck shuffle using ZK randomness.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
