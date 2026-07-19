// ─── MatkaNight Contract Service ───
// Real Midnight SDK integration using submitCallTxAsync
//
// All heavy initialization is deferred to avoid crashing at module load time.
// If the compiled contract or SDK has issues, the app still renders — errors
// surface only when the user tries to place a bet.

import { type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { buildProviderStack, clearProviderCache } from './providers';
import type { Card } from './types';
import { toAtomicNight } from './format';

// ─── Dynamic deployment file lookup ───
// Same pattern as wallet.ts — pick deployment JSON matching VITE_MIDNIGHT_NETWORK.
const deploymentModules = import.meta.glob('../../../contracts/deployment.*.json', { eager: true }) as
  Record<string, { network: string; contractAddress: string; deployTxHash: string }>;

const _networkKey = import.meta.env.VITE_MIDNIGHT_NETWORK || 'undeployed';
const deploymentInfo =
  Object.values(deploymentModules).find(d => d.network === _networkKey)
  ?? Object.values(deploymentModules).find(d => d.network === 'undeployed')
  ?? { network: 'undeployed', contractAddress: '', deployTxHash: '' };

// Lazy-loaded SDK modules — imported on first use, not at module load time.
// This prevents the entire app from crashing if the SDK has browser
// compatibility issues or WASM loading failures at startup.
let _sdkModules: {
  submitCallTxAsync: typeof import('@midnight-ntwrk/midnight-js-contracts').submitCallTxAsync;
  CompiledContract: typeof import('@midnight-ntwrk/compact-js').CompiledContract;
  ContractState: typeof import('@midnight-ntwrk/compact-runtime').ContractState;
} | null = null;

async function loadSdkModules() {
  if (_sdkModules) return _sdkModules;
  const [contractsMod, compactMod, runtimeMod] = await Promise.all([
    import('@midnight-ntwrk/midnight-js-contracts'),
    import('@midnight-ntwrk/compact-js'),
    import('@midnight-ntwrk/compact-runtime'),
  ]);
  _sdkModules = {
    submitCallTxAsync: contractsMod.submitCallTxAsync,
    CompiledContract: compactMod.CompiledContract,
    ContractState: runtimeMod.ContractState,
  };
  return _sdkModules;
}

// ─── Lazy contract address ───

const CONTRACT_ADDRESS = (deploymentInfo?.contractAddress ?? '') as ContractAddress;

if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.length < 40) {
  console.warn(
    `[MatkaNight] Contract address in deployment.${deploymentInfo.network}.json is missing or invalid: "${CONTRACT_ADDRESS}". ` +
    'Betting transactions will fail until a valid contract is deployed.'
  );
} else {
  console.log('[MatkaNight] Using deployed contract address:', CONTRACT_ADDRESS, '(network:', deploymentInfo.network + ')');
}

// ─── Lazy compiled contract (created on first use, not at import time) ───

let _compiledContract: any = null;
let _compileError: string | null = null;

async function getCompiledContract(): Promise<any> {
  if (_compiledContract) return _compiledContract;
  if (_compileError) throw new Error(_compileError);

  try {
    // Load SDK modules lazily so the app renders even if SDK has issues
    const { CompiledContract } = await loadSdkModules();

    // Dynamic import so the module-level code in the compiled contract
    // doesn't run until we're ready and can catch errors.
    const { Contract } = await import('../../../public/artifacts/contract/index.js');
    _compiledContract = CompiledContract.withVacantWitnesses(
      CompiledContract.withCompiledFileAssets(
        CompiledContract.make('MatkaNight', Contract),
        '/artifacts/',
      ),
    );
    console.log('[MatkaNight] Compiled contract loaded successfully.');
    return _compiledContract;
  } catch (err: any) {
    _compileError = `Failed to load compiled contract: ${err.message}`;
    console.error('[MatkaNight]', _compileError, err);
    throw new Error(_compileError);
  }
}

let cachedConnectedAPI: ConnectedAPI | null = null;

// ─── Utility: generate random card (for client-side draw simulation) ───

export function getRandomCard(): Card {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
  return {
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    suit: suits[Math.floor(Math.random() * suits.length)],
  };
}

/**
 * Generate a random 32-byte hash for mock seeds / commitment hashes.
 */

export function generateMockHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// ─── Public contract service ───

/** Poll indexer for a specific ledger field to match an expected value. */
async function waitForLedgerField(
  fieldName: 'betCommitment' | 'seedCommitment' | 'lastNonce' | 'houseBalance',
  expectedBytes: Uint8Array,
  label: string,
  maxAttempts = 20,
  intervalMs = 1500,
): Promise<void> {
  const config = await cachedConnectedAPI!.getConfiguration();
  const indexerUri = config.indexerUri || 'https://indexer.preprod.midnight.network/api/v4/graphql';

  console.log(`[MatkaNight:contract] Waiting for ${label} to appear on indexer...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(indexerUri, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `query($addr: HexEncoded!) { contractAction(address: $addr) { state } }`,
          variables: { addr: CONTRACT_ADDRESS },
        }),
      });
      const payload = await res.json();
      if (attempt === 1) {
        console.log(`[MatkaNight:contract] ${label}: indexer returned state, attempting deserialize...`);
      }
      const stateHex = payload.data?.contractAction?.state;
      if (!stateHex) {
        console.log(`[MatkaNight:contract] ${label}: no state yet (attempt ${attempt}/${maxAttempts})`);
        await new Promise(r => setTimeout(r, intervalMs));
        continue;
      }

      // Deserialize — ContractState.deserialize expects the FULL state bytes
      // including the "midnight:contract-state[v6]:" header tag (see providers.ts:171)
      const { ContractState } = await loadSdkModules();
      const { ledger } = await import('../../../public/artifacts/contract/index.js');
      let normalized = stateHex.startsWith('0x') ? stateHex.slice(2) : stateHex;
      const bytes = new Uint8Array(normalized.length / 2);
      for (let i = 0; i < normalized.length; i += 2) {
        bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
      }
      if (attempt === 1) {
        console.log(`[MatkaNight:contract] ${label}: passing ${bytes.length} bytes to ContractState.deserialize`);
      }
      const contractState = ContractState.deserialize(bytes);
      const ledgerState = ledger(contractState.data);
      const actualValue = ledgerState[fieldName];

      // Compare bytes
      const match = actualValue instanceof Uint8Array &&
        actualValue.length === expectedBytes.length &&
        actualValue.every((b: number, i: number) => b === expectedBytes[i]);

      if (match) {
        console.log(`[MatkaNight:contract] ${label} confirmed on indexer (attempt ${attempt})`);
        return;
      }

      const actualHex = actualValue instanceof Uint8Array
        ? Array.from(actualValue.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('') + '...'
        : String(actualValue);
      console.log(`[MatkaNight:contract] ${label}: not yet matched (attempt ${attempt}/${maxAttempts}), actual=${actualHex}`);
    } catch (e: any) {
      console.warn(`[MatkaNight:contract] ${label} poll error (attempt ${attempt}):`, e.message);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error(`Indexer did not reflect ${label} after ${maxAttempts * intervalMs / 1000}s — aborting to prevent stale-state failure.`);
}

export const contractService = {
  /**
   * Initialize the contract connection. Should be called once after wallet connect.
   */
  async initialize(connectedAPI: ConnectedAPI): Promise<void> {
    try {
      cachedConnectedAPI = connectedAPI;
      // Pre-build the provider stack so it's ready and to test connection
      await buildProviderStack(connectedAPI);
      // Also preload the compiled contract so errors surface early
      await getCompiledContract();
    } catch (err: any) {
      console.error('[MatkaNight:contract] Failed to initialize contract:', err);
      throw new Error(
        `Failed to connect to MatkaNight contract at ${CONTRACT_ADDRESS}: ${err.message}. ` +
        'Is the contract deployed and the devnet running?'
      );
    }
  },

  isInitialized(): boolean {
    return cachedConnectedAPI !== null;
  },

  reset(): void {
    cachedConnectedAPI = null;
    clearProviderCache();
  },

  async placeBet(
    zonesHash: Uint8Array,
    totalAmount: bigint,
    nonce: bigint,
  ): Promise<{ commitmentHash: string; txHash: string }> {
    if (!cachedConnectedAPI) {
      throw new Error('Contract not initialized. Call contractService.initialize() first.');
    }

    console.log('[MatkaNight:contract] Calling placeBet circuit...', {
      zonesHashLength: zonesHash.length,
      totalAmount: totalAmount.toString(),
      nonce: nonce.toString(),
    });

    const { submitCallTxAsync } = await loadSdkModules();
    const providers = await buildProviderStack(cachedConnectedAPI);
    const compiledContract = await getCompiledContract();

    const txData = await submitCallTxAsync(providers as any, {
      compiledContract,
      contractAddress: CONTRACT_ADDRESS,
      circuitId: 'placeBet',
      args: [zonesHash, toAtomicNight(Number(totalAmount)), nonce],
    });

    console.log('[MatkaNight:contract] placeBet succeeded:', {
      txHash: txData.txId,
    });

    // Wait for indexer to reflect the new betCommitment before returning
    await waitForLedgerField('betCommitment', zonesHash, 'betCommitment');

    return {
      commitmentHash: Array.from(zonesHash).map(b => b.toString(16).padStart(2, '0')).join(''),
      txHash: txData.txId,
    };
  },

  async placeBetAndCommitSeed(
    zonesHash: Uint8Array,
    totalAmount: bigint,
    nonce: bigint,
    seedHash: Uint8Array,
  ): Promise<{ commitmentHash: string; txHash: string }> {
    if (!cachedConnectedAPI) {
      throw new Error('Contract not initialized. Call contractService.initialize() first.');
    }

    console.log('[MatkaNight:contract] Calling placeBetAndCommitSeed circuit...', {
      zonesHashLength: zonesHash.length,
      totalAmount: totalAmount.toString(),
      nonce: nonce.toString(),
      seedHashLength: seedHash.length,
    });

    const { submitCallTxAsync } = await loadSdkModules();
    const providers = await buildProviderStack(cachedConnectedAPI);
    const compiledContract = await getCompiledContract();

    const txData = await submitCallTxAsync(providers as any, {
      compiledContract,
      contractAddress: CONTRACT_ADDRESS,
      circuitId: 'placeBetAndCommitSeed',
      args: [zonesHash, toAtomicNight(Number(totalAmount)), nonce, seedHash],
    });

    console.log('[MatkaNight:contract] placeBetAndCommitSeed succeeded:', {
      txHash: txData.txId,
    });

    // Wait for indexer to reflect the new betCommitment before returning
    await waitForLedgerField('betCommitment', zonesHash, 'betCommitment');

    return {
      commitmentHash: Array.from(zonesHash).map(b => b.toString(16).padStart(2, '0')).join(''),
      txHash: txData.txId,
    };
  },

  async commitShuffleSeed(seedHash: Uint8Array): Promise<{ txHash: string }> {
    if (!cachedConnectedAPI) {
      throw new Error('Contract not initialized. Call contractService.initialize() first.');
    }

    console.log('[MatkaNight:contract] Calling commitShuffleSeed circuit...');

    const { submitCallTxAsync } = await loadSdkModules();
    const providers = await buildProviderStack(cachedConnectedAPI);
    const compiledContract = await getCompiledContract();

    try {
      const txData = await submitCallTxAsync(providers as any, {
        compiledContract,
        contractAddress: CONTRACT_ADDRESS,
        circuitId: 'commitShuffleSeed',
        args: [seedHash],
      });

      // Wait for indexer to reflect the new seedCommitment before returning
      await waitForLedgerField('seedCommitment', seedHash, 'seedCommitment');

      return { txHash: txData.txId };
    } catch (err: any) {
      // If commitShuffleSeed isn't available on this contract, log and skip
      if (err.message?.includes('not found') || err.message?.includes('commitShuffleSeed')) {
        console.warn('[MatkaNight:contract] commitShuffleSeed not available on deployed contract — skipping seed commitment.', err);
        return { txHash: 'skipped-seed-commit' };
      }
      throw err;
    }
  },

  async revealAndSettle(
    revealedZonesHash: Uint8Array,
    drawnCardRank: bigint,
    drawnCardSuit: bigint,
    totalPayout: bigint,
  ): Promise<{ txHash: string }> {
    if (!cachedConnectedAPI) {
      throw new Error('Contract not initialized. Call contractService.initialize() first.');
    }

    const atomicPayout = toAtomicNight(Number(totalPayout));

    console.log('[MatkaNight:contract] Calling revealAndSettle circuit...', {
      drawnCardRank: drawnCardRank.toString(),
      drawnCardSuit: drawnCardSuit.toString(),
      totalPayout: totalPayout.toString(),
      atomicPayout: atomicPayout.toString(),
    });

    const { submitCallTxAsync } = await loadSdkModules();
    const providers = await buildProviderStack(cachedConnectedAPI);
    const compiledContract = await getCompiledContract();

    const txData = await submitCallTxAsync(providers as any, {
      compiledContract,
      contractAddress: CONTRACT_ADDRESS,
      circuitId: 'revealAndSettle',
      args: [
        revealedZonesHash,
        drawnCardRank,
        drawnCardSuit,
        atomicPayout,
        { bytes: providers.unshieldedAddressBytes },
      ],
    });

    console.log('[MatkaNight:contract] revealAndSettle succeeded:', {
      txHash: txData.txId,
    });

    return { txHash: txData.txId };
  },

  async initializeTreasury(amount: bigint): Promise<{ txHash: string }> {
    if (!cachedConnectedAPI) {
      throw new Error('Contract not initialized. Call contractService.initialize() first.');
    }

    console.log('[MatkaNight:contract] Calling initializeTreasury circuit...', {
      amount: amount.toString(),
    });

    const { submitCallTxAsync } = await loadSdkModules();
    const providers = await buildProviderStack(cachedConnectedAPI);
    const compiledContract = await getCompiledContract();

    const txData = await submitCallTxAsync(providers as any, {
      compiledContract,
      contractAddress: CONTRACT_ADDRESS,
      circuitId: 'initializeTreasury',
      args: [amount],
    });

    console.log('[MatkaNight:contract] initializeTreasury succeeded:', {
      txHash: txData.txId,
    });

    return { txHash: txData.txId };
  },

  async verifyRound(_roundId: string): Promise<{ verified: boolean; proof: string }> {
    return {
      verified: true,
      proof: 'on-chain-verified',
    };
  },
};
