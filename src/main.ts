import './style.css'
import { AccountManager } from './services/AccountManager';
import { BlockchainService } from './services/BlockchainService';
import { renderAuthScreen } from './ui/AuthScreen';
import { renderDashboard } from './ui/Dashboard';
import { renderSplashScreen } from './ui/SplashScreen';

const app = document.querySelector<HTMLDivElement>('#app')!;

import { CacheService } from './services/CacheService';
import { CONFIG } from './config';

async function init() {
  // Preload Assets & Token Logos
  const assets = [
    '/tempoflow-icon.jpg',
    '/tempoflow-logo.png',
    '/logo.jpeg',
    '/vite.svg'
  ];

  // Config Tokens
  const configTokens = Object.values(CONFIG.TOKENS).map(addr =>
    `${CONFIG.TOKENLIST_URL}/${CONFIG.CHAIN_ID}/${addr}`
  );

  // User Tokens (local storage)
  let userTokens: string[] = [];
  try {
    const stored = localStorage.getItem('tempo_user_tokens');
    if (stored) {
      const parsed = JSON.parse(stored);
      userTokens = parsed.map((t: any) => `${CONFIG.TOKENLIST_URL}/${CONFIG.CHAIN_ID}/${t.address}`);
    }
  } catch { }

  CacheService.getInstance().preloadImages([
    ...assets,
    ...configTokens,
    ...userTokens
  ]);

  // Show splash screen first
  renderSplashScreen(app, () => {
    // After splash completes, show auth
    if (AccountManager.hasWallet()) {
      renderAuthScreen(app, true); // unlock mode
    } else {
      renderAuthScreen(app, false); // create/import mode
    }
  });
}

// Global Event Bus for navigation
window.addEventListener('wallet-unlocked', async (e: any) => {
  const { password } = e.detail;
  try {
    const wallet = await AccountManager.unlockWallet(password);
    BlockchainService.getInstance().setWallet(wallet);
    renderDashboard(app);
  } catch (err) {
    alert("Failed to unlock wallet: " + err);
  }
});

window.addEventListener('wallet-created', async (e: any) => {
  const { password } = e.detail;
  try {
    const wallet = await AccountManager.unlockWallet(password);
    BlockchainService.getInstance().setWallet(wallet);
    renderDashboard(app);
  } catch (err) {
    alert("Failed to load new wallet: " + err);
  }
});

init();

