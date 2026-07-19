import { useState } from 'react';
import { motion } from 'framer-motion';

const CARDS = [
  { rank: 'K', suit: 'spades', symbol: '♠' },
  { rank: 'A', suit: 'hearts', symbol: '♥' },
  { rank: 'Q', suit: 'diamonds', symbol: '♦' },
  { rank: '7', suit: 'clubs', symbol: '♣' },
  { rank: 'J', suit: 'hearts', symbol: '♥' },
];

const FAN = [
  { x: -80, y: -15, rotate: -12 },
  { x: -40, y: 10, rotate: -5 },
  { x: 0, y: -5, rotate: 0 },
  { x: 40, y: 15, rotate: 5 },
  { x: 80, y: -10, rotate: 12 },
];

export function CardStack() {
  const [entered, setEntered] = useState(false);

  return (
    <div
      className="relative h-[350px] w-full flex items-center justify-center rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0e0d1a, #17162b)',
        border: '1px solid rgba(84, 66, 220, 0.2)',
        perspective: '1000px',
      }}
    >
      <div
        className="absolute w-[200px] h-[200px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(84, 66, 220, 0.3), transparent)' }}
      />

      {CARDS.map((card, i) => {
        const fan = FAN[i];

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-50px',
              marginTop: '-70px',
              transformStyle: 'preserve-3d',
            }}
            initial={{
              y: 80 + i * 15,
              x: fan.x * 0.3,
              rotateX: 20,
              rotateY: fan.rotate * 0.5,
              scale: 0.85,
              opacity: 0,
            }}
            animate={entered
              ? {
                  x: fan.x,
                  y: [fan.y, fan.y - 8 - i, fan.y],
                  rotateX: 0,
                  rotateY: fan.rotate,
                  scale: 1,
                  opacity: 1,
                }
              : {
                  x: fan.x,
                  y: fan.y,
                  rotateX: 0,
                  rotateY: fan.rotate,
                  scale: 1,
                  opacity: 1,
                }
            }
            transition={entered
              ? {
                  x: { duration: 0 },
                  y: { duration: 2.5 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 },
                  rotateX: { duration: 0 },
                  rotateY: { duration: 0 },
                  scale: { duration: 0 },
                  opacity: { duration: 0 },
                }
              : {
                  duration: 0.9 + i * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: i * 0.1 + 0.3,
                }
            }
            onAnimationComplete={() => {
              if (i === CARDS.length - 1) setEntered(true);
            }}
          >
            <div
              className="w-[100px] h-[140px] rounded-xl overflow-hidden relative"
              style={{
                background: '#1e1c38',
                border: '1px solid rgba(84, 66, 220, 0.25)',
                boxShadow: `0 ${4 + i * 2}px ${12 + i * 4}px rgba(0, 0, 0, ${0.3 + i * 0.05}), 0 0 20px rgba(84, 66, 220, 0.05)`,
              }}
            >
              <span
                className="absolute top-2 left-2.5 text-sm font-bold font-[family-name:var(--font-display)]"
                style={{ color: '#e5522d' }}
              >
                {card.rank}
              </span>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl" style={{ color: '#e5522d' }}>
                  {card.symbol}
                </span>
              </div>

              <span
                className="absolute bottom-2 right-2.5 text-sm font-bold font-[family-name:var(--font-display)] rotate-180"
                style={{ color: '#e5522d' }}
              >
                {card.rank}
              </span>

              <div
                className="absolute inset-[3px] rounded-[10px] pointer-events-none"
                style={{ border: '1px solid rgba(84, 66, 220, 0.1)' }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
