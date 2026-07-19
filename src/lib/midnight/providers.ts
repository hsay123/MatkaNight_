import { type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type MidnightProvider, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

// Lazy-loaded SDK modules — imported on first use to avoid crashing at startup
let _heavyModules: {
  ContractState: typeof import('@midnight-ntwrk/compact-runtime').ContractState;
  FetchZkConfigProvider: typeof import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider').FetchZkConfigProvider;
  indexerPublicDataProvider: typeof import('@midnight-ntwrk/midnight-js-indexer-public-data-provider').indexerPublicDataProvider;
  LedgerParameters: typeof import('@midnight-ntwrk/ledger-v8').LedgerParameters;
  Transaction: typeof import('@midnight-ntwrk/ledger-v8').Transaction;
  ZswapChainState: typeof import('@midnight-ntwrk/ledger-v8').ZswapChainState;
  setNetworkId: typeof import('@midnight-ntwrk/midnight-js-network-id').setNetworkId;
  MidnightBech32m: any;
} | null = null;

async function loadHeavyModules() {
  if (_heavyModules) return _heavyModules;
  const [compactMod, fetchZkMod, indexerMod, ledgerMod, networkMod, addrMod] = await Promise.all([
    import('@midnight-ntwrk/compact-runtime'),
    import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider'),
    import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
    import('@midnight-ntwrk/ledger-v8'),
    import('@midnight-ntwrk/midnight-js-network-id'),
    import('@midnight-ntwrk/wallet-sdk-address-format'),
  ]);
  _heavyModules = {
    ContractState: compactMod.ContractState,
    FetchZkConfigProvider: fetchZkMod.FetchZkConfigProvider,
    indexerPublicDataProvider: indexerMod.indexerPublicDataProvider,
    LedgerParameters: ledgerMod.LedgerParameters,
    Transaction: ledgerMod.Transaction,
    ZswapChainState: ledgerMod.ZswapChainState,
    setNetworkId: networkMod.setNetworkId,
    MidnightBech32m: addrMod.MidnightBech32m,
  };
  return _heavyModules;
}

type FinalizedTransaction = any;
type TransactionId = string;

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex string from wallet or indexer.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

async function coinPublicKeyToBytes(pk: unknown): Promise<Uint8Array> {
  if (pk instanceof Uint8Array) return pk.length === 32 ? pk : pk.slice(0, 32);
  if (typeof pk === 'string') {
    // Try bech32m decoding first (mn_shield-cpk_preprod1... format from 1AM wallet)
    if (pk.startsWith('mn_shield-cpk')) {
      try {
        const { MidnightBech32m } = await import('@midnight-ntwrk/wallet-sdk-address-format');
        const parsed = MidnightBech32m.parse(pk);
        const bytes = new Uint8Array(parsed.data);
        const hexPreview = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('[MatkaNight:providers] Decoded bech32m coin public key:', { length: bytes.length, hexPrefix: hexPreview + '...' });
        if (bytes.length === 32) return bytes;
        console.warn('[MatkaNight:providers] Decoded bech32m key is', bytes.length, 'bytes, expected 32');
      } catch (e) {
        console.warn('[MatkaNight:providers] bech32m decode failed, trying hex fallback:', e);
      }
    }
    // Fallback: raw hex
    const hex = pk.startsWith('0x') ? pk.slice(2) : pk;
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) return fromHex(hex);
    console.warn('[MatkaNight:providers] Could not decode coin public key:', pk);
    return new Uint8Array(32);
  }
  if (Array.isArray(pk)) {
    const padded = pk.length >= 32 ? pk.slice(0, 32) : [...pk, ...new Uint8Array(32 - pk.length)];
    return new Uint8Array(padded);
  }
  if (pk && typeof pk === 'object' && 'bytes' in (pk as any)) {
    return coinPublicKeyToBytes((pk as any).bytes);
  }
  console.warn('[MatkaNight:providers] Unexpected coin public key shape:', pk);
  return new Uint8Array(32);
}

// Re-export for convenience
export type { ContractAddress };

export type MatkaNightProviders = {
  privateStateProvider: any;
  zkConfigProvider: any;
  proofProvider: any;
  publicDataProvider: any;
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
  unshieldedAddress: string;
  unshieldedAddressBytes: Uint8Array;
  coinPublicKeyBytes: Uint8Array;
};

function createInMemoryPrivateStateProvider() {
  const states = new Map<string, Map<string, any>>();
  const signingKeys = new Map<string, any>();
  let contractAddress: string | null = null;

  const getScopedStates = (address: string) => {
    let scoped = states.get(address);
    if (!scoped) {
      scoped = new Map();
      states.set(address, scoped);
    }
    return scoped;
  };

  const requireAddress = () => {
    if (!contractAddress) throw new Error('Contract address not set on private state provider');
    return contractAddress;
  };

  return {
    setContractAddress(address: string) { contractAddress = address; },
    async set(key: string, state: any) { getScopedStates(requireAddress()).set(key, state); },
    async get(key: string) { return getScopedStates(requireAddress()).get(key) ?? null; },
    async remove(key: string) { getScopedStates(requireAddress()).delete(key); },
    async clear() { states.delete(requireAddress()); },
    async setSigningKey(addr: string, key: any) { signingKeys.set(addr, key); },
    async getSigningKey(addr: string) { return signingKeys.get(addr) ?? null; },
    async removeSigningKey(addr: string) { signingKeys.delete(addr); },
    async clearSigningKeys() { signingKeys.clear(); },
    async exportPrivateStates() {
      return { format: 'midnight-private-state-export', encryptedPayload: '{}', salt: 'in-memory' };
    },
    async importPrivateStates() { return { imported: 0, skipped: 0, overwritten: 0 }; },
    async exportSigningKeys() {
      return { format: 'midnight-signing-key-export', encryptedPayload: '{}', salt: 'in-memory' };
    },
    async importSigningKeys() { return { imported: 0, skipped: 0, overwritten: 0 }; },
  };
}

async function createPatchedPublicDataProvider(queryUrl: string, subscriptionUrl: string) {
  const { indexerPublicDataProvider, ContractState, ZswapChainState, LedgerParameters } = await loadHeavyModules();
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);

  async function queryLatest(query: string, address: string) {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: { address } }),
    });
    if (!res.ok) throw new Error(`Indexer HTTP error: ${res.status}`);
    const payload = await res.json();
    if (payload.errors?.length) throw new Error(payload.errors.map((e: any) => e.message).join('; '));
    return payload.data?.contractAction ?? null;
  }

  return {
    ...base,
    async queryContractState(contractAddress: string, config?: any) {
      if (config) return base.queryContractState(contractAddress, config);
      const action = await queryLatest(`
        query LATEST_CONTRACT_STATE($address: HexEncoded!) {
          contractAction(address: $address) { state }
        }`, contractAddress);
      return action ? ContractState.deserialize(fromHex(action.state)) : null;
    },
    async queryZSwapAndContractState(contractAddress: string, config?: any) {
      if (config) return base.queryZSwapAndContractState(contractAddress, config);
      const action = await queryLatest(`
        query LATEST_BOTH_STATE($address: HexEncoded!) {
          contractAction(address: $address) {
            state
            zswapState
            transaction { block { ledgerParameters } }
          }
        }`, contractAddress);
      if (!action?.zswapState) return null;
      return [
        ZswapChainState.deserialize(fromHex(action.zswapState)),
        ContractState.deserialize(fromHex(action.state)),
        action.transaction?.block?.ledgerParameters
          ? LedgerParameters.deserialize(fromHex(action.transaction.block.ledgerParameters))
          : LedgerParameters.initialParameters(),
      ] as const;
    },
  };
}

let cachedProviders: MatkaNightProviders | null = null;
let cachedConnectedAPI: ConnectedAPI | null = null;

export async function buildProviderStack(connectedAPI: ConnectedAPI): Promise<MatkaNightProviders> {
  if (cachedProviders && cachedConnectedAPI === connectedAPI) {
    return cachedProviders;
  }

  console.log('[MatkaNight:providers] Building real provider stack...');

  const { setNetworkId, FetchZkConfigProvider } = await loadHeavyModules();

  // Fetch all required data in parallel
  const [config, unshieldedAddress, shieldedAddresses] = await Promise.all([
    connectedAPI.getConfiguration(),
    connectedAPI.getUnshieldedAddress(),
    connectedAPI.getShieldedAddresses()
  ]);

  console.log('[MatkaNight:providers] Wallet configuration:', config);

  // Set the network ID based on the wallet's configuration
  setNetworkId(config.networkId);

  // Use dynamic configuration from the wallet, fallback to defaults if not provided
  const indexerUri = config.indexerUri || 'http://127.0.0.1:8088/api/v4/graphql';
  const indexerWsUri = config.indexerWsUri || 'ws://127.0.0.1:8088/api/v4/graphql/ws';
  const zkConfigPath = new URL('/artifacts/', window.location.origin).toString();
  const zkConfigProvider = new FetchZkConfigProvider(zkConfigPath, fetch.bind(window));
  const provingProvider = await connectedAPI.getProvingProvider(zkConfigProvider);

  const providers: MatkaNightProviders = {
    privateStateProvider: createInMemoryPrivateStateProvider(),

    zkConfigProvider,

    proofProvider: {
      async proveTx(unprovenTx: any) {
        const { CostModel } = await import('@midnight-ntwrk/ledger-v8');
        return unprovenTx.prove(provingProvider, CostModel.initialCostModel());
      },
    },

    publicDataProvider: await createPatchedPublicDataProvider(indexerUri, indexerWsUri),

    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, _ttl?: Date): Promise<FinalizedTransaction> => {
        try {
          console.log('[MatkaNight:providers] Balancing transaction via wallet...');
          const txHex = toHex(tx.serialize());
          const balancePromise = connectedAPI.balanceUnsealedTransaction(txHex);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('balanceUnsealedTransaction timed out after 120s')), 120_000)
          );
          const balanced = await Promise.race([balancePromise, timeoutPromise]);
          if (!balanced?.tx) throw new Error('balanceUnsealedTransaction returned invalid result');
          const { Transaction: LazyTx } = await loadHeavyModules();
          return LazyTx.deserialize(
            'signature',
            'proof',
            'binding',
            fromHex(balanced.tx),
          );
        } catch (e) {
          console.error('[MatkaNight:providers] Error balancing transaction:', e);
          throw e;
        }
      },
    },

    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        console.log('[MatkaNight:providers] Submitting transaction via wallet...');
        const txHex = toHex(tx.serialize());
        const submitPromise = connectedAPI.submitTransaction(txHex) as Promise<any>;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('submitTransaction timed out after 60s')), 60_000)
        );
        const result = await Promise.race([submitPromise, timeoutPromise]);
        if (typeof result === 'string' && result) return result;
        if (result?.transactionId) return result.transactionId;
        if (result?.id) return result.id;
        const txIdentifiers = tx.identifiers();
        const txId = String(txIdentifiers[0] ?? txHex.slice(0, 64));
        console.log('[MatkaNight:providers] Submitted. TxId:', txId);
        return txId;
      },
    },

    unshieldedAddress: unshieldedAddress.unshieldedAddress,
    unshieldedAddressBytes: await (async () => {
      const addr = unshieldedAddress.unshieldedAddress;
      if (typeof addr === 'string' && addr.length > 0) {
        try {
          const { MidnightBech32m } = await import('@midnight-ntwrk/wallet-sdk-address-format');
          const parsed = MidnightBech32m.parse(addr);
          const bytes = new Uint8Array(parsed.data);
          if (bytes.length === 32) {
            console.log('[MatkaNight:providers] Decoded unshielded address OK:', Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
            return bytes;
          }
          console.error('[MatkaNight:providers] Decoded unshielded address has wrong length:', bytes.length, 'expected 32. Raw addr:', addr);
        } catch (e) {
          console.error('[MatkaNight:providers] Unshielded address decode FAILED for addr:', addr, e);
        }
      } else {
        console.error('[MatkaNight:providers] unshieldedAddress.unshieldedAddress is empty/invalid:', addr);
      }
      console.error('[MatkaNight:providers] *** FALLING BACK TO ZERO ADDRESS - PAYOUTS WILL BE LOST - DO NOT DEMO UNTIL THIS IS FIXED ***');
      return new Uint8Array(32);
    })(),
    coinPublicKeyBytes: await coinPublicKeyToBytes(shieldedAddresses.shieldedCoinPublicKey),
  };

  cachedProviders = providers;
  cachedConnectedAPI = connectedAPI;

  console.log('[MatkaNight:providers] Provider stack ready.');
  return providers;
}

export function clearProviderCache(): void {
  cachedProviders = null;
  cachedConnectedAPI = null;
}
