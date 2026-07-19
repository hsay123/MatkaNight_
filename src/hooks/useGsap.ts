import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { RoughEase } from 'gsap/EasePack';

gsap.registerPlugin(useGSAP, RoughEase);

let mm: ReturnType<typeof gsap.matchMedia> | null = null;

function getMatchMedia() {
  if (!mm) mm = gsap.matchMedia();
  return mm;
}

export function addReducedMotionQuery(
  _id: string,
  handler: (context: { reduceMotion: boolean }) => void | (() => void)
) {
  const m = getMatchMedia();
  m.add(
    { reduceMotion: '(prefers-reduced-motion: reduce)' },
    (context) => {
      handler({ reduceMotion: (context.conditions as Record<string, boolean>).reduceMotion ?? false });
    }
  );
  return () => m.revert();
}

export function useScreenTimeline(
  setup: (context: { reduceMotion: boolean }) => gsap.core.Timeline | void,
  deps: React.DependencyList = []
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setup({ reduceMotion: mql.matches });
      const handleChange = () => setup({ reduceMotion: mql.matches });
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    },
    { scope: containerRef, dependencies: [...deps] }
  );

  return containerRef;
}

export function useGsapContext(
  setup: () => void,
  deps: React.DependencyList = []
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      setup();
    },
    { scope: containerRef, dependencies: [...deps] }
  );

  return containerRef;
}
