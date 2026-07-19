import { motion } from 'framer-motion';

interface StatPillProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  glowColor?: 'indigo' | 'teal' | 'ember';
  suffix?: string;
}

const glowClasses = {
  indigo: 'shadow-[0_0_15px_rgba(79,70,229,0.15)] border-indigo-pulse/20',
  teal: 'shadow-[0_0_15px_rgba(15,110,86,0.15)] border-neon-teal/20',
  ember: 'shadow-[0_0_15px_rgba(226,75,74,0.15)] border-ember/20',
};

export function StatPill({ label, value, icon, glowColor = 'indigo', suffix }: StatPillProps) {
  return (
    <motion.div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        bg-surface-2/80 backdrop-blur-sm
        border rounded-full text-sm
        ${glowClasses[glowColor]}
      `}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {icon && <span className="text-indigo-pulse flex-shrink-0">{icon}</span>}
      <span className="text-silver-mist text-xs">{label}</span>
      <span className="font-[family-name:var(--font-display)] font-bold text-silver-light">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span className="text-silver-mist text-xs ml-0.5">{suffix}</span>}
      </span>
    </motion.div>
  );
}
