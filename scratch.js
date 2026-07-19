import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  await page.addInitScript(() => {
    window.midnight = {
      '1am': {
        name: '1AM',
        apiVersion: '4.0.0',
        rdns: 'com.midnight.1am',
        connect: async () => ({
          getShieldedBalances: async () => ({ night: 10000n }),
          getUnshieldedBalances: async () => ({ night: 5000n }),
          getDustBalance: async () => 100n,
          getShieldedAddresses: async () => ['0xshielded'],
          getUnshieldedAddress: async () => '0xunshielded',
          balanceUnsealedTransaction: async (tx) => {
            console.log('[MOCK WALLET] balanceUnsealedTransaction called with', tx);
            return { ...tx, balanced: true };
          },
          submitTransaction: async (tx) => {
            console.log('[MOCK WALLET] submitTransaction called with', tx);
            return { txHash: '0xabc', commitmentHash: '0xdef' };
          }
        }),
        serviceUriConfig: async () => ({
          indexerUri: 'http://localhost:8088',
          proofServerUri: 'http://localhost:6300',
          networkId: 'testnet'
        })
      }
    };
  });

  await page.goto('http://localhost:5173');
  console.log('Page loaded');

  // Try to connect wallet
  await page.waitForTimeout(1000);
  try {
    const playBtn = page.getByRole('button', { name: /Play Now/i });
    if (await playBtn.isVisible()) await playBtn.click();
    console.log('Clicked Play Now');
    
    await page.waitForTimeout(500);
    const connectBtn = page.getByText(/1AM/i);
    if (await connectBtn.isVisible()) await connectBtn.click();
    console.log('Clicked 1AM wallet');
  } catch(e) {
    console.log('Wallet connect error', e);
  }

  // Click on a zone to bet
  await page.waitForTimeout(2000);
  try {
    const faceCardsZone = page.getByText('Face Cards');
    if (await faceCardsZone.isVisible()) await faceCardsZone.click();
    console.log('Selected Face Cards zone');
    
    await page.waitForTimeout(500);
    const placeBetBtn = page.getByRole('button', { name: /Place Bet/i });
    if (await placeBetBtn.isVisible()) await placeBetBtn.click();
    console.log('Clicked Place Bet');
  } catch(e) {
    console.log('Place bet error', e);
  }

  await page.waitForTimeout(3000);

  await browser.close();
})();
