import { useRef } from 'react';
import { gsap } from 'gsap';
import { PlayingCard } from '../components/game/PlayingCard';
import { useGameStore } from '../store/gameStore';
import { ZONE_CONFIG } from '../lib/midnight/types';
import { useScreenTimeline } from '../hooks/useGsap';

export function CardRevealedScreen() {
  const currentRound = useGameStore(s => s.currentRound);
  const setScreen = useGameStore(s => s.setScreen);
  const containerRef = useRef<HTMLDivElement>(null);
  const verifyBarRef = useRef<HTMLDivElement>(null);
  const verifyStatusRef = useRef<HTMLSpanElement>(null);
  const seedRevealRef = useRef<HTMLSpanElement>(null);

  const timelineRef = useScreenTimeline(({ reduceMotion }) => {
    if (!containerRef.current || !currentRound) return;

    const cards = gsap.utils.toArray<HTMLElement>('.reveal-card');
    const flashes = gsap.utils.toArray<HTMLElement>('.card-flash');
    const badges = gsap.utils.toArray<HTMLElement>('.win-badge');
    const verifyBar = verifyBarRef.current;
    const verifyText = verifyStatusRef.current;
    const seedText = seedRevealRef.current;

    if (!cards.length) return;

    if (reduceMotion) {
      cards.forEach((c, i) => {
        gsap.set(c, { opacity: 1, y: 0 });
        if (badges[i]) gsap.set(badges[i], { opacity: 1, scale: 1 });
      });
      if (verifyBar) {
        gsap.set(verifyBar, { width: '100%' });
      }
      if (verifyText) verifyText.textContent = 'Processing...';
      if (seedText) seedText.textContent = currentRound.revealedSeed.substring(0, 16) + '...';
      setTimeout(() => setScreen('result'), 400);
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => setScreen('result'),
    });

    // Cards stagger in
    tl.from(cards, {
      y: 40,
      opacity: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: 'power2.out',
    }, 0);

    // Flash overlays
    flashes.forEach((f, i) => {
      tl.fromTo(f,
        { opacity: 0 },
        { opacity: 0.8, duration: 0.15 },
        0.3 + i * 0.08
      );
      tl.to(f, { opacity: 0, duration: 0.25 }, 0.45 + i * 0.08);
    });

    // Win/loss badges
    badges.forEach((b, i) => {
      tl.fromTo(b,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' },
        0.6 + i * 0.08
      );
    });

    // Verification bar
    if (verifyBar) {
      tl.to(verifyBar, { width: '100%', duration: 2, ease: 'linear' }, 0.8);
    }
    if (verifyText) {
      tl.call(() => { verifyText.textContent = 'Processing...'; }, [], 0.8);
    }
    if (seedText) {
      tl.fromTo(seedText, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.8);
      tl.call(() => {
        seedText.textContent = currentRound.revealedSeed.substring(0, 16) + '...';
      }, [], 1.8);
    }
  }, [currentRound?.id]);

  if (!currentRound) return null;

  const bets = currentRound.bets;

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center overflow-x-hidden pt-8 pb-32">
      {/* Intense spotlight effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-pulse/10 blur-[100px] rounded-full pointer-events-none" />

      <div ref={(el) => {
        containerRef.current = el;
        (timelineRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }} className="relative z-10 w-full max-w-6xl px-4">
        <h2 className="text-center font-[family-name:var(--font-display)] font-bold text-2xl text-silver-light mb-12">
          Independent <em className="font-[family-name:var(--font-accent)] font-semibold italic text-indigo-pulse/90">Zone</em> Draws
        </h2>

        <div className="flex flex-wrap justify-center gap-8 items-start">
          {bets.map((bet, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <h4 className="text-silver-mist text-sm mb-4 font-[family-name:var(--font-display)] bg-surface-2/50 px-3 py-1 rounded-full border border-surface-3/50">
                {ZONE_CONFIG[bet.zone].name}
              </h4>

              <div className="relative">
                <div className="reveal-card">
                  <PlayingCard
                    card={bet.drawnCard!}
                    faceUp={true}
                    size={bets.length > 2 ? 'md' : 'lg'}
                    className="shadow-2xl"
                    highlighted={bet.isWin}
                  />
                </div>
                <div className="card-flash absolute inset-0 bg-white z-20 pointer-events-none rounded-xl opacity-0" />
              </div>

              <div className={`win-badge mt-6 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-lg ${
                bet.isWin
                  ? 'bg-teal-bright/20 text-teal-bright border border-teal-bright/50 shadow-teal-bright/20'
                  : 'bg-surface-2/80 text-silver-mist border border-surface-3 shadow-none'
              }`}>
                {bet.isWin ? 'Winner!' : 'Loss'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Readout */}
      <div className="fixed bottom-8 w-full max-w-md px-6 text-center z-10">
        <div className="glass-panel rounded-xl p-4 border border-surface-3/50 text-left relative overflow-hidden backdrop-blur-xl">
          <p className="text-xs text-silver-light font-medium mb-2 flex items-center justify-between">
            <span>Verifying Draws via Zero-Knowledge</span>
            <span ref={verifyStatusRef} className="verify-status text-indigo-pulse">Ready</span>
          </p>

          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden mb-3">
            <div ref={verifyBarRef} className="verify-bar h-full bg-indigo-pulse shadow-[0_0_10px_rgba(79,70,229,0.8)] w-0" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-[family-name:var(--font-mono)]">
              <span className="text-silver-mist">Commitment:</span>
              <span className="text-silver-light truncate w-40 text-right">{currentRound.commitmentHash.substring(0, 16)}...</span>
            </div>
            <div className="flex justify-between text-[10px] font-[family-name:var(--font-mono)]">
              <span className="text-silver-mist">Revealed Seed:</span>
              <span ref={seedRevealRef} className="seed-reveal text-silver-light truncate w-40 text-right">---</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
