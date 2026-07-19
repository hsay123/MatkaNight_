import { motion } from 'framer-motion';
import { GameHUD } from '../components/layout/GameHUD';
import { PlayingCard } from '../components/game/PlayingCard';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { type Rank, type Suit } from '../lib/midnight/types';

const SUITS: { id: Suit; label: string; icon: string; color: string }[] = [
  { id: 'hearts', label: 'Hearts', icon: '♥', color: '#E24B4A' },
  { id: 'diamonds', label: 'Diamonds', icon: '♦', color: '#E24B4A' },
  { id: 'clubs', label: 'Clubs', icon: '♣', color: '#A0A0B8' },
  { id: 'spades', label: 'Spades', icon: '♠', color: '#A0A0B8' },
];

function RankButtons({ availableRanks, selectedRank, onSelect }: { availableRanks: Rank[], selectedRank: Rank | null, onSelect: (r: Rank) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {availableRanks.map(rank => (
        <motion.button
          key={rank}
          onClick={() => onSelect(rank)}
          className={`
            w-10 h-12 rounded-lg font-[family-name:var(--font-display)] font-bold text-base cursor-pointer transition-all
            ${selectedRank === rank 
              ? 'bg-indigo-pulse text-white shadow-[0_0_10px_rgba(79,70,229,0.4)] border border-indigo-pulse' 
              : 'bg-surface-2 text-silver-mist border border-surface-3 hover:border-indigo-pulse/50 hover:bg-surface-3 hover:text-silver-light'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {rank}
        </motion.button>
      ))}
    </div>
  );
}

function SuitButtons({ selectedSuit, onSelect }: { selectedSuit: Suit | null, onSelect: (s: Suit) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SUITS.map(suit => (
        <motion.button
          key={suit.id}
          onClick={() => onSelect(suit.id)}
          className={`
            flex items-center justify-center gap-2 py-3 rounded-lg cursor-pointer transition-all
            ${selectedSuit === suit.id 
              ? 'bg-indigo-pulse/10 border border-indigo-pulse shadow-[0_0_10px_rgba(79,70,229,0.2)] text-silver-light' 
              : 'bg-surface-2 border border-surface-3 hover:border-indigo-pulse/50 hover:bg-surface-3 text-silver-mist'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xl" style={{ color: suit.color }}>{suit.icon}</span>
          <span className="font-medium text-sm">{suit.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function SectionWrapper({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-12 glass-panel p-6 rounded-xl border border-surface-3/30">
      <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-silver-light border-b border-surface-3 pb-3 mb-6">{title}</h2>
      {children}
    </div>
  );
}

export function ExactCardPickerScreen() {
  const selectedZones = useGameStore(s => s.selectedZones);
  const exactCardFace = useGameStore(s => s.exactCardFace);
  const setExactCardFace = useGameStore(s => s.setExactCardFace);
  const exactCardNumber = useGameStore(s => s.exactCardNumber);
  const setExactCardNumber = useGameStore(s => s.setExactCardNumber);
  const faceCardRank = useGameStore(s => s.faceCardRank);
  const setFaceCardRank = useGameStore(s => s.setFaceCardRank);
  const numberCardRank = useGameStore(s => s.numberCardRank);
  const setNumberCardRank = useGameStore(s => s.setNumberCardRank);
  const acesSuit = useGameStore(s => s.acesSuit);
  const setAcesSuit = useGameStore(s => s.setAcesSuit);
  const setScreen = useGameStore(s => s.setScreen);
  const bets = useGameStore(s => s.bets);
  const setBets = useGameStore(s => s.setBets);

  const needsExactFace = selectedZones.includes('exact_face_card');
  const needsExactNumber = selectedZones.includes('exact_number_card');
  const needsFaceRank = selectedZones.includes('face_cards');
  const needsNumberRank = selectedZones.includes('number_cards');
  const needsAcesSuit = selectedZones.includes('aces');

  const canProceed = 
    (!needsExactFace || exactCardFace !== null) &&
    (!needsExactNumber || exactCardNumber !== null) &&
    (!needsFaceRank || faceCardRank !== null) &&
    (!needsNumberRank || numberCardRank !== null) &&
    (!needsAcesSuit || acesSuit !== null);

  const handleProceed = () => {
    const updated = bets.map(b => {
      if (b.zone === 'exact_face_card' && exactCardFace) return { ...b, exactCard: exactCardFace };
      if (b.zone === 'exact_number_card' && exactCardNumber) return { ...b, exactCard: exactCardNumber };
      if (b.zone === 'face_cards' && faceCardRank) return { ...b, rankPrediction: faceCardRank };
      if (b.zone === 'number_cards' && numberCardRank) return { ...b, rankPrediction: numberCardRank };
      if (b.zone === 'aces' && acesSuit) return { ...b, suitPrediction: acesSuit };
      return b;
    });
    setBets(updated);
    setScreen('bet_amount');
  };

  return (
    <div className="min-h-screen bg-void">
      <GameHUD />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8 pb-32">
        <button onClick={() => setScreen('zone_selection')} className="text-xs text-silver-mist hover:text-silver-light transition-colors mb-4 flex items-center gap-1 cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3L5 7L9 11" /></svg>
          Back to Zones
        </button>

        <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl text-silver-light mb-2">Pick Your Predictions</h1>
        <p className="text-sm text-silver-mist mb-8">Select your prediction for each zone to proceed.</p>

        {needsFaceRank && (
          <SectionWrapper title="Face Cards (Pick Rank)">
            <RankButtons 
              availableRanks={['J', 'Q', 'K']} 
              selectedRank={faceCardRank} 
              onSelect={setFaceCardRank} 
            />
          </SectionWrapper>
        )}

        {needsExactFace && (
          <SectionWrapper title="Exact Face Card (Pick Rank & Suit)">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-silver-light mb-2">1. Select Rank</h3>
                  <RankButtons 
                    availableRanks={['J', 'Q', 'K']} 
                    selectedRank={exactCardFace?.rank || null} 
                    onSelect={r => setExactCardFace({ rank: r, suit: exactCardFace?.suit || 'hearts' })} 
                  />
                </div>
                <div>
                  <h3 className="text-sm text-silver-light mb-2">2. Select Suit</h3>
                  <SuitButtons 
                    selectedSuit={exactCardFace?.suit || null} 
                    onSelect={s => setExactCardFace({ rank: exactCardFace?.rank || 'J', suit: s })} 
                  />
                </div>
              </div>
              <div className="flex justify-center items-center">
                {exactCardFace ? (
                  <PlayingCard card={exactCardFace} faceUp size="md" highlighted className="shadow-2xl" />
                ) : (
                  <div className="w-[120px] h-[168px] rounded-xl border-2 border-dashed border-surface-3/50 flex items-center justify-center bg-surface-2/30">
                    <span className="text-xs text-silver-mist">Select Card</span>
                  </div>
                )}
              </div>
            </div>
          </SectionWrapper>
        )}

        {needsAcesSuit && (
          <SectionWrapper title="Aces (Pick Suit)">
            <SuitButtons 
              selectedSuit={acesSuit} 
              onSelect={setAcesSuit} 
            />
          </SectionWrapper>
        )}

        {needsNumberRank && (
          <SectionWrapper title="Number Cards (Pick Rank)">
            <RankButtons 
              availableRanks={['2', '3', '4', '5', '6', '7', '8', '9', '10']} 
              selectedRank={numberCardRank} 
              onSelect={setNumberCardRank} 
            />
          </SectionWrapper>
        )}

        {needsExactNumber && (
          <SectionWrapper title="Exact Number Card (Pick Rank & Suit)">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-silver-light mb-2">1. Select Rank</h3>
                  <RankButtons 
                    availableRanks={['2', '3', '4', '5', '6', '7', '8', '9', '10']} 
                    selectedRank={exactCardNumber?.rank || null} 
                    onSelect={r => setExactCardNumber({ rank: r, suit: exactCardNumber?.suit || 'hearts' })} 
                  />
                </div>
                <div>
                  <h3 className="text-sm text-silver-light mb-2">2. Select Suit</h3>
                  <SuitButtons 
                    selectedSuit={exactCardNumber?.suit || null} 
                    onSelect={s => setExactCardNumber({ rank: exactCardNumber?.rank || '7', suit: s })} 
                  />
                </div>
              </div>
              <div className="flex justify-center items-center">
                {exactCardNumber ? (
                  <PlayingCard card={exactCardNumber} faceUp size="md" highlighted className="shadow-2xl" />
                ) : (
                  <div className="w-[120px] h-[168px] rounded-xl border-2 border-dashed border-surface-3/50 flex items-center justify-center bg-surface-2/30">
                    <span className="text-xs text-silver-mist">Select Card</span>
                  </div>
                )}
              </div>
            </div>
          </SectionWrapper>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 glass-panel border-t border-surface-3/30 z-30 flex justify-center">
        <Button 
          variant="primary" 
          size="lg" 
          disabled={!canProceed}
          onClick={handleProceed}
          className="min-w-[240px]"
        >
          Confirm Selection →
        </Button>
      </div>
    </div>
  );
}
