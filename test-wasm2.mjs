import { LedgerParameters as ESM_LP } from '@midnight-ntwrk/ledger-v8';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ledgerCJS = require('@midnight-ntwrk/ledger-v8');
console.log('Same LedgerParameters?', ESM_LP === ledgerCJS.LedgerParameters);
