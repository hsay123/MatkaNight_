import { maxField } from '@midnight-ntwrk/ledger-v8';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ledgerCJS = require('@midnight-ntwrk/ledger-v8');
console.log('ESM maxField:', maxField());
console.log('CJS maxField:', ledgerCJS.maxField());
console.log('Same WASM instance?', maxField === ledgerCJS.maxField);
