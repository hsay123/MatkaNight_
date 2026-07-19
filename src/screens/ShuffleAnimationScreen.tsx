import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { PlayingCard } from '../components/game/PlayingCard';
import { useGameStore } from '../store/gameStore';
import { useScreenTimeline } from '../hooks/useGsap';

export function ShuffleAnimationScreen() {
  const revealAndSettle = useGameStore(s => s.revealAndSettle);
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseLabelRef = useRef<HTMLParagraphElement>(null);
  const ambientGlowRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const runTimeline = useCallback(({ reduceMotion }: { reduceMotion: boolean }) => {
    if (!containerRef.current) return;

    const cards = gsap.utils.toArray<HTMLElement>('.shuffle-card');
    const phaseLabel = phaseLabelRef.current;
    const spotlight = spotlightRef.current;
    const ambientGlow = ambientGlowRef.current;

    if (!cards.length || !phaseLabel) return;

    const labels = [
      'Committing Deck...',
      'Shuffling with ZK Randomness...',
      'Applying Offset...',
      'Drawing Card...',
      '<em class="font-[family-name:var(--font-accent)] font-semibold italic text-indigo-pulse/90">Revealing</em>...',
    ];

    function setPhaseLabel(idx: number) {
      if (!phaseLabel) return;
      gsap.to(phaseLabel, {
        opacity: 0, y: -8, duration: 0.15,
        onComplete: () => {
          phaseLabel.innerHTML = labels[idx];
          gsap.to(phaseLabel, { opacity: 1, y: 0, duration: 0.2 });
        },
      });
    }

    if (reduceMotion) {
      cards.forEach((c, i) => {
        gsap.set(c, {
          x: i === 4 ? 0 : (i - 2) * 2,
          y: i === 4 ? -40 : 40,
          rotate: 0,
          scale: i === 4 ? 1.2 : 0.9,
          opacity: i === 4 ? 1 : 0.3,
        });
      });
      if (spotlight) gsap.set(spotlight, { opacity: 1 });
      if (ambientGlow) gsap.set(ambientGlow, { scale: 1.2, opacity: 0.8 });
      phaseLabel.innerHTML = labels[4];
      setTimeout(() => revealAndSettle(), 300);
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => revealAndSettle(),
    });

    // Phase 1: Fan (0–0.8s)
    tl.call(() => setPhaseLabel(0));
    cards.forEach((c, i) => {
      gsap.set(c, { opacity: 0, y: 60, scale: 0.8, rotate: 0 });
      tl.to(c, {
        opacity: 1,
        y: 0,
        x: (i - 2) * 20,
        rotate: (i - 2) * 8,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      }, 0.05 * i);
    });
    tl.to({}, { duration: 0.5 }, 0.3);

    // Phase 2: Shuffle (0.8–1.6s) — rapid jittery cross-movement
    tl.call(() => setPhaseLabel(1));
    tl.to(ambientGlow, { scale: 1.2, opacity: 0.8, duration: 0.4, ease: 'sine.inOut' }, 0.8);
    tl.to(ambientGlow, { scale: 1, opacity: 0.5, duration: 0.4, ease: 'sine.inOut' }, 1.2);

    for (let t = 0.8; t < 1.6; t += 0.08) {
      cards.forEach((c, i) => {
        tl.to(c, {
          x: (i % 2 === 0 ? 1 : -1) * (gsap.utils.random(10, 40)),
          y: gsap.utils.random(-8, 8),
          rotate: gsap.utils.random(-8, 8),
          duration: 0.07,
          ease: 'rough({ strength: 2, points: 3, template: none, taper: none, randomize: true, clamp: false })',
        }, t);
      });
    }

    // Phase 3: Cut (1.6–1.9s)
    tl.call(() => setPhaseLabel(2));
    cards.forEach((c, i) => {
      if (i > 2) {
        tl.to(c, { x: 60, y: 20, rotate: 5, duration: 0.2, ease: 'power2.inOut' }, 1.6);
      } else {
        tl.to(c, { x: -20, y: 0, rotate: -2, duration: 0.2, ease: 'power2.inOut' }, 1.6);
      }
    });

    // Phase 4: Deal (1.9–2.3s) — top card rises, rest fade
    tl.call(() => setPhaseLabel(3));
    if (spotlight) {
      tl.to(spotlight, { opacity: 1, duration: 0.3 }, 1.9);
    }
    cards.forEach((c, i) => {
      const isTop = i === 4;
      tl.to(c, {
        x: isTop ? 0 : (i - 1.5) * 2,
        y: isTop ? -40 : 40,
        scale: isTop ? 1.2 : 0.9,
        opacity: isTop ? 1 : 0.3,
        zIndex: isTop ? 10 : i,
        duration: 0.3,
        ease: 'power3.out',
      }, 1.9);
    });

    // Phase 5: Flip (2.3–2.8s) — top card pulses, then transition
    tl.call(() => setPhaseLabel(4));
    tl.to(cards[4], {
      scale: 1.3,
      duration: 0.2,
      ease: 'power2.out',
    }, 2.3);
    tl.to(cards[4], {
      scale: 1.2,
      duration: 0.2,
      ease: 'power2.in',
    }, 2.5);
  }, [revealAndSettle]);

  const fanRef = useScreenTimeline(runTimeline);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center overflow-hidden">
      {/* Background ambient glow */}
      <div
        ref={ambientGlowRef}
        className="ambient-glow absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.1)_0%,transparent_50%)]"
      />

      <div
        ref={(el) => {
          containerRef.current = el;
          (fanRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="relative w-[300px] h-[400px] flex items-center justify-center"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shuffle-card absolute will-change-transform"
          >
            <PlayingCard
              size="lg"
              faceUp={false}
              className="shadow-2xl"
            />
          </div>
        ))}

        {/* Spotlight */}
        <div ref={spotlightRef} className="spotlight absolute top-[-40px] left-1/2 -translate-x-1/2 w-[200px] h-[300px] bg-indigo-pulse/20 blur-[60px] rounded-full z-0 pointer-events-none opacity-0" />
      </div>

      {/* Phase label */}
      <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
        <p ref={phaseLabelRef} className="phase-label text-silver-mist font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest">
          Committing Deck...
        </p>
      </div>
    </div>
  );
}
