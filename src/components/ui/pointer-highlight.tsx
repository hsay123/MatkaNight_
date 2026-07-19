import { useRef, useState, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface PointerHighlightProps {
  children: ReactNode;
  className?: string;
}

export function PointerHighlight({ children, className = '' }: PointerHighlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 25, stiffness: 300 });
  const springY = useSpring(mouseY, { damping: 25, stiffness: 300 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Border highlight */}
      <motion.div
        className="absolute inset-[-2px] rounded-lg pointer-events-none"
        style={{
          border: '1.5px solid rgba(129, 113, 255, 0.5)',
          boxShadow: '0 0 20px rgba(129, 113, 255, 0.15), inset 0 0 20px rgba(129, 113, 255, 0.03)',
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      {/* Cursor-tracking glow */}
      <motion.div
        className="absolute w-28 h-28 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(129, 113, 255, 0.18), transparent 70%)',
          left: springX,
          top: springY,
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
