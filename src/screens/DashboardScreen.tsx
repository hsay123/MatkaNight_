import { motion } from 'framer-motion';
import { GameHUD } from '../components/layout/GameHUD';
import { Button } from '../components/ui/Button';
import { SelectZonesButton } from '../components/ui/select-zones-button';
import { useGameStore } from '../store/gameStore';
import type { RoundResult } from '../lib/midnight/types';
import bgGradient from '../assets/blueg.png';
import greenGradient from '../assets/Green.jpeg';

function RoundHistoryCard({ round }: { round: RoundResult }) {
  const timeAgo = Math.floor((Date.now() - round.timestamp) / 60000);
  return (
    <div className="rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${round.isWin ? 'bg-[#2DD4A0]/10 text-[#2DD4A0]' : 'bg-[#E24B4A]/10 text-[#E24B4A]'}`}>
        {round.isWin ? (
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 font-medium truncate">
          {round.drawnCard.rank} of {round.drawnCard.suit}
        </p>
        <p className="text-xs text-slate-500">{timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-[family-name:var(--font-display)] font-bold ${round.isWin ? 'text-[#2DD4A0]' : 'text-[#E24B4A]'}`}>
          {round.isWin ? `+${round.totalPayout.toFixed(1)}` : `-${round.totalWagered.toFixed(1)}`}
        </p>
        <p className="text-[10px] text-slate-500">NIGHT</p>
      </div>
    </div>
  );
}

export function DashboardScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const totalWins = useGameStore(s => s.totalWins);
  const totalLosses = useGameStore(s => s.totalLosses);
  const totalWagered = useGameStore(s => s.totalWagered);
  const totalPayout = useGameStore(s => s.totalPayout);
  const roundHistory = useGameStore(s => s.roundHistory);
  const wallet = useGameStore(s => s.wallet);

  const winRate = totalWins + totalLosses > 0 ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-transparent">
      <GameHUD />

      <main className="relative min-h-screen w-full overflow-hidden pt-24 pb-12 px-4">

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] font-bold text-2xl text-silver-light">Game Lobby</h1>
            <p className="text-sm text-silver-mist mt-1">
              Place your bets. One card decides <em className="font-[family-name:var(--font-accent)] font-semibold italic text-indigo-pulse/90">everything</em>.
            </p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* ─── Left Column (7 cols) ─── */}
          <div className="md:col-span-7 flex flex-col gap-4">

            {/* Start a New Round — light purple */}
            <motion.div
              className="relative overflow-hidden bg-cover bg-center bg-no-repeat text-slate-900 rounded-2xl py-12 md:py-16 px-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 cursor-pointer group"
              style={{ backgroundImage: `url(${bgGradient})` }}
              whileHover={{ scale: 1.01 }}
              onClick={() => setScreen('zone_selection')}
            >
              <div className="mb-4 opacity-60 group-hover:opacity-100 transition-opacity">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto">
                  <rect x="8" y="4" width="48" height="56" rx="8" stroke="#5047e4" strokeWidth="2" />
                  <rect x="14" y="10" width="36" height="44" rx="4" stroke="#5047e4" strokeWidth="1" strokeOpacity="0.3" />
                  <path d="M32 24V40M24 32H40" stroke="#5047e4" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-slate-900 mb-2 text-center">
                Start a New Round
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto text-center">
                Choose your betting zones, set your wager, and watch the card reveal.
                Every shuffle is verified by zero-knowledge proofs.
              </p>
              <div className="mt-6 text-center">
                <SelectZonesButton />
              </div>
            </motion.div>

            {/* Live Table — glassmorphic */}
            <div className="bg-white dark:bg-[#16171d] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-900/5 dark:shadow-none rounded-2xl p-6">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
                  <span>LIVE TABLE</span>
                  <span className="text-[#5047e4]">4 playing now</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/10">
                  <span className="text-sm font-mono text-slate-700 dark:text-slate-300">rk_arjun92</span>
                  <span className="text-sm font-bold text-emerald-500">+240 NIGHT</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/10">
                  <span className="text-sm font-mono text-slate-700 dark:text-slate-300">dusty_queen</span>
                  <span className="text-sm font-bold text-rose-500">-80 NIGHT</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/10">
                  <span className="text-sm font-mono text-slate-500 dark:text-slate-400">mn_shiv...u199</span>
                  <span className="text-sm text-slate-400 dark:text-slate-500 italic">watching</span>
                </div>
              </div>
            </div>

            {/* Daily Bonus — dark blue */}
            <div className="bg-[#0B1E40] text-blue-50 rounded-2xl p-6 shadow-md flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#1A3A6A] flex items-center justify-center shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-[family-name:var(--font-display)] font-semibold text-base">Daily Bonus</h3>
                <p className="text-sm text-blue-200/60 mt-1">Log in daily to earn bonus NIGHT tokens</p>
              </div>
              <Button variant="secondary" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0">
                Claim
              </Button>
            </div>

            {/* Insufficient balance warning */}
            {wallet.nightBalance < 10 && (
              <div className="rounded-2xl bg-[#E24B4A]/10 border border-[#E24B4A]/20 p-4 flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="10" cy="10" r="8" stroke="#E24B4A" strokeWidth="1.5" />
                  <path d="M10 6V11M10 13.5V14" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-sm text-[#E24B4A] font-medium">Insufficient NIGHT Balance</p>
                  <p className="text-xs text-slate-500 mt-1">You need at least 10 NIGHT to place a bet. Top up your wallet to continue playing.</p>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Column (5 cols) ─── */}
          <div className="md:col-span-5 flex flex-col gap-4">

            {/* Win Rate — glassmorphic */}
            <div className="bg-white dark:bg-[#16171d] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-900/5 dark:shadow-none rounded-2xl p-6">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Win Rate</p>
              <p className="font-[family-name:var(--font-display)] font-bold text-3xl text-[#2DD4A0]">{winRate}%</p>
              <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-[#2DD4A0] transition-all duration-500" style={{ width: `${Math.min(Number(winRate), 100)}%` }} />
              </div>
            </div>

            {/* W / L — glassmorphic */}
            <div className="bg-white dark:bg-[#16171d] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-900/5 dark:shadow-none rounded-2xl p-6">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">W / L</p>
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] font-bold text-3xl text-[#2DD4A0]">{totalWins}</span>
                <span className="text-slate-400 text-lg">/</span>
                <span className="font-[family-name:var(--font-display)] font-bold text-3xl text-[#E24B4A]">{totalLosses}</span>
              </div>
            </div>

            {/* Zone Odds — mint green */}
            <div className="relative overflow-hidden z-0 text-slate-900 rounded-2xl p-6 shadow-sm">
              {/* Maximum Compressed Background Layer */}
              <div 
                className="absolute top-1/2 left-1/2 w-full aspect-square -translate-x-1/2 -translate-y-1/2 -z-10 -rotate-90 opacity-[0.85] bg-[size:100%_100%]"
                style={{ backgroundImage: `url(${greenGradient})` }}
              />
              <h3 className="font-[family-name:var(--font-display)] font-bold text-sm text-black dark:text-white mb-3 uppercase tracking-wider">Zone Odds</h3>
              <div className="space-y-2">
                {[
                  { zone: 'Face Cards (J/Q/K)', odds: '3.5x', color: 'text-[#5047e4]' },
                  { zone: 'Number Cards (2-10)', odds: '2.0x', color: 'text-[#5047e4]' },
                  { zone: 'Ace', odds: '15x', color: 'text-[#5047e4]' },
                  { zone: 'Red (♥/♦)', odds: '2.0x', color: 'text-[#E24B4A]' },
                  { zone: 'Black (♠/♣)', odds: '2.0x', color: 'text-slate-900' },
                ].map((row) => (
                  <div key={row.zone} className="flex items-center justify-between py-1.5 border-b border-black/20 dark:border-white/20 last:border-0">
                    <span className="text-sm font-semibold text-black dark:text-white">{row.zone}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.odds}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Wagered — glassmorphic */}
            <div className="bg-white dark:bg-[#16171d] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-900/5 dark:shadow-none rounded-2xl p-6">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Total Wagered</p>
              <p className="font-[family-name:var(--font-display)] font-bold text-3xl text-slate-900 dark:text-white">{totalWagered.toFixed(0)}</p>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-slate-500">NIGHT</p>
                <span className="text-slate-300">·</span>
                <p className="text-xs text-slate-500">Payout: <span className="text-[#2DD4A0] font-medium">{totalPayout.toFixed(0)}</span></p>
              </div>
            </div>
          </div>

          {/* ─── Bottom Row (full width) ─── */}
          <div className="col-span-1 md:col-span-12">
            <div className="bg-white dark:bg-[#16171d] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-900/5 dark:shadow-none rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-[family-name:var(--font-display)] font-semibold text-slate-900 dark:text-white text-sm">
                  Round History
                </h3>
                <span className="text-xs text-slate-500">{roundHistory.length} rounds</span>
              </div>

              {roundHistory.length === 0 ? (
                <div className="border border-dashed border-[#5047e4]/20 rounded-xl text-center py-12">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-3 opacity-30">
                    <rect x="8" y="4" width="32" height="40" rx="6" stroke="#5047e4" strokeWidth="1.5" />
                    <path d="M16 18H32M16 24H28M16 30H24" stroke="#5047e4" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-slate-500">No rounds played yet</p>
                  <p className="text-xs text-slate-400 mt-1">Your results will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {roundHistory.map((round) => (
                    <RoundHistoryCard key={round.id} round={round} />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
        </div>
      </main>
    </div>
  );
}
