import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const resolveOptions = { paths: [ require.resolve('@midnight-ntwrk/zswap') ] };
const zswapLedgerV8 = require.resolve('@midnight-ntwrk/ledger-v8', resolveOptions);

const protocolOptions = { paths: [ require.resolve('@midnight-ntwrk/midnight-js-protocol') ] };
const protocolLedgerV8 = require.resolve('@midnight-ntwrk/ledger-v8', protocolOptions);

console.log('zswap ledger-v8:', zswapLedgerV8);
console.log('protocol ledger-v8:', protocolLedgerV8);
console.log('Match?', zswapLedgerV8 === protocolLedgerV8);
