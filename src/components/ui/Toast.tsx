import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const typeConfig = {
  success: {
    bg: 'bg-neon-teal/10 border-neon-teal/30',
    text: 'text-teal-bright',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-ember/10 border-ember/30',
    text: 'text-ember',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5.5V10M9 12.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-indigo-pulse/10 border-indigo-pulse/30',
    text: 'text-indigo-pulse',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 8V12.5M9 5.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const config = typeConfig[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`
            fixed bottom-6 right-6 z-[100]
            flex items-center gap-3 px-4 py-3
            rounded-xl border backdrop-blur-xl
            font-[family-name:var(--font-body)] text-sm
            ${config.bg} ${config.text}
          `}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <span className="flex-shrink-0">{config.icon}</span>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
