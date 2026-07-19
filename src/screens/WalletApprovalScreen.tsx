import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getWalletDisplayName, walletService } from '../lib/midnight/wallet';

export function WalletApprovalScreen() {
  const wallet = useGameStore(s => s.wallet);
  const walletName = getWalletDisplayName(wallet.name, wallet.rdns);
  const activeWallet = walletService.getActiveWallet();
  const walletAccent = wallet.rdns?.toLowerCase().includes('1am') ? '#F59E0B' : '#4F46E5';

  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="absolute inset-0 bg-void/90 backdrop-blur-md" />
      <motion.div
        className="relative glass-panel rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* Wallet icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-surface-2/50 border border-surface-3/50 flex items-center justify-center overflow-hidden">
          {activeWallet?.icon ? (
            <img src={activeWallet.icon} alt={walletName} className="w-full h-full object-cover" />
          ) : (
            <motion.svg
              width="32" height="32" viewBox="0 0 32 32" fill="none"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <rect x="4" y="8" width="24" height="18" rx="3" stroke={walletAccent} strokeWidth="2" />
              <rect x="4" y="8" width="24" height="6" rx="0" fill={walletAccent} fillOpacity="0.2" />
              <circle cx="22" cy="19" r="2" fill={walletAccent} />
            </motion.svg>
          )}
        </div>

        <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-silver-light mb-2">
          Approve Transaction
        </h2>
        <p className="text-sm text-silver-mist mb-6">
          Your wallet will ask you to approve this transaction. Please confirm in <strong>{walletName}</strong>.
        </p>

        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <motion.div
            className="w-8 h-8 border-2 border-surface-3 border-t-indigo-pulse rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
        </div>

        <p className="text-xs text-silver-mist">Waiting for {walletName} confirmation…</p>
      </motion.div>
    </div>
  );
}
