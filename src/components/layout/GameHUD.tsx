import { useState, useCallback } from 'react';
import { StatPill } from '../ui/StatPill';
import { StreakIndicator } from '../game/StreakIndicator';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useGameStore } from '../../store/gameStore';
import { displayBalance } from '../../lib/midnight/format';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function GameHUD() {
  const wallet = useGameStore(s => s.wallet);
  const streak = useGameStore(s => s.streak);
  const setScreen = useGameStore(s => s.setScreen);
  const disconnectWallet = useGameStore(s => s.disconnectWallet);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = useCallback(async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = wallet.address;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* ignore */ }
    }
  }, [wallet.address]);

  return (
    <header className="fixed top-4 left-0 right-0 w-full z-[100] flex justify-center pointer-events-none px-4">
      <nav className="w-full max-w-5xl flex items-center justify-between rounded-full backdrop-blur-xl backdrop-saturate-150 bg-white/50 dark:bg-white/10 border-[1.5px] border-white dark:border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none pl-6 pr-2 py-1.5 pointer-events-auto transition-all duration-300">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <button
            onClick={() => setScreen('dashboard')}
            className="flex items-center gap-2 cursor-pointer tactile-active"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-pulse/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 18H8L10 13L12 18H17L10 2Z" fill="#4F46E5" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-display)] font-bold text-silver-light text-lg hidden sm:block">
              Matka<span className="font-[family-name:var(--font-accent)] italic text-indigo-pulse">Night</span>
            </span>
          </button>

          {/* Center — Balance pills */}
          <div className="flex items-center gap-3">
            <StatPill
              label="NIGHT"
              value={displayBalance(wallet.nightBalance)}
              glowColor="indigo"
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#4F46E5" strokeWidth="1.5" />
                  <path d="M7 3V7L10 9" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            />
            <StatPill
              label="DUST"
              value={displayBalance(wallet.dustBalance)}
              glowColor="teal"
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2" fill="#0F6E56" />
                  <circle cx="7" cy="7" r="5" stroke="#0F6E56" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
              }
            />
            <StreakIndicator streak={streak} />
          </div>

          {/* Right — Wallet */}
          <div className="flex items-center gap-3">
            <ThemeToggle variant="circle-blur" />
            {wallet.status === 'connected' && (
              <>
                <button
                  onClick={handleCopyAddress}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-full border border-surface-3/50 hover:border-indigo-pulse/30 transition-colors cursor-pointer tactile-active"
                  title="Click to copy address"
                >
                  <div className="w-2 h-2 rounded-full bg-teal-bright animate-pulse" />
                  <span className="text-xs font-[family-name:var(--font-mono)] text-silver-mist">
                    {wallet.address ? truncateAddress(wallet.address) : ''}
                  </span>
                  {copied && (
                    <span className="text-[10px] text-teal-bright font-medium">Copied!</span>
                  )}
                </button>
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-silver-mist hover:text-ember transition-colors cursor-pointer tactile-active"
                  title="Disconnect wallet"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 3H4C3.44772 3 3 3.44772 3 4V14C3 14.5523 3.44772 15 4 15H6" />
                    <path d="M11 6L14 9L11 12" />
                    <path d="M7 9H14" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
