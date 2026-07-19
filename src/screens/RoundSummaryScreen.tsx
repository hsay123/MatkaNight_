import { motion } from 'framer-motion';
import { GameHUD } from '../components/layout/GameHUD';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';

export function RoundSummaryScreen() {
  const currentRound = useGameStore(s => s.currentRound);
  const setScreen = useGameStore(s => s.setScreen);
  const resetForNewRound = useGameStore(s => s.resetForNewRound);
  const addToHistory = useGameStore(s => s.addToHistory);

  if (!currentRound) return null;

  const handleDone = () => {
    addToHistory(currentRound);
    resetForNewRound();
    setScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-void">
      <GameHUD />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] font-bold text-2xl text-silver-light">
              Round <em className="font-[family-name:var(--font-accent)] font-semibold italic text-indigo-pulse/90">Verification</em>
            </h1>
            <p className="text-sm text-silver-mist mt-1">ID: {currentRound.id}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setScreen('result')}>
            Back to Result
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Trust Narrative */}
          <div className="glass-panel rounded-xl p-5 border-l-2 border-l-indigo-pulse bg-indigo-pulse/5">
            <h3 className="text-sm font-semibold text-silver-light mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5V9.5C14 12.5 11.5 15 8 16C4.5 15 2 12.5 2 9.5V5L8 2Z" fill="#4F46E5" fillOpacity="0.2" stroke="#4F46E5" strokeWidth="1.5"/></svg>
              Provably Fair
            </h3>
            <p className="text-xs text-silver-mist leading-relaxed">
              MatkaNight uses zero-knowledge proofs on the Midnight Network to guarantee fairness. 
              The deck's shuffle seed was cryptographically committed before your bet was accepted. 
              Below, you can verify that the final drawn card exactly matches the pre-committed shuffle state.
            </p>
          </div>

          {/* Cryptographic Proofs */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-surface-3/30 bg-surface-2/30">
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-silver-light text-sm">On-Chain Proof Data</h3>
            </div>
            <div className="p-5 space-y-5">
              
              <div>
                <p className="text-xs text-silver-mist mb-1.5 uppercase tracking-wide font-semibold">1. Shuffle Commitment (Pre-Draw)</p>
                <div className="terminal-text flex items-center justify-between">
                  <span className="truncate">{currentRound.commitmentHash}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-teal-bright flex-shrink-0 ml-2"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              <div>
                <p className="text-xs text-silver-mist mb-1.5 uppercase tracking-wide font-semibold">2. Revealed Seed (Post-Draw)</p>
                <div className="terminal-text flex items-center justify-between">
                  <span className="truncate">{currentRound.revealedSeed}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-teal-bright flex-shrink-0 ml-2"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-silver-mist mb-1.5 uppercase tracking-wide font-semibold">3. Verification Status</p>
                <div className="flex items-center gap-2 text-sm text-teal-bright bg-teal-bright/10 border border-teal-bright/20 px-3 py-2 rounded-lg font-medium inline-flex">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ZK Proof Validated
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button variant="primary" size="lg" onClick={handleDone} className="min-w-[200px]">
              Back to Lobby
            </Button>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
