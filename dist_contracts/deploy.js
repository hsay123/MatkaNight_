import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NetworkId } from '@midnight-ntwrk/zswap';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract } from '../public/artifacts/contract/index.js';
config();
const __dirname = process.cwd();
async function deploy() {
    console.log('Starting MatkaNight contract deployment to Undeployed network...');
    const seed = process.env.WALLET_SEED || '0000000000000000000000000000000000000000000000000000000000000000'; // 32-byte hex seed
    setNetworkId('undeployed');
    // 1. Build wallet object from seed
    const wallet = await WalletBuilder.build('http://127.0.0.1:8088/api/v1/graphql', 'ws://127.0.0.1:8088/api/v1/graphql/ws', 'http://127.0.0.1:6300', 'http://127.0.0.1:9944', seed, NetworkId.Undeployed, 'info');
    await wallet.start();
    const walletState = await new Promise((res) => {
        const sub = wallet.state().subscribe((s) => {
            console.log('Wallet address:', s.address);
            console.log('Wallet balances:', s.balances);
            console.log('Wallet state syncProgress:', s.syncProgress);
            if (s.syncProgress && s.syncProgress >= 1) { // 1 means 100% or similar
                res(s);
                sub.unsubscribe();
            }
            else if (s.syncProgress === undefined || s.syncProgress.progress === 100) {
                res(s);
                sub.unsubscribe();
            }
        });
    });
    const walletProvider = {
        coinPublicKey: walletState.coinPublicKey,
        encryptionPublicKey: walletState.encryptionPublicKey,
        balanceTx: async (tx, newCoins) => {
            console.log('balanceTx called with tx size:', tx.serialize().length);
            const balanced = await wallet.balanceTransaction(tx, newCoins ?? []);
            return await wallet.proveTransaction(balanced);
        },
        getCoinPublicKey: () => walletState.coinPublicKey,
        getEncryptionPublicKey: () => walletState.encryptionPublicKey
    };
    const midnightProvider = {
        submitTx: (tx) => wallet.submitTransaction(tx)
    };
    // 2. Configure providers for Testnet
    const zkConfigProvider = new FetchZkConfigProvider('http://127.0.0.1:8081/', fetch);
    const providers = {
        privateStateProvider: levelPrivateStateProvider({
            privateStoragePasswordProvider: async () => 'password',
            accountId: 'matkanight-deploy-state'
        }),
        publicDataProvider: indexerPublicDataProvider('http://127.0.0.1:8088/api/v1/graphql', 'ws://127.0.0.1:8088/api/v1/graphql/ws'),
        zkConfigProvider,
        proofProvider: httpClientProofProvider('http://127.0.0.1:6300', zkConfigProvider),
        walletProvider,
        midnightProvider
    };
    // 3. Load compiled artifacts
    const compiledContract = CompiledContract.withVacantWitnesses(CompiledContract.make('MatkaNight', Contract));
    // 4. Deploy
    console.log('Deploying via Midnight Provider...');
    try {
        const deployed = await deployContract(providers, {
            privateStateKey: 'matkaNight_' + Date.now(),
            compiledContract: compiledContract,
            initialPrivateState: {},
            args: []
        });
        const contractAddress = deployed.deployTxData.public.contractAddress;
        const deployTxHash = deployed.deployTxData.public.txHash;
        console.log(`Deployed! Address: ${contractAddress}, TxHash: ${deployTxHash}`);
        // 5. Write out deployment.json
        const deploymentInfo = {
            network: 'undeployed',
            contractAddress,
            deployTxHash
        };
        const outPath = resolve(__dirname, '../deployment.undeployed.json');
        writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
        console.log('Wrote deployment info to deployment.undeployed.json');
    }
    catch (e) {
        console.error('Deployment failed:', e);
        process.exit(1);
    }
    finally {
        await wallet.close();
    }
}
deploy().catch(console.error);
