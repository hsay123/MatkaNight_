// ─── Balance Formatting — Single Source of Truth ───
// Midnight balances are returned as atomic (smallest-unit) integers.
// NIGHT uses 6 decimals (1 NIGHT = 1_000_000 STAR).
// DUST uses 15 decimals (1 DUST = 1_000_000_000_000_000 SPECK).
// Reference: @midnight-ntwrk/ledger token metadata & 1AM extension display.
//
// IMPORTANT: Adjust MIDNIGHT_DECIMALS if the testnet/devnet uses different
// precision — this is the ONE place to change it.

export const MIDNIGHT_DECIMALS = 6;
export const DUST_DECIMALS = 15;

/**
 * Converts a raw atomic chain balance to the human-readable display value.
 * e.g. 5000000000000 -> 50000.0  (with 8 decimals)
 *
 * Also logs raw vs. formatted for diagnostics when `debug` is true.
 */
export function formatNight(rawBalance: number | string | bigint, debug = false): number {
  const raw = toBigIntSafe(rawBalance);
  const divisor = BigInt(10 ** MIDNIGHT_DECIMALS);
  const wholePart = raw / divisor;
  const fracPart = raw % divisor;
  // Build a high-precision number without floating-point drift
  const formatted = Number(wholePart) + Number(fracPart) / Number(divisor);

  if (debug) {
    console.log('[MatkaNight:format] NIGHT raw →', rawBalance.toString(), '| formatted →', formatted);
  }

  return formatted;
}

/**
 * Converts a display balance back to atomic units for transactions.
 * e.g. 15 -> 1500000000  (with 8 decimals)
 */
export function toAtomicNight(displayBalance: number): bigint {
  return BigInt(Math.round(displayBalance * 10 ** MIDNIGHT_DECIMALS));
}

/**
 * Converts raw DUST to display value.
 */
export function formatDust(rawBalance: number | string | bigint, debug = false): number {
  const raw = toBigIntSafe(rawBalance);
  const divisor = BigInt(10 ** DUST_DECIMALS);
  const wholePart = raw / divisor;
  const fracPart = raw % divisor;
  const formatted = Number(wholePart) + Number(fracPart) / Number(divisor);

  if (debug) {
    console.log('[MatkaNight:format] DUST raw →', rawBalance.toString(), '| formatted →', formatted);
  }

  return formatted;
}

/**
 * Formats a display-unit number to the string shown in the HUD.
 * e.g. 50000 → "50000.0", 3446.123 → "3446.1"
 */
export function displayBalance(value: number): string {
  return value.toFixed(1);
}

/**
 * Safely coerce any raw balance value into a BigInt.
 * Handles number, string (decimal or hex), and bigint inputs.
 */
function toBigIntSafe(value: number | string | bigint): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') {
    // Handle hex strings from some wallet APIs
    if (value.startsWith('0x')) return BigInt(value);
    // Handle decimal strings — strip any trailing decimals (shouldn't exist but be safe)
    return BigInt(value.split('.')[0]);
  }
  // number — must be integer for BigInt conversion
  if (!Number.isFinite(value)) return 0n;
  return BigInt(Math.round(value));
}
