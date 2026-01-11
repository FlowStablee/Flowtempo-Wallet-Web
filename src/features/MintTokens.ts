import { Contract, parseUnits, keccak256, toUtf8Bytes } from 'ethers';
import type { Feature } from './types';
import { BlockchainService } from '../services/BlockchainService';
import { CONFIG } from '../config';
import { ERC20_ABI } from '../contracts';
import { HistoryService } from '../services/HistoryService';
import { PollingService } from '../services/PollingService';
import { getIcon } from '../utils/icons';

export class MintTokensFeature implements Feature {
    id = 'mint';
    name = 'Mint';
    icon = '';
    order = 6;

    userTokens: Array<{ address: string, symbol: string }> = [];

    render(container: HTMLElement) {
        container.innerHTML = `
            <div class="max-w-xl mx-auto">
                <div class="card">
                    <!-- Header -->
                    <div class="form-header">
                        <div class="section-icon">
                            ${getIcon('mint', 20)}
                        </div>
                        <div class="form-title"><span>>></span> mint_assets</div>
                    </div>
                    
                    <!-- Token Cache Section -->
                    <div class="mb-6 pb-4" style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <div class="flex items-center justify-between mb-3">
                            <span class="form-label" style="margin: 0;">Your Tokens</span>
                            <button id="import-token-btn" class="btn-ghost btn-sm flex items-center gap-1" style="padding: 4px 8px; font-size: 11px;">
                                ${getIcon('plus', 14)}
                                <span>Import Token</span>
                            </button>
                        </div>
                        
                        <div id="manual-import-form" class="hidden mb-4 p-4 rounded-lg" style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.15);">
                            <input type="text" id="manual-token-address" class="input mb-3" placeholder="Token contract address (0x...)">
                            <button id="confirm-import-btn" class="btn btn-secondary w-full btn-sm">
                                ${getIcon('download', 16)}
                                <span>Verify & Import</span>
                            </button>
                        </div>

                        <div id="user-tokens-list" class="grid grid-cols-2 gap-2 text-xs">
                            <div class="p-3 rounded-lg text-center" style="background: rgba(255,255,255,0.02); color: var(--color-text-tertiary);">
                                No tokens imported
                            </div>
                        </div>
                    </div>

                    <form id="mint-form" class="form-container">
                        <!-- Token Select -->
                        <div class="form-group">
                            <label class="form-label">Target Asset</label>
                            <select id="mint-token-select" class="select">
                                <option value="">Select a token...</option>
                            </select>
                        </div>

                        <!-- Amount -->
                        <div class="form-group">
                            <label class="form-label">Amount to Mint</label>
                            <input type="number" id="mint-amount" class="input" placeholder="0.00">
                        </div>

                        <!-- Recipient -->
                        <div class="form-group">
                            <label class="form-label">Recipient (Optional)</label>
                            <input type="text" id="mint-recipient" class="input" placeholder="Leave empty for self">
                        </div>

                        <button type="submit" id="mint-btn" class="btn btn-primary w-full">
                            ${getIcon('plus', 18)}
                            <span>Mint Tokens</span>
                        </button>
                    </form>

                    <!-- Log -->
                    <div id="mint-log" class="mt-6 pt-4 hidden" style="border-top: 1px solid rgba(255,255,255,0.06);">
                        <div class="form-label mb-3">Minting Log</div>
                        <div id="mint-log-content" class="space-y-2 max-h-40 overflow-y-auto" style="font-family: var(--font-mono); font-size: 12px;"></div>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
        const listEl = document.getElementById('user-tokens-list');
        const selectEl = document.getElementById('mint-token-select') as HTMLSelectElement;

        this.userTokens = this.loadStoredTokens();
        if (listEl && selectEl && this.userTokens.length > 0) {
            listEl.innerHTML = '';
            this.renderTokenList(listEl, selectEl);
        }
    }

    attachListeners() {
        document.getElementById('import-token-btn')?.addEventListener('click', () => {
            document.getElementById('manual-import-form')?.classList.toggle('hidden');
        });
        document.getElementById('confirm-import-btn')?.addEventListener('click', () => this.manualImport());

        document.getElementById('mint-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.mintTokens();
        });
    }

    async manualImport() {
        const input = document.getElementById('manual-token-address') as HTMLInputElement;
        const address = input.value.trim();

        if (!address.startsWith('0x') || address.length < 42) {
            return this.log('Invalid address format', 'error');
        }

        try {
            this.log(`Fetching metadata for ${address.substring(0, 10)}...`);
            const provider = BlockchainService.getInstance().provider;
            const tokenContract = new Contract(address, ERC20_ABI, provider);
            const symbol = await tokenContract.symbol();

            this.log(`Found: ${symbol}`, 'success');

            this.saveToken({ address, symbol });

            const listEl = document.getElementById('user-tokens-list');
            const selectEl = document.getElementById('mint-token-select') as HTMLSelectElement;
            if (listEl && selectEl) {
                this.renderTokenItem(address, symbol, listEl, selectEl);
            }

            input.value = '';
            document.getElementById('manual-import-form')?.classList.add('hidden');

        } catch (e) {
            this.log('Import failed: Invalid token or network error', 'error');
        }
    }

    log(message: string, type: 'info' | 'success' | 'error' = 'info') {
        const container = document.getElementById('mint-log');
        const content = document.getElementById('mint-log-content');
        if (container && content) {
            container.classList.remove('hidden');
            const el = document.createElement('div');
            const statusClass = type === 'error' ? 'status-error' : type === 'success' ? 'status-success' : 'status-info';
            el.className = `status-message ${statusClass}`;
            el.innerHTML = `> ${message}`;
            content.appendChild(el);
            content.scrollTop = content.scrollHeight;
        }
    }

    loadStoredTokens(): Array<{ address: string, symbol: string }> {
        try {
            const stored = localStorage.getItem('tempo_user_tokens');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    }

    saveToken(token: { address: string, symbol: string }) {
        const current = this.loadStoredTokens();
        if (!current.find(t => t.address === token.address)) {
            current.push(token);
            localStorage.setItem('tempo_user_tokens', JSON.stringify(current));
        }
    }

    renderTokenList(listEl: HTMLElement, selectEl: HTMLSelectElement) {
        this.userTokens.forEach(t => this.renderTokenItem(t.address, t.symbol, listEl, selectEl));
    }

    renderTokenItem(address: string, symbol: string, listEl: HTMLElement, selectEl: HTMLSelectElement) {
        if (Array.from(listEl.children).find(c => c.textContent?.includes(address))) return;

        const item = document.createElement('div');
        item.className = 'p-3 rounded-lg cursor-pointer transition-all';
        item.style.cssText = 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);';
        item.innerHTML = `
            <div class="font-medium text-sm" style="color: var(--color-text-primary);">${symbol}</div>
            <div class="text-xs truncate" style="color: var(--color-text-tertiary);">${address.substring(0, 10)}...</div>
        `;
        item.onclick = () => {
            selectEl.value = address;
        };
        item.onmouseenter = () => item.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        item.onmouseleave = () => item.style.borderColor = 'rgba(255,255,255,0.06)';
        listEl.appendChild(item);

        if (!Array.from(selectEl.options).find(o => o.value === address)) {
            const opt = document.createElement('option');
            opt.value = address;
            opt.textContent = symbol;
            selectEl.appendChild(opt);
        }
    }

    async mintTokens() {
        const tokenAddr = (document.getElementById('mint-token-select') as HTMLSelectElement).value;
        const amountVal = (document.getElementById('mint-amount') as HTMLInputElement).value;
        let recipient = (document.getElementById('mint-recipient') as HTMLInputElement).value;
        const btn = document.getElementById('mint-btn') as HTMLButtonElement;

        if (!tokenAddr || !amountVal || parseFloat(amountVal) <= 0) {
            this.log('Please fill all required fields', 'error');
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = `<span>Minting...</span>`;

            const signer = await BlockchainService.getInstance().getSigner();
            if (!recipient) recipient = await signer.getAddress();

            this.log(`Minting ${amountVal} tokens to ${recipient.substring(0, 10)}...`);

            const EXTENDED_ABI = [
                ...ERC20_ABI,
                "function mint(address to, uint256 amount)",
                "function hasRole(bytes32 role, address account) view returns (bool)",
                "function grantRole(bytes32 role, address account)"
            ];

            const tokenContract = new Contract(tokenAddr, EXTENDED_ABI, signer);
            const decimals = await tokenContract.decimals();
            const symbol = await tokenContract.symbol();

            const amountWei = parseUnits(amountVal, decimals);
            const ISSUER_ROLE = keccak256(toUtf8Bytes("ISSUER_ROLE"));

            this.log(`Verifying ISSUER_ROLE on ${symbol}...`);
            try {
                const hasRole = await tokenContract.hasRole(ISSUER_ROLE, await signer.getAddress());
                if (!hasRole) {
                    this.log('Requesting minter permission...');
                    const tx = await tokenContract.grantRole(ISSUER_ROLE, await signer.getAddress(), { gasLimit: 500000 });
                    await tx.wait();
                    this.log('Permission granted', 'success');
                }
            } catch (e) {
                this.log('Role check skipped, proceeding...');
            }

            this.log('Sending mint transaction...');
            const tx = await tokenContract.mint(recipient, amountWei, { gasLimit: 500000 });
            this.log(`TX: <a href="${CONFIG.EXPLORER_URL}/tx/${tx.hash}" target="_blank" style="color: var(--color-text-link);">${tx.hash.substring(0, 10)}...</a>`, 'success');
            HistoryService.getInstance().add({ type: 'mint', hash: tx.hash, status: 'pending', details: { to: recipient, amount: amountVal, symbol, tokenAddress: tokenAddr } });

            await tx.wait();
            HistoryService.getInstance().updateStatus(tx.hash, 'success');
            PollingService.getInstance().forceRefresh();
            this.log('Mint successful!', 'success');

            (document.getElementById('mint-amount') as HTMLInputElement).value = '';

        } catch (e: any) {
            this.log(`Mint failed: ${e.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `${getIcon('plus', 18)}<span>Mint Tokens</span>`;
        }
    }
}
