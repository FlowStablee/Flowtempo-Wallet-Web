import { ethers, formatUnits } from 'ethers';
import QRCode from 'qrcode';
import type { Feature } from './types';
import { BlockchainService } from '../services/BlockchainService';
import { CONFIG } from '../config';
import { ERC20_ABI } from '../contracts';
import { PollingService } from '../services/PollingService';
import { HistoryService } from '../services/HistoryService';
import { CacheService } from '../services/CacheService';
import type { TokenBalance } from '../services/CacheService';
import { getIcon, getTokenLogo, getTxTypeIcon } from '../utils/icons';

export class DashboardFeature implements Feature {
    id = 'dashboard';
    name = 'Dashboard';
    icon = ''; // No emoji, icon handled elsewhere
    order = 1;

    render(container: HTMLElement) {
        const cache = CacheService.getInstance();

        const cachedAddress = cache.getAddress() || '0x...';
        const cachedBalances = cache.getBalances();
        const lastUpdated = cache.getLastUpdated();
        const lastRefreshText = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--';

        container.innerHTML = `
            <div class="space-y-6 slide-up">
                
                <!-- Status Bar - Subtle, Lightweight -->
                <div class="status-bar">
                    <!-- Network Status -->
                    <div class="status-item">
                        <span class="status-dot status-dot-success"></span>
                        <span class="status-label">${CONFIG.NETWORK_NAME}</span>
                        <span class="status-meta">Chain ${CONFIG.CHAIN_ID}</span>
                    </div>
                    
                    <div class="status-separator"></div>
                    
                    <!-- Wallet Address with actions -->
                    <div class="status-item" style="gap: 12px;">
                        <code id="dash-address" class="status-address">${cachedAddress.substring(0, 8)}...${cachedAddress.slice(-6)}</code>
                        <div class="status-actions">
                            <button id="copy-address-btn" class="status-action-btn" title="Copy address">
                                ${getIcon('copy', 14)}
                            </button>
                            <button id="receive-btn" class="status-action-btn" title="Receive">
                                ${getIcon('download', 14)}
                            </button>
                        </div>
                    </div>
                    
                    <div class="status-separator"></div>
                    
                    <!-- Last Refresh -->
                    <div class="status-item">
                        <span class="status-meta">${getIcon('refresh', 12)}</span>
                        <span id="last-refresh" class="status-meta">${lastRefreshText}</span>
                        <span class="status-hint">· auto 20s</span>
                    </div>
                </div>
                
                <!-- Receive Modal -->
                <div id="receive-modal" class="modal-overlay hidden" data-address="${cachedAddress}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Receive Funds</h3>
                            <button id="close-receive-modal" class="modal-close">${getIcon('x', 18)}</button>
                        </div>
                        <div class="modal-body">
                            <div id="qr-code" class="qr-container"></div>
                            <p class="receive-label">Your Wallet Address</p>
                            <code id="receive-full-address" class="receive-address"></code>
                            <button id="copy-full-address-btn" class="btn btn-secondary" style="width: 100%; margin-top: 16px;">
                                ${getIcon('copy', 16)}
                                <span>Copy Address</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Token Holdings -->
                <div class="card">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="section-icon">
                                ${getIcon('coins', 20)}
                            </div>
                            <h3 class="text-lg font-semibold" style="color: var(--color-text-primary);">Asset Holdings</h3>
                        </div>
                        <div class="flex gap-2">
                             <button id="dash-manage-token-btn" class="btn-ghost btn-sm flex items-center gap-1" style="font-size: 11px; opacity: 0.7;">
                                ${getIcon('settings', 14)}
                                <span>Manage</span>
                            </button>
                            <button id="dash-import-token-btn" class="btn-ghost btn-sm flex items-center gap-1" style="font-size: 11px;">
                                ${getIcon('plus', 14)}
                                <span>Import</span>
                            </button>
                        </div>
                    </div>

                    <!-- Manage Tokens Modal -->
                    <div id="manage-tokens-modal" class="modal-overlay hidden">
                        <div class="modal-content" style="max-width: 400px;">
                            <div class="modal-header">
                                <h3>Manage Tokens</h3>
                                <button id="close-manage-modal" class="modal-close">${getIcon('x', 18)}</button>
                            </div>
                            <div class="modal-body">
                                <p class="text-xs text-gray-400 mb-4">Custom imported tokens stored locally.</p>
                                <div id="user-token-list" class="space-y-2 max-h-60 overflow-y-auto mb-4">
                                    <!-- List injected here -->
                                </div>
                                <div id="manage-empty-state" class="text-center text-xs text-gray-500 py-4 hidden">
                                    No custom tokens found.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Import Form -->
                    <div id="dash-import-form" class="hidden mb-4 p-4 rounded-lg" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);">
                        <div class="flex gap-2">
                            <input type="text" id="dash-import-address" class="input w-full" placeholder="Token contract address (0x...)">
                            <button id="dash-confirm-import" class="btn btn-secondary">Import</button>
                        </div>
                    </div>

                    <div id="holdings-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.renderBalancesHTML(cachedBalances)}
                    </div>
                </div>

                <!-- Transaction History Data Table -->
                <div class="activity-section" style="display: flex; flex-direction: column; max-height: 400px;">
                    <div class="activity-header">
                        <div class="activity-title">
                            <div class="section-icon">
                                ${getIcon('history', 20)}
                            </div>
                            <h3>Transaction History</h3>
                        </div>
                        <span class="text-xs" style="color: var(--color-text-tertiary);">Last 10 transactions</span>
                    </div>
                    
                    <!-- Table Header -->
                    <div class="data-table-header">
                        <span class="col-type">Type</span>
                        <span class="col-time">Time</span>
                        <span class="col-status">Status</span>
                        <span class="col-action">Action</span>
                    </div>
                    
                    <!-- Scrollable Table Body -->
                    <div id="history-list" class="data-table-body">
                        <div class="skeleton h-12 w-full mb-2"></div>
                        <div class="skeleton h-12 w-full mb-2"></div>
                        <div class="skeleton h-12 w-full"></div>
                    </div>
                </div>
                
                <style>
                    .data-table-header {
                        display: grid;
                        grid-template-columns: 2fr 2fr 1fr 1fr;
                        gap: 16px;
                        padding: 12px 16px;
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 8px 8px 0 0;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: var(--color-text-tertiary);
                    }
                    
                    .data-table-body {
                        flex: 1;
                        overflow-y: auto;
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        border-top: none;
                        border-radius: 0 0 8px 8px;
                    }
                    
                    .data-table-row {
                        display: grid;
                        grid-template-columns: 2fr 2fr 1fr 1fr;
                        gap: 16px;
                        padding: 14px 16px;
                        align-items: center;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                        transition: background 0.15s ease;
                    }
                    
                    .data-table-row:hover {
                        background: rgba(139, 92, 246, 0.05);
                    }
                    
                    .data-table-row:last-child {
                        border-bottom: none;
                    }
                    
                    .tx-type-cell {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    
                    .tx-type-icon {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        /* Styles handled by getTxTypeIcon */
                    }
                </style>

            </div>
        `;

        this.loadHistory();
    }

    renderBalancesHTML(balances: TokenBalance[]): string {
        if (balances.length === 0) {
            return `
                <div class="col-span-full flex flex-col items-center justify-center py-8">
                    <div class="icon-container icon-bg-primary mb-4">
                        ${getIcon('coins', 24)}
                    </div>
                    <p class="text-sm" style="color: var(--color-text-secondary);">Loading assets...</p>
                </div>
            `;
        }

        return balances.map(b => `
            <div class="asset-card">
                <div class="asset-card-header">
                    ${getTokenLogo(b.symbol, 64, b.address)}
                    <div class="asset-info">
                        <h3 class="asset-name">${b.symbol}</h3>
                        <p class="asset-address">${b.address.substring(0, 12)}...${b.address.slice(-6)}</p>
                    </div>
                </div>
                <p class="asset-balance">${parseFloat(b.balance).toFixed(4)}</p>
            </div>
        `).join('');
    }

    async init() {
        const blockchain = BlockchainService.getInstance();
        const address = await blockchain.getSigner().getAddress();
        const cache = CacheService.getInstance();

        cache.setAddress(address);

        const addrEl = document.getElementById('dash-address');
        if (addrEl) addrEl.textContent = `${address.substring(0, 8)}...${address.slice(-6)}`;

        // Copy address button
        document.getElementById('copy-address-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(address);
            const btn = document.getElementById('copy-address-btn');
            if (btn) {
                btn.innerHTML = getIcon('check', 14);
                setTimeout(() => {
                    btn.innerHTML = getIcon('copy', 14);
                }, 2000);
            }
        });

        // Receive modal
        const receiveBtn = document.getElementById('receive-btn');
        const receiveModal = document.getElementById('receive-modal');
        const closeModalBtn = document.getElementById('close-receive-modal');
        const copyFullBtn = document.getElementById('copy-full-address-btn');
        const qrContainer = document.getElementById('qr-code');

        receiveBtn?.addEventListener('click', () => {
            // Move modal to body for proper fixed positioning
            if (receiveModal && receiveModal.parentElement !== document.body) {
                document.body.appendChild(receiveModal);
            }
            receiveModal?.classList.remove('hidden');
            // Set full address
            const addressEl = document.getElementById('receive-full-address');
            if (addressEl) addressEl.textContent = address;
            // Generate QR code
            if (qrContainer && !qrContainer.querySelector('canvas')) {
                this.generateQRCode(qrContainer, address);
            }
        });

        closeModalBtn?.addEventListener('click', () => {
            receiveModal?.classList.add('hidden');
        });

        receiveModal?.addEventListener('click', (e) => {
            if (e.target === receiveModal) {
                receiveModal.classList.add('hidden');
            }
        });

        copyFullBtn?.addEventListener('click', () => {
            navigator.clipboard.writeText(address);
            const span = copyFullBtn.querySelector('span');
            if (span) {
                span.textContent = 'Copied!';
                setTimeout(() => {
                    span.textContent = 'Copy Address';
                }, 2000);
            }
        });

        this.refreshBalancesSilently(address);

        PollingService.getInstance().register('dashboard-balances', async () => {
            await this.refreshBalancesSilently(address);
        });

        // Import Token Handlers
        const importBtn = document.getElementById('dash-import-token-btn');
        const importForm = document.getElementById('dash-import-form');
        const confirmImport = document.getElementById('dash-confirm-import');

        // Manage Token Handlers
        const manageBtn = document.getElementById('dash-manage-token-btn');
        const manageModal = document.getElementById('manage-tokens-modal');
        const closeManage = document.getElementById('close-manage-modal');
        const tokenListEl = document.getElementById('user-token-list');

        const renderUserTokens = () => {
            if (!tokenListEl) return;
            tokenListEl.innerHTML = '';
            try {
                const stored = localStorage.getItem('tempo_user_tokens');
                const tokens = stored ? JSON.parse(stored) : [];

                if (tokens.length === 0) {
                    document.getElementById('manage-empty-state')?.classList.remove('hidden');
                } else {
                    document.getElementById('manage-empty-state')?.classList.add('hidden');
                    tokens.forEach((t: any, index: number) => {
                        const row = document.createElement('div');
                        row.className = 'flex items-center justify-between p-3 rounded bg-white/5 border border-white/5';
                        row.innerHTML = `
                            <div class="flex items-center gap-3">
                                ${getTokenLogo(t.symbol, 28, t.address)}
                                <div>
                                    <div class="font-bold text-xs">${t.symbol}</div>
                                    <div class="text-[10px] text-gray-400 font-mono">${t.address.substring(0, 6)}...${t.address.slice(-4)}</div>
                                </div>
                            </div>
                            <button class="text-red-400 hover:text-red-300 transition-colors btn-delete-token" data-idx="${index}">
                                ${getIcon('trash', 14)}
                            </button>
                        `;
                        tokenListEl.appendChild(row);
                    });

                    // Attach Delete Listeners
                    document.querySelectorAll('.btn-delete-token').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx || '-1');
                            if (idx > -1) {
                                tokens.splice(idx, 1);
                                localStorage.setItem('tempo_user_tokens', JSON.stringify(tokens));
                                renderUserTokens(); // Re-render list
                                this.refreshBalancesSilently(address); // Refresh background
                            }
                        });
                    });
                }
            } catch (e) { console.error(e); }
        };

        manageBtn?.addEventListener('click', () => {
            if (manageModal && manageModal.parentElement !== document.body) {
                document.body.appendChild(manageModal);
            }
            manageModal?.classList.remove('hidden');
            renderUserTokens();
        });

        closeManage?.addEventListener('click', () => manageModal?.classList.add('hidden'));

        // Close on outside click
        manageModal?.addEventListener('click', (e) => {
            if (e.target === manageModal) manageModal.classList.add('hidden');
        });

        importBtn?.addEventListener('click', () => {
            importForm?.classList.toggle('hidden');
        });

        confirmImport?.addEventListener('click', async () => {
            const tokenAddr = (document.getElementById('dash-import-address') as HTMLInputElement).value;
            const symbol = (document.getElementById('dash-import-symbol') as HTMLInputElement).value;

            if (tokenAddr && symbol) {
                try {
                    const stored = localStorage.getItem('tempo_user_tokens');
                    const tokens = stored ? JSON.parse(stored) : [];
                    tokens.push({ address: tokenAddr, symbol: symbol });
                    localStorage.setItem('tempo_user_tokens', JSON.stringify(tokens));

                    // Reset & Hide
                    (document.getElementById('dash-import-address') as HTMLInputElement).value = '';
                    (document.getElementById('dash-import-symbol') as HTMLInputElement).value = '';
                    importForm?.classList.add('hidden');

                    // Refresh
                    await this.refreshBalancesSilently(address);
                } catch (e) { console.error(e); }
            }
        });
    }

    private async generateQRCode(container: HTMLElement, address: string) {
        try {
            container.innerHTML = '';
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, address, {
                width: 150,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            container.appendChild(canvas);
        } catch (err) {
            container.innerHTML = `<div style="color: var(--color-text-tertiary); font-size: 12px;">QR Code Error</div>`;
        }
    }

    async refreshBalancesSilently(address: string) {
        const cache = CacheService.getInstance();
        const balances: TokenBalance[] = [];
        const signer = BlockchainService.getInstance().getSigner();

        // 1. Load User Tokens from LocalStorage
        let userTokens: Record<string, string> = {};
        try {
            const stored = localStorage.getItem('tempo_user_tokens');
            if (stored) {
                const parsed = JSON.parse(stored); // Array of {symbol, address, ...}
                parsed.forEach((t: any) => {
                    userTokens[t.symbol] = t.address;
                });
            }
        } catch (e) { console.error("Error loading user tokens", e); }

        // Merge CONFIG tokens and User tokens
        const allTokens = { ...CONFIG.TOKENS, ...userTokens };

        for (const [symbol, tokenAddr] of Object.entries(allTokens)) {
            try {
                const contract = new ethers.Contract(tokenAddr as string, ERC20_ABI, signer);
                const balance = await contract.balanceOf(address);
                const decimals = await contract.decimals();
                const formatted = formatUnits(balance, decimals);

                balances.push({
                    symbol,
                    address: tokenAddr as string,
                    balance: formatted,
                    decimals: Number(decimals)
                });
            } catch (err) {
                console.warn(`Failed to load ${symbol}`, err);
            }
        }

        cache.setBalances(balances);

        const holdingsGrid = document.getElementById('holdings-grid');
        if (holdingsGrid) {
            holdingsGrid.innerHTML = this.renderBalancesHTML(balances);
        }

        const refreshEl = document.getElementById('last-refresh');
        if (refreshEl) {
            refreshEl.textContent = new Date().toLocaleTimeString();
        }
    }

    loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        const history = HistoryService.getInstance().getRecent(10);

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12">
                    <div class="icon-container icon-bg-info mb-4">
                        ${getIcon('history', 24)}
                    </div>
                    <p class="text-sm" style="color: var(--color-text-secondary);">No transactions yet</p>
                    <p class="text-xs mt-1" style="color: var(--color-text-tertiary);">Your activity will appear here</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = '';

        for (const entry of history) {
            const el = document.createElement('div');
            el.className = 'data-table-row';

            // "dont show pending show failed for pending" logic
            let displayLabel = 'Pending';
            let statusClass = 'badge-success';

            if (entry.status === 'success') {
                statusClass = 'badge-success';
                displayLabel = 'Success';
            } else if (entry.status === 'failed' || entry.status === 'pending') {
                statusClass = 'badge-error';
                displayLabel = 'Failed'; // Treat pending as failed per request
            }

            // Ensure Faucet is handled
            const typeLabel = entry.type === 'faucet' ? 'Faucet Claim' : entry.type;

            el.innerHTML = `
                <div class="tx-type-cell">
                    ${getTxTypeIcon(entry.type, 36)}
                    <span class="font-medium capitalize" style="color: var(--color-text-primary);">${typeLabel}</span>
                </div>
                <span class="text-sm" style="color: var(--color-text-secondary);">${new Date(entry.timestamp).toLocaleString()}</span>
                <span class="status-badge ${statusClass}">${displayLabel}</span>
                <a href="${CONFIG.EXPLORER_URL}/tx/${entry.hash}" target="_blank" class="action-button">
                    ${getIcon('externalLink', 16)}
                </a>
            `;
            historyList.appendChild(el);
        }
    }
}

