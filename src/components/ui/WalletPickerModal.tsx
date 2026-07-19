import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { type DetectedWallet, waitForWallets } from '../../lib/midnight/wallet';
import { useGameStore } from '../../store/gameStore';

function getWalletAccent(rdns?: string): string {
  if (!rdns) return '#4F46E5';
  if (rdns.includes('lace')) return '#6366F1';
  if (rdns.includes('1am') || rdns.includes('iam')) return '#F59E0B';
  return '#4F46E5';
}

export function WalletPickerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [scanning, setScanning] = useState(true);
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [walletErrors, setWalletErrors] = useState<Record<string, string>>({});
  const connectWallet = useGameStore(s => s.connectWallet);
  const wallet = useGameStore(s => s.wallet);

  useEffect(() => {
    if (!isOpen) return;
    setScanning(true);
    setWallets([]);
    setWalletErrors({});
    waitForWallets(6, 500).then(found => {
      setWallets(found);
      setScanning(false);
    });
  }, [isOpen]);

  // Auto-close on successful connect
  useEffect(() => {
    if (wallet.status === 'connected') onClose();
  }, [wallet.status, onClose]);

  const handlePick = async (w: DetectedWallet) => {
    setConnectingKey(w.key);
    // Clear existing error for this wallet
    setWalletErrors(prev => {
      const next = { ...prev };
      delete next[w.key];
      return next;
    });

    try {
      await connectWallet(w);
    } catch (err: any) {
      setWalletErrors(prev => ({
        ...prev,
        [w.key]: err?.message || 'Connection failed. Please try again.'
      }));
    } finally {
      setConnectingKey(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet" size="sm">
      <div className="space-y-3">
        {scanning && wallets.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-8 text-silver-mist text-sm">
            <span className="w-4 h-4 border-2 border-indigo-pulse border-t-transparent rounded-full animate-spin" />
            Scanning for wallets…
          </div>
        )}

        {!scanning && wallets.length === 0 && (
          <div className="text-center py-6 space-y-3">
            <p className="text-silver-mist text-sm">No compatible Midnight wallet detected.</p>
            <p className="text-xs text-silver-mist/70">Install <strong>Lace</strong> or <strong>1AM</strong> browser extension and reload.</p>
          </div>
        )}

        {wallets.map(w => {
          const isConnectingThis = connectingKey === w.key;
          const isConnectingOther = connectingKey !== null && connectingKey !== w.key;
          const errorMsg = walletErrors[w.key];

          return (
            <div key={w.key} className="space-y-2">
              <motion.button
                onClick={() => handlePick(w)}
                disabled={connectingKey !== null}
                className={`w-full flex items-center gap-4 p-4 rounded-xl bg-surface-2 border transition-all cursor-pointer disabled:cursor-default
                  ${isConnectingOther ? 'opacity-40 border-surface-3' : 'opacity-100 hover:border-indigo-pulse/50'}
                  ${isConnectingThis ? 'border-indigo-pulse/50 bg-indigo-pulse/5' : 'border-surface-3'}
                `}
                whileHover={connectingKey ? {} : { scale: 1.01 }}
                whileTap={connectingKey ? {} : { scale: 0.99 }}
              >
                {w.icon ? (
                  <img src={w.icon} alt="" className="w-10 h-10 rounded-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: getWalletAccent(w.rdns) }}>
                    {w.name.charAt(0)}
                  </div>
                )}
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-silver-light">{w.name}</p>
                  <p className="text-xs text-silver-mist">v{w.apiVersion}{w.rdns ? ` · ${w.rdns}` : ''}</p>
                </div>
                {isConnectingThis ? (
                  <span className="w-5 h-5 border-2 border-indigo-pulse border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-silver-mist">
                    <path d="M6 4L10 8L6 12" />
                  </svg>
                )}
              </motion.button>
              
              {/* Per-wallet error message */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-3 py-2 rounded-lg bg-ember/10 border border-ember/30 text-xs text-ember leading-relaxed"
                >
                  {errorMsg}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
