import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { GameHUD } from '../components/layout/GameHUD';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ZONE_CONFIG } from '../lib/midnight/types';
import confetti from 'canvas-confetti';
import { useScreenTimeline } from '../hooks/useGsap';

export function ResultScreen() {
  const currentRound = useGameStore(s => s.currentRound);
  const setScreen = useGameStore(s => s.setScreen);
  const resetForNewRound = useGameStore(s => s.resetForNewRound);
  const addToHistory = useGameStore(s => s.addToHistory);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (currentRound?.isWin) {
      const duration = 1500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#0F6E56', '#10B981', '#4F46E5'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#0F6E56', '#10B981', '#4F46E5'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [currentRound?.isWin]);

  const timelineRef = useScreenTimeline(({ reduceMotion }) => {
    if (!containerRef.current || !currentRound) return;

    const headline = containerRef.current.querySelector<HTMLElement>('.result-headline');
    const amount = containerRef.current.querySelector<HTMLElement>('.result-amount');
    const breakdown = containerRef.current.querySelector<HTMLElement>('.breakdown-panel');
    const rows = gsap.utils.toArray<HTMLElement>('.bet-row');

    if (reduceMotion) {
      if (headline) headline.style.opacity = '1';
      if (amount) amount.style.opacity = '1';
      if (breakdown) breakdown.style.opacity = '1';
      rows.forEach((r) => { r.style.opacity = '1'; });
      return;
    }

    const tl = gsap.timeline();

    // Headline scale-in
    tl.fromTo(headline,
      { scale: 0.9, opacity: 0, y: -10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' },
      0
    );

    // Amount slide up
    tl.fromTo(amount,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      0.2
    );

    // Breakdown panel fade in
    tl.fromTo(breakdown,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      0.35
    );

    // Rows stagger
    tl.from(rows, {
      opacity: 0,
      x: -10,
      duration: 0.3,
      stagger: 0.06,
      ease: 'power2.out',
    }, 0.45);

  }, [currentRound?.id]);

  const handleNextRound = () => {
    if (currentRound) addToHistory(currentRound);
    resetForNewRound();
  };

  const handleViewSummary = () => setScreen('round_summary');

  if (!currentRound) return null;

  const { isWin, totalPayout, bets } = currentRound;

  return (
    <div className="min-h-screen bg-void flex flex-col relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[100px] rounded-full pointer-events-none opacity-20"
        style={{ backgroundColor: isWin ? '#0F6E56' : '#E24B4A' }}
      />

      <GameHUD />

      <main ref={(el) => {
        containerRef.current = el;
        (timelineRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }} className="flex-1 max-w-2xl mx-auto w-full px-4 pt-24 pb-8 flex flex-col items-center justify-center">
        <div className="text-center w-full">
          <h1 className={`result-headline font-[family-name:var(--font-display)] font-bold text-5xl mb-2 ${isWin ? 'text-teal-bright' : 'text-ember'}`}>
            {isWin ? (
              <>You <em className="font-[family-name:var(--font-accent)] font-semibold italic">Won</em>!</>
            ) : 'Loss'}
          </h1>

          <p className="result-amount font-[family-name:var(--font-display)] font-bold text-3xl text-silver-light mb-12">
            {isWin ? `+${totalPayout.toFixed(1)} NIGHT` : `-${currentRound.totalWagered.toFixed(1)} NIGHT`}
          </p>

          <div className="breakdown-panel glass-panel rounded-xl overflow-hidden mb-8 w-full border-surface-3/50 text-left">
            <div className="p-4 border-b border-surface-3/30 bg-surface-2/30">
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-silver-light text-sm">Zone Breakdown</h3>
            </div>
            <div className="divide-y divide-surface-3/20">
              {bets.map(bet => {
                const zone = ZONE_CONFIG[bet.zone];
                const betWon = bet.isWin;
                const payout = bet.payout || 0;

                return (
                  <div key={bet.zone} className="bet-row p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${betWon ? 'bg-teal-bright/10 text-teal-bright' : 'bg-surface-2 text-silver-mist'}`}>
                        {betWon ? (
                          <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-silver-light">
                          {zone.name}
                          {bet.exactCard && <span className="text-xs text-indigo-pulse ml-1">({bet.exactCard.rank} of {bet.exactCard.suit})</span>}
                          {bet.rankPrediction && <span className="text-xs text-indigo-pulse ml-1">({bet.rankPrediction})</span>}
                          {bet.suitPrediction && <span className="text-xs text-indigo-pulse ml-1">({bet.suitPrediction})</span>}
                        </p>
                        <p className="text-[11px] text-teal-bright font-mono mt-0.5">Drawn: {bet.drawnCard?.rank} of {bet.drawnCard?.suit}</p>
                        <p className="text-xs text-silver-mist mt-0.5">{bet.amount} NIGHT wagered</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-[family-name:var(--font-display)] font-bold text-sm ${betWon ? 'text-teal-bright' : 'text-silver-mist'}`}>
                        {betWon ? `+${payout.toFixed(1)} NIGHT` : '0 NIGHT'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button variant="secondary" size="lg" className="result-btn flex-1" onClick={handleViewSummary}>
              Verification Summary
            </Button>
            <Button variant="primary" size="lg" className="result-btn flex-1" onClick={handleNextRound}>
              Next Round →
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
