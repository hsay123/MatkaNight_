// ─── MatkaNight Contract Deploy Script ───
// Parameterized for multi-network deployment.
//
// Networks (set DEPLOY_NETWORK to choose):
//
//   undeployed  — local Docker devnet (indexer :8088, node :9944, proof :6300)
//   preprod     — public Preprod testnet (indexer/preprod.midnight.network, rpc/preprod.midnight.network)
//                 Requires a local proof server at :6300 (Docker) OR use DEPLOY_PROOF_SERVER_URL.
//   preview     — public Preview testnet (indexer/preview.midnight.network, rpc/preview.midnight.network)
//                 1AM ProofStation handles proving — but the CLI deploy uses a local proof server.
//   mainnet     — production (indexer/mainnet.midnight.network, rpc/mainnet.midnight.network)
//
// Preprod endpoints (confirmed from official skill docs):
//   Indexer HTTP:  https://indexer.preprod.midnight.network/api/v4/graphql
//   Indexer WS:    wss://indexer.preprod.midnight.network/api/v4/graphql/ws
//   RPC:           https://rpc.preprod.midnight.network
//   Proof server:  http://127.0.0.1:6300 (local Docker) — run via:
//                     docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v

import { resolve } from 'path';
import { writeFileSync } from 'fs';

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract } from '../public/artifacts/contract/index.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';

const __dirname = process.cwd();

async function deploy() {
  // ─── Network selection ───
  const network = process.env.DEPLOY_NETWORK ?? 'undeployed';

  const envConfig: any = {
    walletNetworkId: network,
    networkId: network,
    indexer:    process.env.DEPLOY_INDEXER_URL    ?? 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS:  process.env.DEPLOY_INDEXER_WS_URL ?? 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node:       process.env.DEPLOY_NODE_URL       ?? 'http://127.0.0.1:9944',
    nodeWS:     process.env.DEPLOY_NODE_WS_URL    ?? 'ws://127.0.0.1:9944',
    proofServer: process.env.DEPLOY_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300',
    faucet: undefined,
  };

  console.log(`Starting MatkaNight contract deployment to "${network}" network...`);
  console.log('Endpoints:', {
    indexer: envConfig.indexer,
    node: envConfig.node,
    proofServer: envConfig.proofServer,
  });

  const seed = process.env.WALLET_SEED;
  if (!seed) {
    throw new Error('WALLET_SEED environment variable is required. Set it in .env or export it before running deploy.');
  }

  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD;
  if (!privateStatePassword) {
    throw new Error('PRIVATE_STATE_PASSWORD environment variable is required. Set it in .env or export it before running deploy.');
  }

  setNetworkId(network);

  const logger = { info: console.log, error: console.error, warn: console.warn, debug: console.debug, trace: console.debug } as any;
  const walletProvider = await MidnightWalletProvider.build(logger, envConfig, seed);
  await walletProvider.start();

  // Wait for funds
  const { waitForUnshieldedFunds } = await import('./wallet-utils.js');
  const { unshieldedToken } = await import('@midnight-ntwrk/midnight-js-protocol/ledger');
  console.log('Waiting for funds to sync...');
  await waitForUnshieldedFunds(logger, walletProvider.wallet, envConfig, unshieldedToken());

  // Wait for DUST (required for transaction fees on preprod/undeployed)
  try {
    const Rx = await import('rxjs');
    console.log('Waiting for DUST to accrue...');
    await Rx.firstValueFrom(
      walletProvider.wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.filter((s: any) => {
          const bal = s.dust.balance(new Date()) ?? 0n;
          return bal > 0n;
        }),
        Rx.timeout({ first: 120_000 }),
      ),
    );
    console.log('DUST available.');
  } catch (dustErr: any) {
    console.error('FATAL: DUST not available after 120s. Cannot deploy without DUST for transaction fees.');
    console.error('On preprod: register NIGHT UTXOs for DUST generation via the 1AM wallet extension first.');
    process.exit(1);
  }

  const midnightProvider = walletProvider;

  // Configure providers
  const zkAssetsPath = resolve(__dirname, 'public/artifacts');
  const zkConfigProvider = new NodeZkConfigProvider(zkAssetsPath);

  const providers: any = {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: async () => privateStatePassword,
      accountId: 'matkanight-deploy-state'
    }),
    publicDataProvider: indexerPublicDataProvider(envConfig.indexer, envConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider
  };

  // Load compiled artifacts
  const compiledContract = CompiledContract.withVacantWitnesses(
    CompiledContract.make('MatkaNight', Contract)
  );

  // Deploy
  console.log('Deploying via Midnight Provider...');

  try {
    const deployed = await deployContract(providers, {
        privateStateKey: 'matkaNight_' + Date.now(),
        compiledContract: compiledContract as any,
        initialPrivateState: {},
        args: []
    } as any);

    const contractAddress = deployed.deployTxData.public.contractAddress;
    const deployTxHash = deployed.deployTxData.public.txHash;

    console.log(`Deployed! Address: ${contractAddress}, TxHash: ${deployTxHash}`);

    const deploymentInfo = {
        network,
        contractAddress,
        deployTxHash
    };

    const outPath = resolve(__dirname, `contracts/deployment.${network}.json`);
    writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Wrote deployment info to deployment.${network}.json`);
  } catch (e) {
    console.error('Deployment failed:', e);
    process.exit(1);
  } finally {
    await walletProvider.stop();
  }
}

deploy().catch(console.error);
