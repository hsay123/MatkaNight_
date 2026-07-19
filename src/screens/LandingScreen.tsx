import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Lock, Target, Lightning } from '@phosphor-icons/react';
import { ButtonWithIcon } from '../components/ui/button-with-icon';
import { FlowButton } from '../components/ui/flow-button';
import { Modal } from '../components/ui/Modal';
import { WalletPickerModal } from '../components/ui/WalletPickerModal';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { RotatingText } from '../components/ui/RotatingText';
import { useGameStore } from '../store/gameStore';

const HERO_CARDS = [
  { rank: 'K', suit: '♠', position: 'top-[10%] left-[5%]', rotate: '-rotate-[12deg]', animDelay: '0s', mobileHide: false },
  { rank: 'A', suit: '♥', position: 'bottom-[10%] left-[5%]', rotate: 'rotate-[10deg]', animDelay: '1.2s', mobileHide: true },
  { rank: 'Q', suit: '♦', position: 'top-[10%] right-[5%]', rotate: 'rotate-[15deg]', animDelay: '0.6s', mobileHide: false },
  { rank: '7', suit: '♣', position: 'bottom-[10%] right-[5%]', rotate: '-rotate-[8deg]', animDelay: '1.8s', mobileHide: true },
];

const LIVE_STATS = [
  { label: 'Rounds Played', value: '12,847' },
  { label: 'Total Wagered', value: '1.2M NIGHT' },
  { label: 'Biggest Win', value: '36x' },
  { label: 'Active Players', value: '342' },
];

const FEATURES = [
  { title: 'Provably Fair', desc: 'Every shuffle verified on-chain via ZK proofs on Midnight Network', Icon: Lock },
  { title: 'Private Bets', desc: 'Your wager amounts stay confidential through zero-knowledge circuits', Icon: Shield },
  { title: '5 Betting Zones', desc: 'From safe 1.35x number bets to high-risk 36x exact card picks', Icon: Target },
  { title: 'Instant Settlement', desc: 'Payouts confirmed in seconds, directly to your Midnight wallet', Icon: Lightning },
];

function truncateAddress(address: string): string {
  if (!address || address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function LandingScreen() {
  const [showRules, setShowRules] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const wallet = useGameStore(s => s.wallet);
  const setScreen = useGameStore(s => s.setScreen);
  const setToast = useGameStore(s => s.setToast);
  const connectingRef = useRef(false);
  const heroRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (wallet.status === 'rejected') {
      setToast({ message: 'Connection rejected. Please try again.', type: 'error' });
    } else if (wallet.status === 'wrong_network') {
      setToast({ message: 'Wrong network detected. Please switch networks in your wallet extension.', type: 'error' });
    } else if (wallet.status === 'no_wallet') {
      setToast({ message: 'No compatible wallet found. Install Lace or 1AM browser extension.', type: 'error' });
    }
  }, [wallet.status, setToast]);

  const handleConnect = () => {
    if (wallet.status === 'connected') {
      setScreen('dashboard');
      return;
    }
    if (wallet.status === 'connecting' || connectingRef.current) return;
    connectingRef.current = true;
    setShowWalletPicker(true);
  };

  const handlePickerClose = () => {
    setShowWalletPicker(false);
    connectingRef.current = false;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const cx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const cy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    cardRefs.current.forEach(card => {
      if (!card) return;
      card.style.transform = `translate(${-cx * 15}px, ${-cy * 15}px)`;
    });
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Top nav */}
      <header className="fixed top-4 left-0 right-0 w-full z-[100] flex justify-center pointer-events-none px-4">
        <nav className="w-full max-w-5xl flex items-center justify-between rounded-full backdrop-blur-xl backdrop-saturate-150 bg-white/50 dark:bg-white/10 border-[1.5px] border-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none py-3 px-6 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-pulse/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 20H10L12 15L14 20H20L12 2Z" fill="#4F46E5" />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-display)] font-bold text-xl text-silver-light">
            Matka<span className="font-[family-name:var(--font-accent)] italic text-indigo-pulse">Night</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle variant="circle-blur" />
          <button onClick={() => setShowRules(true)} className="text-sm text-silver-mist hover:text-silver-light transition-colors cursor-pointer tactile-active">
            Rules
          </button>
          <ButtonWithIcon
            text={wallet.status === 'connected' && wallet.address ? truncateAddress(wallet.address) : 'Connect Wallet'}
            onClick={handleConnect}
            loading={wallet.status === 'connecting'}
          />
        </div>
      </nav>
      </header>

      {/* Hero Section — Centered with 4 floating corner cards */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center py-16 px-4 overflow-hidden"
      >
        {/* 4 Floating playing cards — absolute, z-0, pointer-events-none */}
        {HERO_CARDS.map((card, i) => (
          <div
            key={i}
            ref={el => { cardRefs.current[i] = el; }}
            className={`absolute z-0 pointer-events-none ${card.position} ${card.rotate} ${card.mobileHide ? 'hidden md:block' : ''}`}
            style={{
              animation: `hero-card-float ${3.5 + i * 0.4}s ease-in-out ${card.animDelay} infinite`,
            }}
          >
            <div
              className="hero-card w-[clamp(80px,8vw,140px)] aspect-[5/7] rounded-xl overflow-hidden relative"
            >
              <span
                className="absolute top-2 left-2.5 text-[10px] sm:text-xs md:text-sm font-bold font-[family-name:var(--font-display)]"
                style={{ color: '#e5522d' }}
              >
                {card.rank}
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base sm:text-lg md:text-2xl" style={{ color: '#e5522d' }}>
                  {card.suit}
                </span>
              </div>
              <span
                className="absolute bottom-2 right-2.5 text-[10px] sm:text-xs md:text-sm font-bold font-[family-name:var(--font-display)] rotate-180"
                style={{ color: '#e5522d' }}
              >
                {card.rank}
              </span>
              <div
                className="absolute inset-[3px] rounded-[10px] pointer-events-none"
                style={{ border: '1px solid rgba(84, 66, 220, 0.1)' }}
              />
            </div>
          </div>
        ))}

        {/* Centered hero copy */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl pointer-events-auto">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-pulse/10 border border-indigo-pulse/20 text-indigo-pulse text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-pulse animate-pulse" />
                Built on Midnight Network
              </div>
            </motion.div>

            <motion.h1
              className="font-[family-name:var(--font-display)] font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-silver-light leading-[1.1]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
            One Card.
            <br />
            Provably Fair.
            <br />
            <span className="mt-2 inline-flex items-center justify-center flex-wrap sm:flex-nowrap gap-x-2 sm:gap-x-3">
              <span>Pure</span>
              <RotatingText
                texts={['Conviction', 'Transparency', 'Strategy', 'Fairness', 'Privacy']}
                mainClassName="bg-indigo-pulse text-white px-4 py-1 sm:px-5 sm:py-2 rounded-full overflow-hidden italic font-[family-name:var(--font-accent)] font-semibold inline-flex items-center justify-center w-auto whitespace-nowrap"
                staggerFrom="last"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-120%', opacity: 0 }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1 inline-flex"
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                rotationInterval={2500}
              />
              <span>.</span>
            </span>
          </motion.h1>
          </div>

          <motion.p
            className="text-silver-mist text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            A single-card draw betting game where every shuffle is verifiable, every bet is private,
            and the house edge is transparent. Powered by zero-knowledge proofs on Midnight.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <FlowButton
              text={wallet.status === 'connected' ? 'Enter Game Lobby' : 'Connect Wallet & Play'}
              variant="primary"
              hideArrow
              onClick={handleConnect}
              disabled={wallet.status === 'connecting'}
            />
            <FlowButton text="How It Works" variant="secondary" onClick={() => setShowRules(true)} />
          </motion.div>
        </div>
      </section>

      {/* Live Stats Ticker */}
      <section className="relative z-10 border-y border-surface-3/30 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {LIVE_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <p className="font-bold text-2xl text-silver-light">
                  {stat.value}
                </p>
                <p className="text-xs text-silver-mist mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid — Phosphor Icons */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="group relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(80,71,228,0.15)] hover:bg-white/60 dark:hover:bg-white/10 cursor-default"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-600/10 text-[#5047e4] flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-purple-600/20 shrink-0">
                  <feat.Icon size={20} weight="duotone" className="text-indigo-pulse" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-semibold text-silver-light mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-silver-mist leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Rules Modal */}
      <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="How MatkaNight Works" size="lg">
        <div className="space-y-4 text-sm text-silver-mist">
          <div className="space-y-3">
            <h4 className="font-[family-name:var(--font-display)] font-semibold text-silver-light">The Game</h4>
            <p>MatkaNight is a single-card draw betting game. One card is drawn from a standard 52-card deck each round. You bet on what kind of card will appear.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-[family-name:var(--font-display)] font-semibold text-silver-light">Betting Zones</h4>
            <div className="space-y-2">
              {[
                ['Face Cards (J/Q/K)', '3.5x', '23.1%'],
                ['Exact Face Card', '12x', '1.92%'],
                ['Aces', '12x', '7.69%'],
                ['Number Cards (2–10)', '1.35x', '69.2%'],
                ['Exact Number Card', '36x', '1.92%'],
              ].map(([name, payout, prob]) => (
                <div key={name} className="flex justify-between items-center py-2 border-b border-surface-3/30">
                  <span>{name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-silver-mist">{prob}</span>
                    <span className="font-[family-name:var(--font-display)] font-bold text-indigo-pulse">{payout}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-[family-name:var(--font-display)] font-semibold text-silver-light">Provably Fair</h4>
            <p>Every round uses a commitment-reveal scheme secured by zero-knowledge proofs on the Midnight Network. The shuffle seed is committed before you bet, and verified after the card is drawn. You can independently verify any round's fairness using the on-chain proof data.</p>
          </div>
        </div>
      </Modal>

      <WalletPickerModal isOpen={showWalletPicker} onClose={handlePickerClose} />
    </div>
  );
}
