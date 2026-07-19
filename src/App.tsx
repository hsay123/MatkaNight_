import React from 'react';
import { useGameStore } from './store/gameStore';
import { LandingScreen } from './screens/LandingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ZoneSelectionScreen } from './screens/ZoneSelectionScreen';
import { ExactCardPickerScreen } from './screens/CardPickerScreen';
import { BetAmountScreen } from './screens/BetAmountScreen';
import { BetConfirmationScreen } from './screens/BetConfirmationScreen';
import { WalletApprovalScreen } from './screens/WalletApprovalScreen';
import { BetCommittedScreen } from './screens/BetCommittedScreen';
import { ShuffleSeedScreen } from './screens/ShuffleSeedScreen';
import { ShuffleAnimationScreen } from './screens/ShuffleAnimationScreen';
import { CardRevealedScreen } from './screens/CardRevealedScreen';
import { ResultScreen } from './screens/ResultScreen';
import { RoundSummaryScreen } from './screens/RoundSummaryScreen';
import { DevDeploy, shouldShowDevDeploy } from './components/DevDeploy';
import { BgGradient } from './components/ui/bg-gradient';
import { NoiseBackground } from './components/ui/noise-background';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center p-8">
          <div className="glass-panel p-8 max-w-xl text-center rounded-xl border-ember/30 bg-ember/5">
            <h2 className="text-xl font-bold text-ember mb-4">Something broke</h2>
            <div className="text-sm text-silver-mist text-left bg-surface-1 p-4 rounded-lg overflow-auto">
              {/* @ts-ignore */}
              <p className="font-mono">{this.state.error.message || String(this.state.error)}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-ember/20 hover:bg-ember/30 text-ember rounded-lg transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  switch (currentScreen) {
    case 'landing':
      return <LandingScreen />;
    case 'dashboard':
      return <DashboardScreen />;
    case 'zone_selection':
      return <ZoneSelectionScreen />;
    case 'exact_card_picker':
      return <ExactCardPickerScreen />;
    case 'bet_amount':
      return <BetAmountScreen />;
    case 'bet_confirmation':
      return <BetConfirmationScreen />;
    case 'wallet_approval':
      return <WalletApprovalScreen />;
    case 'bet_committed':
      return <BetCommittedScreen />;
    case 'shuffle_seed':
      return <ShuffleSeedScreen />;
    case 'shuffle_animation':
      return <ShuffleAnimationScreen />;
    case 'card_revealed':
      return <CardRevealedScreen />;
    case 'result':
      return <ResultScreen />;
    case 'payout_confirmation':
      return <ResultScreen />;
    case 'round_summary':
      return <RoundSummaryScreen />;
    default:
      return <LandingScreen />;
  }
}

import { Toast } from './components/ui/Toast';

export default function App() {
  const toast = useGameStore(s => s.toast);
  const setToast = useGameStore(s => s.setToast);

  return (
    <ErrorBoundary>
      {/* Global background — fixed, behind everything */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-white dark:bg-[#0b061c]">
        <BgGradient />
        <NoiseBackground />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20 dark:opacity-40"
          style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.15), transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-10 dark:opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(229,82,45,0.1), transparent 70%)' }} />
      </div>

      <MainApp />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {shouldShowDevDeploy() && <DevDeploy />}
    </ErrorBoundary>
  );
}
