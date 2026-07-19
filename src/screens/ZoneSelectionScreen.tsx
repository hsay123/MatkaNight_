import { motion } from 'framer-motion';
import { GameHUD } from '../components/layout/GameHUD';
import { ZoneCard } from '../components/game/ZoneCard';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import type { Bet } from '../lib/midnight/types';
import { ZONE_CONFIG, type BettingZone } from '../lib/midnight/types';

const ZONES: BettingZone[] = ['face_cards', 'exact_face_card', 'aces', 'number_cards', 'exact_number_card'];

export function ZoneSelectionScreen() {
  const selectedZones = useGameStore(s => s.selectedZones);
  const toggleZone = useGameStore(s => s.toggleZone);
  const setScreen = useGameStore(s => s.setScreen);
  const setBets = useGameStore(s => s.setBets);

  const handleContinue = () => {
    const initialBets = selectedZones.map(zone => ({ zone, amount: 50 } as Bet));
    setBets(initialBets);
    setScreen('exact_card_picker');
  };

  return (
    <div className="min-h-screen bg-void">
      <GameHUD />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => setScreen('dashboard')} className="text-xs text-silver-mist hover:text-silver-light transition-colors mb-2 flex items-center gap-1 cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3L5 7L9 11" /></svg>
              Back to Lobby
            </button>
            <h1 className="font-[family-name:var(--font-display)] font-bold text-2xl text-silver-light">Choose Your Zones</h1>
            <p className="text-sm text-silver-mist mt-1">Select one or more betting zones. Multi-zone bets are independent.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {ZONES.map((zone, i) => (
            <motion.div key={zone} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <ZoneCard zone={zone} selected={selectedZones.includes(zone)} onToggle={() => toggleZone(zone)} />
            </motion.div>
          ))}
        </div>

        {/* Floating summary panel */}
        {selectedZones.length > 0 && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 glass-panel rounded-2xl p-4 flex items-center gap-6 border border-indigo-pulse/20"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="text-sm text-silver-mist">
                <span className="font-[family-name:var(--font-display)] font-bold text-silver-light">{selectedZones.length}</span> zone{selectedZones.length > 1 ? 's' : ''} selected
              </div>
              <div className="h-6 w-px bg-surface-3" />
              <div className="flex gap-2">
                {selectedZones.map(z => (
                  <span key={z} className="px-2 py-0.5 bg-indigo-pulse/10 border border-indigo-pulse/20 rounded-md text-xs text-indigo-pulse font-medium">
                    {ZONE_CONFIG[z].payout}x
                  </span>
                ))}
              </div>
            </div>
            <Button variant="primary" size="md" onClick={handleContinue}>
              Pick Predictions →
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
