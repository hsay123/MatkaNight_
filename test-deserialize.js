const { UnprovenTransaction } = require('@midnight-ntwrk/zswap');
// Raw bytes printed earlier: 58, 192, 0... wait.
// Let's print the length of "midnight:transaction[v9](signature[v1],proof,embedded-fr[v1]):"
const prefix = "midnight:transaction[v9](signature[v1],proof,embedded-fr[v1]):";
console.log(prefix.length); // 62
