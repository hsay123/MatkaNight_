import { motion } from 'framer-motion';

interface BetChipProps {
  amount: number;
  selected?: boolean;
  onClick: () => void;
}

export function BetChip({ amount, selected = false, onClick }: BetChipProps) {
  return (
    <motion.button
      className={`
        relative px-4 py-2 rounded-xl font-[family-name:var(--font-display)] font-bold text-sm
        cursor-pointer transition-colors
        ${selected
          ? 'bg-indigo-pulse text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
          : 'bg-surface-2 text-silver-mist border border-surface-3 hover:border-indigo-pulse/30 hover:text-silver-light'
        }
      `}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {amount} NIGHT
    </motion.button>
  );
}
