import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface FloatingContextValue {
  mousePosition: { x: number; y: number };
  sensitivity: number;
}

const FloatingContext = createContext<FloatingContextValue>({
  mousePosition: { x: 0, y: 0 },
  sensitivity: -0.5,
});

interface FloatingProps {
  children: ReactNode;
  className?: string;
  sensitivity?: number;
}

export function Floating({ children, className = '', sensitivity = -0.5 }: FloatingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    targetRef.current = {
      x: (e.clientX - centerX) / (rect.width / 2),
      y: (e.clientY - centerY) / (rect.height / 2),
    };
  }, []);

  useEffect(() => {
    const update = () => {
      setMousePosition(prev => ({
        x: prev.x + (targetRef.current.x - prev.x) * 0.1,
        y: prev.y + (targetRef.current.y - prev.y) * 0.1,
      }));
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <FloatingContext.Provider value={{ mousePosition, sensitivity }}>
      <div ref={containerRef} className={`relative w-full h-full ${className}`}>
        {children}
      </div>
    </FloatingContext.Provider>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  depth?: number;
  className?: string;
  style?: CSSProperties;
}

export function FloatingElement({ children, depth = 1, className = '', style }: FloatingElementProps) {
  const { mousePosition, sensitivity } = useContext(FloatingContext);

  const x = mousePosition.x * depth * sensitivity * 30;
  const y = mousePosition.y * depth * sensitivity * 30;

  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        ...style,
        transform: `translate(${x}px, ${y}px)`,
        willChange: 'transform',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
