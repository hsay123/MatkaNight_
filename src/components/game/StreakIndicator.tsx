import { motion } from 'framer-motion';

interface StreakIndicatorProps {
  streak: number;
}

export function StreakIndicator({ streak }: StreakIndicatorProps) {
  if (streak === 0) return null;

  const isPulsing = streak >= 3;

  return (
    <motion.div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        rounded-full text-sm font-[family-name:var(--font-display)] font-bold
        ${isPulsing
          ? 'bg-ember/20 text-ember border border-ember/30 streak-pulse'
          : 'bg-surface-2 text-silver-light border border-surface-3'
        }
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={streak}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1C8 1 3 6 3 9.5C3 12.5 5.24 14 8 14C10.76 14 13 12.5 13 9.5C13 6 8 1 8 1Z"
          fill={isPulsing ? '#E24B4A' : '#A0A0B8'}
          fillOpacity={isPulsing ? 0.8 : 0.4}
        />
        <path
          d="M8 6C8 6 5.5 8.5 5.5 10.5C5.5 12 6.62 13 8 13C9.38 13 10.5 12 10.5 10.5C10.5 8.5 8 6 8 6Z"
          fill={isPulsing ? '#FF8A80' : '#D1D1E0'}
          fillOpacity={0.6}
        />
      </svg>
      <span>{streak}x Streak</span>
    </motion.div>
  );
}
