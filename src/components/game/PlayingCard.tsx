import { motion } from 'framer-motion';
import type { Card, Suit } from '../../lib/midnight/types';
import { getSuitColor } from '../../lib/midnight/types';

interface PlayingCardProps {
  card?: Card;
  faceUp?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  flipDelay?: number;
}

const sizeConfig = {
  sm: { w: 56, h: 80, rank: 'text-sm', suit: 'text-[10px]', center: 'text-xl' },
  md: { w: 100, h: 140, rank: 'text-lg', suit: 'text-sm', center: 'text-3xl' },
  lg: { w: 160, h: 224, rank: 'text-2xl', suit: 'text-lg', center: 'text-5xl' },
};

// Metallic gradient fills for suits — rendered via SVG defs per-instance

function SuitIcon({ suit, size = 16 }: { suit: Suit; size?: number }) {
  const gradientId = `suit-grad-${suit}`;
  const paths: Record<Suit, string> = {
    hearts:
      'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    diamonds:
      'M12 2L6 12l6 10l6-10L12 2z',
    clubs:
      'M12 2C9.24 2 7 4.24 7 7c0 1.83.98 3.44 2.44 4.32C8.56 12.22 8 13.54 8 15c0 .34.03.67.08 1H7v3h10v-3h-1.08c.05-.33.08-.66.08-1 0-1.46-.56-2.78-1.44-3.68C16.02 10.44 17 8.83 17 7c0-2.76-2.24-5-5-5z',
    spades:
      'M12 2L4 12c0 2.76 2.24 5 5 5 .71 0 1.39-.15 2-.42V20H9v2h6v-2h-2v-3.42c.61.27 1.29.42 2 .42 2.76 0 5-2.24 5-5L12 2z',
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={suit === 'hearts' || suit === 'diamonds' ? '#8B4513' : '#708090'} />
          <stop offset="40%" stopColor={suit === 'hearts' || suit === 'diamonds' ? '#CD853F' : '#A9A9A9'} />
          <stop offset="70%" stopColor={suit === 'hearts' || suit === 'diamonds' ? '#E8A0BF' : '#C0C0C0'} />
          <stop offset="100%" stopColor={suit === 'hearts' || suit === 'diamonds' ? '#B76E79' : '#778899'} />
        </linearGradient>
      </defs>
      <path d={paths[suit]} fill={`url(#${gradientId})`} />
    </svg>
  );
}

// Ornamental mandala pattern for card back
function CardBackPattern() {
  return (
    <svg
      viewBox="0 0 100 140"
      className="absolute inset-0 w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="140" rx="8" style={{ fill: "var(--color-obsidian)" }} />

      <defs>
        <radialGradient id="cardDepth" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "var(--color-surface-2)" }} />
          <stop offset="100%" style={{ stopColor: "var(--color-void)" }} />
        </radialGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#cardDepth)" />
      <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#centerGlow)" />

      {/* Circuit-board Art Deco mandala */}
      <rect x="8" y="8" width="84" height="124" rx="4" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
      <rect x="12" y="12" width="76" height="116" rx="3" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.2" fill="none" />

      <path d="M16 16 L28 16 L28 20 L20 20 L20 28 L16 28 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
      <path d="M84 16 L72 16 L72 20 L80 20 L80 28 L84 28 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
      <path d="M16 124 L28 124 L28 120 L20 120 L20 112 L16 112 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
      <path d="M84 124 L72 124 L72 120 L80 120 L80 112 L84 112 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />

      <circle cx="50" cy="70" r="30" stroke="#4F46E5" strokeWidth="0.4" strokeOpacity="0.2" fill="none" />
      <circle cx="50" cy="70" r="22" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
      <circle cx="50" cy="70" r="14" stroke="#4F46E5" strokeWidth="0.6" strokeOpacity="0.4" fill="none" />
      <circle cx="50" cy="70" r="6" stroke="#4F46E5" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />

      <line x1="50" y1="40" x2="50" y2="100" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.2" />
      <line x1="20" y1="70" x2="80" y2="70" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.2" />

      <line x1="30" y1="50" x2="70" y2="90" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.15" />
      <line x1="70" y1="50" x2="30" y2="90" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.15" />

      <path d="M50 40 L54 44 L50 48 L46 44 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
      <path d="M50 92 L54 96 L50 100 L46 96 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
      <path d="M20 70 L24 74 L20 78 L16 74 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
      <path d="M80 70 L84 74 L80 78 L76 74 Z" stroke="#4F46E5" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />

      <circle cx="50" cy="70" r="2" fill="#4F46E5" fillOpacity="0.6" />
      <circle cx="50" cy="44" r="1.5" fill="#4F46E5" fillOpacity="0.4" />
      <circle cx="50" cy="96" r="1.5" fill="#4F46E5" fillOpacity="0.4" />
      <circle cx="22" cy="70" r="1.5" fill="#4F46E5" fillOpacity="0.4" />
      <circle cx="78" cy="70" r="1.5" fill="#4F46E5" fillOpacity="0.4" />

      <text x="50" y="73" textAnchor="middle" fontFamily="var(--font-display)" fontSize="8" fontWeight="700" fill="#4F46E5" fillOpacity="0.5">
        MN
      </text>

      <path d="M28 28 L36 36" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.2" />
      <path d="M72 28 L64 36" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.2" />
      <path d="M28 112 L36 104" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.2" />
      <path d="M72 112 L64 104" stroke="#4F46E5" strokeWidth="0.3" strokeOpacity="0.2" />
    </svg>
  );
}

// Face card portrait for J, Q, K with metallic gradient fills
function FaceCardPortrait({ rank, suit }: { rank: string; suit: Suit }) {
  const gradientId = `face-grad-${rank}-${suit}`;
  const isRed = suit === 'hearts' || suit === 'diamonds';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isRed ? '#8B4513' : '#2F4F4F'} />
            <stop offset="40%" stopColor={isRed ? '#CD853F' : '#708090'} />
            <stop offset="70%" stopColor={isRed ? '#E8A0BF' : '#A9A9A9'} />
            <stop offset="100%" stopColor={isRed ? '#B76E79' : '#4A5568'} />
          </linearGradient>
        </defs>
        {rank === 'K' && (
          <>
            <path d="M8 32L12 16L20 24L24 12L28 24L36 16L40 32H8Z" fill={`url(#${gradientId})`} fillOpacity="0.3" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <rect x="8" y="32" width="32" height="6" rx="1" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="1" />
            <circle cx="12" cy="16" r="2" fill={`url(#${gradientId})`} fillOpacity="0.5" />
            <circle cx="24" cy="12" r="2" fill={`url(#${gradientId})`} fillOpacity="0.5" />
            <circle cx="36" cy="16" r="2" fill={`url(#${gradientId})`} fillOpacity="0.5" />
          </>
        )}
        {rank === 'Q' && (
          <>
            <path d="M14 28C14 18 24 10 24 10S34 18 34 28" stroke={`url(#${gradientId})`} strokeWidth="1.5" fill={`url(#${gradientId})`} fillOpacity="0.15" />
            <circle cx="24" cy="14" r="3" stroke={`url(#${gradientId})`} strokeWidth="1" fill={`url(#${gradientId})`} fillOpacity="0.3" />
            <circle cx="18" cy="20" r="2" stroke={`url(#${gradientId})`} strokeWidth="1" fill={`url(#${gradientId})`} fillOpacity="0.2" />
            <circle cx="30" cy="20" r="2" stroke={`url(#${gradientId})`} strokeWidth="1" fill={`url(#${gradientId})`} fillOpacity="0.2" />
            <ellipse cx="24" cy="34" rx="12" ry="8" stroke={`url(#${gradientId})`} strokeWidth="1" fill={`url(#${gradientId})`} fillOpacity="0.1" />
          </>
        )}
        {rank === 'J' && (
          <>
            <path d="M16 30C16 22 20 14 24 14S32 22 32 30" stroke={`url(#${gradientId})`} strokeWidth="1.5" fill={`url(#${gradientId})`} fillOpacity="0.15" />
            <path d="M20 14C18 8 14 10 12 14" stroke={`url(#${gradientId})`} strokeWidth="1.5" fill="none" />
            <path d="M28 14C30 8 34 10 36 14" stroke={`url(#${gradientId})`} strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="14" r="2.5" fill={`url(#${gradientId})`} fillOpacity="0.4" />
            <circle cx="36" cy="14" r="2.5" fill={`url(#${gradientId})`} fillOpacity="0.4" />
            <circle cx="24" cy="10" r="2" fill={`url(#${gradientId})`} fillOpacity="0.3" />
          </>
        )}
      </svg>
    </div>
  );
}

export function PlayingCard({
  card,
  faceUp = false,
  size = 'md',
  highlighted = false,
  dimmed = false,
  onClick,
  className = '',
  style,
}: PlayingCardProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={`card-perspective inline-block ${className}`}
      style={{ width: config.w, height: config.h, ...style }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <motion.div
        className="card-inner relative w-full h-full"
        animate={{
          rotateY: faceUp ? 0 : 180,
          scale: highlighted ? 1.05 : dimmed ? 0.95 : 1,
          opacity: dimmed ? 0.5 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card Face */}
        <div
          className={`
            card-face absolute inset-0 rounded-xl overflow-hidden
            ${highlighted ? 'shadow-[0_0_20px_rgba(79,70,229,0.4)]' : ''}
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Cream background with linen texture */}
          <div className="absolute inset-0 bg-cream rounded-xl" />
          <div
            className="absolute inset-0 rounded-xl opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fillRule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Inner frame — brushed titanium/indigo foil */}
          <div className="absolute inset-[3px] rounded-[9px] border border-indigo-pulse/20" />
          <div className="absolute inset-[6px] rounded-[7px] border border-indigo-pulse/10" />

          {/* Radial vignette */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.08) 100%)',
            }}
          />

          {card && (
            <>
              {/* Top-left corner mark */}
              <div className="absolute top-1.5 left-2 flex flex-col items-center">
                <span
                  className={`font-[family-name:var(--font-display)] font-bold leading-none ${config.rank}`}
                  style={{ color: getSuitColor(card.suit) }}
                >
                  {card.rank}
                </span>
                <SuitIcon suit={card.suit} size={size === 'sm' ? 10 : size === 'md' ? 14 : 20} />
              </div>

              {/* Bottom-right corner mark (rotated) */}
              <div className="absolute bottom-1.5 right-2 flex flex-col items-center rotate-180">
                <span
                  className={`font-[family-name:var(--font-display)] font-bold leading-none ${config.rank}`}
                  style={{ color: getSuitColor(card.suit) }}
                >
                  {card.rank}
                </span>
                <SuitIcon suit={card.suit} size={size === 'sm' ? 10 : size === 'md' ? 14 : 20} />
              </div>

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                {['J', 'Q', 'K'].includes(card.rank) ? (
                  <FaceCardPortrait rank={card.rank} suit={card.suit} />
                ) : (
                  <span
                    className={`font-[family-name:var(--font-display)] font-bold ${config.center}`}
                    style={{ color: getSuitColor(card.suit) }}
                  >
                    <SuitIcon suit={card.suit} size={size === 'sm' ? 20 : size === 'md' ? 36 : 56} />
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Card Back */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CardBackPattern />
          {/* Foil edge border */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(42,42,64,0.8), rgba(79,70,229,0.3), rgba(42,42,64,0.8))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '1.5px',
              borderRadius: '12px',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
