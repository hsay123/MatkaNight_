import { motion } from 'framer-motion';
import type { BettingZone } from '../../lib/midnight/types';
import { ZONE_CONFIG } from '../../lib/midnight/types';
import { PlayingCard } from './PlayingCard';

interface ZoneCardProps {
  zone: BettingZone;
  selected: boolean;
  onToggle: () => void;
}

export function ZoneCard({ zone, selected, onToggle }: ZoneCardProps) {
  const config = ZONE_CONFIG[zone];

  return (
    <motion.button
      className={`
        relative w-full text-left rounded-2xl p-5 cursor-pointer
        transition-colors duration-200 overflow-hidden group
        ${selected
          ? 'bg-surface-3 border-2 border-indigo-pulse shadow-[0_0_30px_rgba(79,70,229,0.2)] glow-indigo'
          : 'bg-obsidian border-2 border-surface-3/50 hover:border-surface-3 hover:bg-surface-2'
        }
      `}
      onClick={onToggle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(79,70,229,0.1), transparent 60%)' }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-silver-light text-sm">
            {config.name}
          </h3>
          <p className="text-xs text-silver-mist mt-0.5 max-w-[200px]">{config.description}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1
          ${selected ? 'border-indigo-pulse bg-indigo-pulse' : 'border-surface-3'}`}>
          {selected && (
            <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </div>
      </div>

      <div className="relative flex items-end justify-center h-20 mt-2">
        {config.exampleCards.map((card, i) => {
          const total = config.exampleCards.length;
          const angle = (i - (total - 1) / 2) * 12;
          const tx = (i - (total - 1) / 2) * 18;
          return (
            <div key={`${card.rank}-${card.suit}`} className="absolute"
              style={{ transform: `translateX(${tx}px) rotate(${angle}deg)`, transformOrigin: 'bottom center', zIndex: i }}>
              <PlayingCard card={card} faceUp size="sm" />
            </div>
          );
        })}
      </div>

      <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-surface-3/50">
        <span className="text-xs text-silver-mist">Probability: {config.probability}</span>
        <span className="font-[family-name:var(--font-display)] font-bold text-indigo-pulse text-lg">
          {config.payout}x
        </span>
      </div>
    </motion.button>
  );
}
