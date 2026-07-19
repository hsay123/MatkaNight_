import type { WalletState } from './types';
import { formatNight, formatDust } from './format';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

// ─── Dynamic deployment file lookup ───
// Load all deployment.*.json files eagerly via Vite glob, then pick the one
// matching the active network. Falls back to undeployed if nothing matches.
const deploymentModules = import.meta.glob('../../../contracts/deployment.*.json', { eager: true }) as
  Record<string, { network: string; contractAddress: string; deployTxHash: string }>;

const _networkKey = import.meta.env.VITE_MIDNIGHT_NETWORK || 'undeployed';
const deploymentInfo =
  Object.values(deploymentModules).find(d => d.network === _networkKey)
  ?? Object.values(deploymentModules).find(d => d.network === 'undeployed')
  ?? { network: 'undeployed', contractAddress: '', deployTxHash: '' };

// --- DApp Connector API v4 type declarations ---

const COMPATIBLE_CONNECTOR_API_VERSION = '4';

/** The shape every wallet extension injects into window.midnight[key] */
export interface InitialAPI {
  apiVersion: string;
  name: string;
  icon?: string;
  rdns?: string;
  connect(networkId: string): Promise<ConnectedWalletAPI>;
  serviceUriConfig?(): Promise<ServiceUriConfig>;
}

/**
 * Alias to the canonical SDK ConnectedAPI type.
 * Replaces the old hand-rolled interface which had drifted from the real shape.
 */
export type ConnectedWalletAPI = ConnectedAPI;

interface ServiceUriConfig {
  indexerUri?: string;
  proofServerUri?: string;
  networkId?: string;
}
// Note: window.midnight global declaration is already provided by the SDK package.

// --- Detected wallet descriptor ---

export interface DetectedWallet {
  key: string;       // the property key on window.midnight
  name: string;      // human-readable name from the extension
  icon: string;      // data URI or URL from the extension
  rdns?: string;     // reverse-DNS identifier
  apiVersion: string;
  api: InitialAPI;
}

// --- Network ---

export const NETWORK_ID = import.meta.env.VITE_MIDNIGHT_NETWORK || deploymentInfo.network || 'undeployed';
console.log('[MatkaNight] Startup network:', {
  env: import.meta.env.VITE_MIDNIGHT_NETWORK,
  deployment: deploymentInfo.network,
  resolved: NETWORK_ID,
});

// --- Module state ---

let connectedAPI: ConnectedWalletAPI | null = null;
let activeWallet: DetectedWallet | null = null;
let currentUris: ServiceUriConfig | null = null;

let walletState: WalletState = {
  status: 'disconnected',
  name: undefined,
  rdns: undefined,
  address: null,
  nightBalance: 0,
  dustBalance: 0,
};

/**
 * Returns a human-friendly display name for a wallet given its raw name/rdns.
 * Centralised here so every component uses the same mapping.
 */
export function getWalletDisplayName(name?: string, rdns?: string): string {
  if (rdns) {
    const r = rdns.toLowerCase();
    if (r.includes('1am') || r.includes('iam')) return '1AM';
    if (r.includes('lace')) return 'Lace';
  }
  if (name) return name;
  return 'your wallet';
}

type WalletListener = (state: WalletState) => void;
const listeners: WalletListener[] = [];

function notifyListeners() {
  listeners.forEach(fn => fn({ ...walletState }));
}

// --- Wallet detection ---

function majorVersion(semver: string): string {
  return semver.split('.')[0];
}

/**
 * Enumerate all compatible wallets injected into window.midnight.
 * Each wallet extension registers itself under a dynamic key (e.g. 'mnLace', '1am').
 * We filter to entries that look like a valid InitialAPI with a compatible version.
 */
export function getCompatibleWallets(): DetectedWallet[] {
  const midnight = window.midnight;
  if (!midnight || typeof midnight !== 'object') return [];

  // Log all keys for diagnostics
  console.log('[MatkaNight] window.midnight keys:', Object.keys(midnight));

  const wallets: DetectedWallet[] = [];

  for (const [key, entry] of Object.entries(midnight)) {
    if (
      entry &&
      typeof entry === 'object' &&
      'apiVersion' in entry &&
      typeof entry.apiVersion === 'string' &&
      majorVersion(entry.apiVersion) === COMPATIBLE_CONNECTOR_API_VERSION &&
      'connect' in entry &&
      typeof entry.connect === 'function'
    ) {
      const wallet = entry as InitialAPI;
      console.log(`[MatkaNight] Detected wallet "${key}":`, {
        name: wallet.name,
        apiVersion: wallet.apiVersion,
        rdns: wallet.rdns,
      });

      wallets.push({
        key,
        name: wallet.name || key,
        icon: wallet.icon || '',
        rdns: wallet.rdns,
        apiVersion: wallet.apiVersion,
        api: wallet,
      });
    }
  }

  return wallets.sort((a, b) => {
    const aIsOneAm = `${a.key} ${a.name} ${a.rdns ?? ''}`.toLowerCase().includes('1am');
    const bIsOneAm = `${b.key} ${b.name} ${b.rdns ?? ''}`.toLowerCase().includes('1am');
    return Number(bIsOneAm) - Number(aIsOneAm);
  });
}

/**
 * Poll for wallet injection.  Extensions can load after the page script runs
 * (especially 1AM which injects asynchronously).  We check immediately, then
 * retry a few times with a short delay.
 */
export async function waitForWallets(maxAttempts = 5, intervalMs = 400): Promise<DetectedWallet[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const found = getCompatibleWallets();
    if (found.length > 0) return found;
    if (attempt < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  return [];
}

// --- Balance extraction helpers ---

/**
 * Extract the NIGHT balance from the raw return value of getUnshieldedBalances()
 * or getShieldedBalances().
 * 
 * The 1AM DApp Connector API v4 returns these as:
 *   - A plain object: { night: <bigint | number | string> }
 *   - A Map keyed by token type string
 *   - Possibly a single number/bigint (older implementations)
 *
 * This helper normalises all shapes into a raw atomic bigint/number.
 */
function extractNightFromBalances(raw: any, label: string): number | bigint {
  console.log(`[MatkaNight:balance] ${label} raw shape:`, typeof raw, raw);

  if (raw == null) return 0;

  // Case 1: Direct number/bigint (single-token wallet fallback)
  if (typeof raw === 'number' || typeof raw === 'bigint') {
    return raw;
  }
  if (typeof raw === 'string') {
    return BigInt(raw); // string numbers will be converted by BigInt later
  }

  // Normalise Iterables (like custom Maps or Lists) to Array
  let normalizedRaw = raw;
  if (typeof raw === 'object' && typeof raw[Symbol.iterator] === 'function' && !(raw instanceof Map) && !Array.isArray(raw)) {
    try {
      normalizedRaw = Array.from(raw);
    } catch (e) {
      // Ignore
    }
  }

  // Case 2: Array of entries
  if (Array.isArray(normalizedRaw)) {
    // Try to find an explicit night token
    const nightEntry = normalizedRaw.find((e: any) =>
      e?.token?.toLowerCase?.() === 'night' || 
      e?.tokenType?.toLowerCase?.() === 'night' ||
      e?.symbol?.toLowerCase?.() === 'night'
    );
    if (nightEntry) {
      return nightEntry.balance ?? nightEntry.amount ?? nightEntry.value ?? nightEntry.quantity ?? 0;
    }
    // Fallback: take the first entry with a balance if we can't identify NIGHT specifically
    if (normalizedRaw.length > 0) {
      return normalizedRaw[0].balance ?? normalizedRaw[0].amount ?? normalizedRaw[0].value ?? normalizedRaw[0].quantity ?? 0;
    }
    return 0;
  }

  // Case 3: Map
  if (normalizedRaw instanceof Map) {
    const nightVal = normalizedRaw.get('night') ?? normalizedRaw.get('NIGHT') ?? normalizedRaw.get(''); // empty string is often native token ID
    if (nightVal !== undefined) return nightVal;
    
    // Fallback: take the first numeric value
    for (const val of normalizedRaw.values()) {
      if (typeof val === 'number' || typeof val === 'bigint') return val;
      if (typeof val === 'string' && /^\d+$/.test(val)) return BigInt(val);
      if (typeof val === 'object' && val) {
        return val.balance ?? val.amount ?? val.value ?? val.quantity ?? 0;
      }
    }
    return 0;
  }

  // Case 4: Plain object (Record<TokenId, balance> or { night: balance })
  if (typeof normalizedRaw === 'object') {
    if ('night' in normalizedRaw) return normalizedRaw.night;
    if ('NIGHT' in normalizedRaw) return normalizedRaw.NIGHT;
    
    // Native token ID is often empty string or all zeros
    if (normalizedRaw['']) return normalizedRaw[''];
    
    // If it's a dictionary of TokenId -> balance, try to find the biggest balance or just take the first
    const values = Object.values(normalizedRaw);
    if (values.length > 0) {
      // Find the first numeric/bigint/string value
      const validVals = values.filter(v => 
        typeof v === 'number' || 
        typeof v === 'bigint' || 
        (typeof v === 'string' && /^\d+$/.test(v))
      );
      
      if (validVals.length > 0) {
        // Return the largest (likely NIGHT since DUST is separated, and user has 50k NIGHT)
        return validVals.sort((a, b) => Number(BigInt(b as any) - BigInt(a as any)))[0] as number | bigint;
      }
      
      // If it's an object with an 'amount' or 'balance' key (e.g. nested)
      const objVals = values.filter(v => v && typeof v === 'object');
      if (objVals.length > 0) {
         const firstObj = objVals[0] as any;
         return firstObj.balance ?? firstObj.amount ?? firstObj.value ?? firstObj.quantity ?? 0;
      }
    }
  }

  console.warn(`[MatkaNight:balance] ${label} unexpected shape, defaulting to 0:`, raw);
  return 0;
}

/**
 * Extract DUST balance from the raw return of getDustBalance().
 * Usually a plain number/bigint but we normalise defensively.
 */
function extractDust(raw: any): number | bigint {
  console.log('[MatkaNight:balance] dust raw:', typeof raw, raw);

  if (raw == null) return 0;
  
  // Direct values
  if (typeof raw === 'number' || typeof raw === 'bigint') return raw;
  if (typeof raw === 'string') return Number(raw) || 0;

  let normalizedRaw = raw;
  if (typeof raw === 'object' && typeof raw[Symbol.iterator] === 'function' && !Array.isArray(raw)) {
    try {
      normalizedRaw = Array.from(raw);
    } catch (e) {}
  }

  // Object checks
  if (typeof normalizedRaw === 'object') {
    if ('dust' in normalizedRaw) return normalizedRaw.dust ?? 0;
    if ('DUST' in normalizedRaw) return normalizedRaw.DUST ?? 0;
    
    // Check common generic return keys
    if ('balance' in normalizedRaw) return normalizedRaw.balance;
    if ('amount' in normalizedRaw) return normalizedRaw.amount;
    if ('value' in normalizedRaw) return normalizedRaw.value;

    const values = Array.isArray(normalizedRaw) ? normalizedRaw : Object.values(normalizedRaw);
    if (values.length > 0) {
      // Find the first numeric/bigint value
      const numValues = values.filter(v => typeof v === 'number' || typeof v === 'bigint') as (number|bigint)[];
      if (numValues.length > 0) {
        return numValues[0];
      }
      
      const objVals = values.filter(v => v && typeof v === 'object');
      if (objVals.length > 0) {
         const firstObj = objVals[0] as any;
         return firstObj.balance ?? firstObj.amount ?? firstObj.value ?? firstObj.quantity ?? 0;
      }
    }
  }

  console.warn('[MatkaNight:balance] dust unexpected shape:', raw);
  return 0;
}

/**
 * Read all balances from the connected API, normalise, convert from
 * atomic units to display units via format.ts, and update walletState.
 * Returns the display-unit values.
 */
async function readAndUpdateBalances(): Promise<{ night: number; dust: number }> {
  if (!connectedAPI) return { night: 0, dust: 0 };

  const [shieldedRaw, unshieldedRaw, dustRaw] = await Promise.all([
    connectedAPI.getShieldedBalances().catch((e: any) => {
      console.warn('[MatkaNight:balance] getShieldedBalances failed:', e);
      return null;
    }),
    connectedAPI.getUnshieldedBalances().catch((e: any) => {
      console.warn('[MatkaNight:balance] getUnshieldedBalances failed:', e);
      return null;
    }),
    connectedAPI.getDustBalance().catch((e: any) => {
      console.warn('[MatkaNight:balance] getDustBalance failed:', e);
      return 0;
    }),
  ]);

  // Extract raw atomic values
  const shieldedNightRaw = extractNightFromBalances(shieldedRaw, 'shielded');
  const unshieldedNightRaw = extractNightFromBalances(unshieldedRaw, 'unshielded');
  const dustAtomicRaw = extractDust(dustRaw);

  // Sum shielded + unshielded (both in atomic units)
  const totalNightAtomic = BigInt(shieldedNightRaw) + BigInt(unshieldedNightRaw);
  const totalDustAtomic = BigInt(dustAtomicRaw);

  // Convert atomic → display using single-source-of-truth formatters
  const nightDisplay = formatNight(totalNightAtomic, /* debug */ true);
  const dustDisplay = formatDust(totalDustAtomic, /* debug */ true);

  console.log('[MatkaNight:balance] FINAL display → NIGHT:', nightDisplay, '| DUST:', dustDisplay);

  walletState = {
    ...walletState,
    nightBalance: nightDisplay,
    dustBalance: dustDisplay,
  };
  notifyListeners();

  return { night: nightDisplay, dust: dustDisplay };
}

// --- Public service ---

export const walletService = {
  subscribe(listener: WalletListener) {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  getState(): WalletState {
    return { ...walletState };
  },

  getAPI(): ConnectedWalletAPI | null {
    return connectedAPI;
  },

  getUris(): ServiceUriConfig | null {
    return currentUris;
  },

  getActiveWallet(): DetectedWallet | null {
    return activeWallet;
  },

  /**
   * Connect to a specific detected wallet using DApp Connector API v4.
   * If no wallet is passed, falls back to auto-detecting and picking the first.
   */
  async connect(wallet?: DetectedWallet): Promise<WalletState> {
    walletState = { ...walletState, status: 'connecting' };
    notifyListeners();

    try {
      // If no specific wallet passed, detect and pick first available
      if (!wallet) {
        const detected = await waitForWallets();
        if (detected.length === 0) {
          walletState = { ...walletState, status: 'no_wallet' };
          notifyListeners();
          throw new Error(
            'No compatible Midnight wallet found. Install Lace or 1AM to play.'
          );
        }
        wallet = detected[0];
      }

      activeWallet = wallet;

      // Grab service URIs if the wallet exposes them
      // Grab service URIs if the wallet exposes them
      if (wallet.api.serviceUriConfig) {
        try {
          currentUris = await wallet.api.serviceUriConfig();
        } catch (err: any) {
          console.error('[MatkaNight] Error in serviceUriConfig():', err);
          throw new Error('Failed to get service URIs from wallet: ' + err.message);
        }
      }

      // v4: connect(networkId) replaces the old enable()
      try {
        connectedAPI = await wallet.api.connect(NETWORK_ID);
      } catch (connectErr: any) {
        // If the wallet is on a different network it may throw or return null
        const msg = connectErr?.message?.toLowerCase?.() || '';
        if (msg.includes('network') || msg.includes('mismatch')) {
          walletState = {
            ...walletState,
            status: 'wrong_network',
          };
          notifyListeners();
          
          // Try to extract the actual network from the error message if possible
          const actualNetworkMatch = msg.match(/expected .*? but got (.*?)(?:\.|$)/i) || msg.match(/currently on (.*?)(?:\.|$)/i);
          const actualNetwork = actualNetworkMatch ? actualNetworkMatch[1] : 'a different network';
          
          console.log('[MatkaNight] Network mismatch. Wallet reports:', actualNetwork, '| app expects:', NETWORK_ID);
          console.log('[MatkaNight] Raw connect() error:', connectErr);

          if (actualNetwork.toLowerCase() === NETWORK_ID.toLowerCase()) {
             console.warn('[MatkaNight] Network strings match ignoring case! This might be a strict equality bug inside the extension.');
          }
          
          throw new Error(
            `${wallet.name} is on ${actualNetwork} — switch to ${NETWORK_ID} in the extension and try again.`
          );
        }
        // User rejected the connection prompt
        if (msg.includes('reject') || msg.includes('denied') || msg.includes('cancel')) {
          walletState = { ...walletState, status: 'rejected' };
          notifyListeners();
          throw connectErr;
        }
        console.error('[MatkaNight] Unknown connect error:', connectErr);
        throw new Error('Wallet connection failed: ' + connectErr.message);
      }

      if (!connectedAPI) {
        walletState = { ...walletState, status: 'wrong_network' };
        notifyListeners();
        throw new Error(`${wallet.name} returned null — likely a network mismatch with ${NETWORK_ID}.`);
      }

      // Read address
      let address: string;
      try {
        const shieldedAddrs = await connectedAPI.getShieldedAddresses();
        const rawUnshielded = await connectedAPI.getUnshieldedAddress();

        // SDK returns { shieldedAddress, shieldedCoinPublicKey, shieldedEncryptionPublicKey }
        const primaryShielded = shieldedAddrs.shieldedAddress;

        let unshieldedStr = '';
        if (typeof rawUnshielded === 'string') {
          unshieldedStr = rawUnshielded;
        } else if (rawUnshielded && typeof rawUnshielded === 'object' && 'unshieldedAddress' in rawUnshielded) {
          unshieldedStr = (rawUnshielded as any).unshieldedAddress;
        } else if (rawUnshielded) {
          unshieldedStr = String(rawUnshielded);
        }

        address = primaryShielded || unshieldedStr || '0x???';
      } catch (err: any) {
        console.error('[MatkaNight] Error in address fetch:', err);
        throw new Error('Failed to fetch address: ' + err.message);
      }

      walletState = {
        ...walletState,
        status: 'connected',
        name: wallet!.name,
        rdns: wallet!.rdns,
        address,
      };

      // Read balances (this also logs raw shapes + applies decimal conversion)
      try {
        await readAndUpdateBalances();
      } catch (err: any) {
        console.error('[MatkaNight] Error in readAndUpdateBalances:', err);
        throw new Error('Failed to read balances: ' + err.message);
      }

      return { ...walletState };

    } catch (error) {
      // Only set status if we haven't already set a more specific one
      if (walletState.status === 'connecting') {
        walletState = { ...walletState, status: 'rejected' };
        notifyListeners();
      }
      console.error('[MatkaNight] Wallet connect error:', error);
      throw error;
    }
  },

  async disconnect(): Promise<void> {
    connectedAPI = null;
    activeWallet = null;
    currentUris = null;
    walletState = {
      status: 'disconnected',
      address: null,
      nightBalance: 0,
      dustBalance: 0,
    };
    notifyListeners();
  },

  /**
   * Re-reads balances from the chain. Should be called after every transaction
   * so the HUD stays in sync with 1AM's own display.
   */
  async refreshBalances(): Promise<{ night: number; dust: number }> {
    if (!connectedAPI) return { night: 0, dust: 0 };
    try {
      return await readAndUpdateBalances();
    } catch (e) {
      console.error('[MatkaNight] Balance refresh error:', e);
      return { night: walletState.nightBalance, dust: walletState.dustBalance };
    }
  },

  // After a real network transaction, balances are read from the chain.
  // These thin wrappers exist so the gameStore call sites don't break.
  async deductBalance(_amount: number): Promise<boolean> {
    await this.refreshBalances();
    return true;
  },

  async addBalance(_amount: number): Promise<void> {
    await this.refreshBalances();
  },
};
