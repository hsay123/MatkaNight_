import { useState, useEffect, useCallback } from 'react';
import { walletService, waitForWallets } from '../lib/midnight/wallet';

const NETWORK = import.meta.env.VITE_MIDNIGHT_NETWORK;
const STORAGE_KEY = 'matkanight-deploy-result';

export function shouldShowDevDeploy(): boolean {
  return NETWORK === 'preprod' && new URLSearchParams(window.location.search).has('deploy');
}

function loadSavedResult() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function DevDeploy() {
  const [walletStatus, setWalletStatus] = useState(walletService.getState().status);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'done' | 'error'>(
    loadSavedResult() ? 'done' : 'idle'
  );
  const [result, setResult] = useState<any>(loadSavedResult);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    return walletService.subscribe((s) => setWalletStatus(s.status));
  }, []);

  const handleConnect = useCallback(async () => {
    setWalletError(null);
    setDetecting(true);
    try {
      const detected = await waitForWallets(6, 500);
      const first = detected[0];
      if (!first) {
        setWalletError('No compatible Midnight wallet detected. Install 1AM or Lace and reload.');
        return;
      }
      await walletService.connect(first);
    } catch (err: any) {
      setWalletError(err?.message || 'Connection failed');
    } finally {
      setDetecting(false);
    }
  }, []);

  const handleDeploy = useCallback(async () => {
    setDeployStatus('deploying');
    setDeployError(null);

    try {
      console.log('[DevDeploy] Step 1: Loading SDK modules...');
      const { buildProviderStack } = await import('../lib/midnight/providers');
      const { deployContract } = await import('@midnight-ntwrk/midnight-js-contracts');
      const { CompiledContract } = await import('@midnight-ntwrk/compact-js');
      const { Contract } = await import('../../public/artifacts/contract/index.js');
      console.log('[DevDeploy] Step 1: Done');

      const connectedAPI = walletService.getAPI();
      if (!connectedAPI) throw new Error('Wallet not connected');

      console.log('[DevDeploy] Step 2: Building provider stack...');
      const providers = await buildProviderStack(connectedAPI);
      console.log('[DevDeploy] Step 2: Done');

      console.log('[DevDeploy] Step 3: Compiling contract...');
      const compiledContract = CompiledContract.withVacantWitnesses(
        CompiledContract.make('MatkaNight', Contract),
      );
      console.log('[DevDeploy] Step 3: Done');

      console.log('[DevDeploy] Step 4: Calling deployContract (may take minutes for ZK proving)...');
      const deployPromise = deployContract(providers as any, {
        privateStateKey: 'matkaNight-preprod-deploy',
        compiledContract,
        initialPrivateState: {},
        args: [],
      } as any);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('deployContract timed out after 5 minutes')), 300_000)
      );
      const deployed = await Promise.race([deployPromise, timeoutPromise]);
      console.log('[DevDeploy] Step 4: Done');

      const contractAddress = deployed.deployTxData.public.contractAddress;
      const deployTxHash = deployed.deployTxData.public.txHash;

      const deployResult = { contractAddress, deployTxHash };
      setResult(deployResult);
      setDeployStatus('done');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deployResult));
      console.log('[DevDeploy] SUCCESS:', deployResult);
      console.log('[DevDeploy] ===== COPY THESE VALUES =====');
      console.log('[DevDeploy] CONTRACT_ADDRESS=' + contractAddress);
      console.log('[DevDeploy] DEPLOY_TX_HASH=' + deployTxHash);
      console.log('[DevDeploy] ================================');
    } catch (err: any) {
      setDeployError(err.message ?? String(err));
      setDeployStatus('error');
      console.error('[DevDeploy] FAILED:', err);
    }
  }, []);

  const handleCopy = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setResult(null);
    setDeployStatus('idle');
    setDeployError(null);
  }, []);

  const isConnected = walletStatus === 'connected';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel p-8 max-w-md w-full rounded-xl border-midnight-teal/30">
        <h2 className="text-xl font-bold text-midnight-teal mb-2">Preprod Deploy</h2>
        <p className="text-sm text-silver-mist mb-6">
          Deploys the MatkaNight contract to Preprod via the 1AM wallet.
          The proof server must be running at <code>127.0.0.1:6300</code>.
        </p>

        {/* Step 1: Connect wallet */}
        {!isConnected && deployStatus === 'idle' && (
          <div className="space-y-3">
            <button
              onClick={handleConnect}
              disabled={detecting}
              className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold transition-colors disabled:opacity-50"
            >
              {detecting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  Scanning for wallets…
                </span>
              ) : (
                'Connect 1AM Wallet'
              )}
            </button>
            {walletError && (
              <p className="text-xs text-ember text-center">{walletError}</p>
            )}
          </div>
        )}

        {/* Step 2: Deploy */}
        {isConnected && deployStatus === 'idle' && (
          <button
            onClick={handleDeploy}
            className="w-full py-3 rounded-xl bg-midnight-teal/20 hover:bg-midnight-teal/30 text-midnight-teal font-semibold transition-colors"
          >
            Deploy Contract
          </button>
        )}

        {deployStatus === 'deploying' && (
          <div className="text-center py-3 space-y-2">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-midnight-teal border-t-transparent mb-2" />
            <p className="text-midnight-teal text-sm">Deploying... this may take a few minutes.</p>
            <p className="text-silver-mist text-xs">Do not close this tab.</p>
          </div>
        )}

        {deployStatus === 'done' && result && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-midnight-teal/10 border border-midnight-teal/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-silver-mist">Contract Address</p>
                <button
                  onClick={() => handleCopy(result.contractAddress, 'addr')}
                  className="text-xs text-midnight-teal hover:underline"
                >
                  {copied === 'addr' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-white break-all select-all">{result.contractAddress}</p>
            </div>
            <div className="p-3 rounded-lg bg-midnight-teal/10 border border-midnight-teal/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-silver-mist">Deploy Tx Hash</p>
                <button
                  onClick={() => handleCopy(result.deployTxHash, 'tx')}
                  className="text-xs text-midnight-teal hover:underline"
                >
                  {copied === 'tx' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-white break-all select-all">{result.deployTxHash}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-silver-mist text-xs transition-colors"
            >
              Deploy Again
            </button>
          </div>
        )}

        {deployStatus === 'error' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-ember/10 border border-ember/30">
              <p className="text-xs text-ember mb-1">Error</p>
              <p className="font-mono text-xs text-ember break-all">{deployError}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-silver-mist text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('deploy');
            window.location.href = url.toString();
          }}
          className="mt-4 w-full py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-silver-mist text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
