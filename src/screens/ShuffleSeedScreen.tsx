import { motion } from 'framer-motion';
import { GameHUD } from '../components/layout/GameHUD';
// import removed

export function ShuffleSeedScreen() {
  // Unused currentRound removed

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <GameHUD />
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <motion.div
          className="text-center max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Lock animation */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              className="absolute inset-0 border-4 border-indigo-pulse/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-dashed border-teal-bright/40 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="14" width="20" height="14" rx="2" stroke="#4F46E5" strokeWidth="2" />
                <path d="M11 14V9C11 6.23858 13.2386 4 16 4C18.7614 4 21 6.23858 21 9V14" stroke="#4F46E5" strokeWidth="2" />
                <circle cx="16" cy="21" r="2" fill="#4F46E5" />
              </svg>
            </div>
          </div>

          <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl text-silver-light mb-4">
            Committing Shuffle Seed
          </h2>
          <p className="text-silver-mist mb-8">
            Generating cryptographic randomness to ensure a provably fair shuffle. This seed will be verifiable after the draw.
          </p>

          <div className="glass-panel rounded-xl p-4 text-left border-surface-3/50 opacity-50">
            <p className="text-[10px] text-silver-mist uppercase tracking-widest font-semibold mb-1">Generating ZK Proof...</p>
            <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-pulse"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
