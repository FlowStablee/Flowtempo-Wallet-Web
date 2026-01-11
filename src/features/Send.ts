import { ethers, toUtf8Bytes, hexlify, getAddress, formatUnits } from 'ethers';
import type { Feature } from './types';
import { BlockchainService } from '../services/BlockchainService';
import { CONFIG } from '../config';
import { ERC20_ABI } from '../contracts';
import { HistoryService } from '../services/HistoryService';
import { PollingService } from '../services/PollingService';
import { getIcon, getTokenLogo } from '../utils/icons';

export class SendFeature implements Feature {
    id = 'send';
    name = 'Send';
    icon = '';
    order = 4;

    render(container: HTMLElement) {
        container.innerHTML = `
            <div class="max-w-xl mx-auto">
                <div class="card">
                    <!-- Header -->
                    <div class="form-header">
                        <div class="section-icon">
                            ${getIcon('send', 20)}
                        </div>
                        <div class="form-title"><span>>></span> execute_transfer</div>
                    </div>
                    
                    <form id="send-form" class="form-container">
                        <!-- Token Select -->
                        <div class="form-group">
                        <div class="form-group">
                            <div class="flex justify-between items-center mb-1">
                                <label class="form-label" style="margin-bottom: 0;">Select Asset</label>
                                <span id="send-balance-display" class="text-xs text-gray-400 font-mono">Balance: -</span>
                            </div>
                            <div class="flex justify-between items-center mb-2">
                                <!-- Place import button here or adjust layout -->
                                <button id="send-import-btn" type="button" class="btn-ghost btn-sm flex items-center gap-1" style="padding: 4px 8px; font-size: 11px; margin-left: auto;">
                                    ${getIcon('plus', 14)}
                                    <span>Import Token</span>
                                </button>
                            </div>
                             
                            </div>
                             
                            <div id="send-import-form" class="hidden mt-2 p-4 rounded-lg" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);">
                                <input type="text" id="send-import-address" class="input mb-3" placeholder="Token contract address (0x...)">
                                <button id="send-confirm-import" type="button" class="btn btn-secondary w-full btn-sm">
                                    ${getIcon('download', 16)}
                                    <span>Import Token</span>
                                </button>
                            </div>

                            <div class="relative flex items-center">
                                <div class="absolute left-3 pointer-events-none" id="send-token-icon-container">
                                    <!-- Icon injected by JS -->
                                </div>
                                <select id="send-token" class="select" style="padding-left: 42px; width: 100%;">
                                    ${this.renderTokenOptions()}
                                </select>
                            </div>
                        </div>

                        <!-- Recipient -->
                        <div class="form-group">
                            <label class="form-label">Recipient Address</label>
                            <input type="text" id="send-recipient" class="input" placeholder="0x..." autocomplete="off">
                        </div>

                        <!-- Amount -->
                        <div class="form-group">
                            <label class="form-label">Amount</label>
                            <input type="number" id="send-amount" class="input" placeholder="0.00" min="0" onkeydown="return event.keyCode !== 69 && event.keyCode !== 189 && event.key !== '-'">
                        </div>

                        <!-- Memo -->
                        <div class="form-group">
                            <div class="flex justify-between items-center">
                                <label class="form-label">Memo (Optional)</label>
                                <span class="text-xs" style="color: var(--color-text-tertiary);" id="memo-count">0/32</span>
                            </div>
                            <input type="text" id="send-memo" class="input" maxlength="32" placeholder="Add a note...">
                        </div>

                        <!-- Submit -->
                        <button type="submit" id="send-btn" class="btn btn-primary w-full">
                            ${getIcon('send', 18)}
                            <span>Send Transaction</span>
                        </button>
                    </form>

                    <!-- Transaction Log -->
                    <div id="transfer-log" class="mt-6 pt-4 hidden" style="border-top: 1px solid rgba(255,255,255,0.06);">
                        <div class="form-label mb-3">Transaction Log</div>
                        <div id="transfer-log-content" class="space-y-2 max-h-40 overflow-y-auto" style="font-family: var(--font-mono); font-size: 12px;"></div>
                    </div>
                </div>
            </div>
        `;

        this.updateLogo(); // Initial Render
        this.updateBalance(); // Initial Balance
        this.attachListeners();
    }

    async updateBalance() {
        const select = document.getElementById('send-token') as HTMLSelectElement;
        const balanceEl = document.getElementById('send-balance-display');

        if (!select || !balanceEl) return;

        balanceEl.textContent = 'Balance: ...';

        try {
            const tokenAddress = select.value;
            if (!tokenAddress) return;

            const signer = BlockchainService.getInstance().getSigner();
            const userAddr = await signer.getAddress();
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
            const bal = await contract.balanceOf(userAddr);
            const decimals = await contract.decimals();

            balanceEl.textContent = `Balance: ${parseFloat(formatUnits(bal, decimals)).toFixed(4)}`;
        } catch (e) {
            console.error(e);
            balanceEl.textContent = 'Balance: Error';
        }
    }

    updateLogo() {
        const select = document.getElementById('send-token') as HTMLSelectElement;
        const container = document.getElementById('send-token-icon-container');
        if (select && container) {
            const symbol = select.options[select.selectedIndex].text;
            container.innerHTML = getTokenLogo(symbol, 24, select.value);
        }
    }

    renderTokenOptions() {
        const configTokens = Object.keys(CONFIG.TOKENS).map(t => `<option value="${CONFIG.TOKENS[t as keyof typeof CONFIG.TOKENS]}">${t}</option>`);

        let storedTokens = [];
        try {
            const stored = localStorage.getItem('tempo_user_tokens');
            if (stored) storedTokens = JSON.parse(stored);
        } catch { }

        const userTokens = storedTokens.map((t: any) => `<option value="${t.address}">${t.symbol}</option>`);

        return [...configTokens, ...userTokens].join('');
    }

    attachListeners() {
        const tokenSelect = document.getElementById('send-token') as HTMLSelectElement;

        tokenSelect?.addEventListener('change', () => {
            this.updateLogo();
            this.updateBalance();
        });

        // Toggle Import
        document.getElementById('send-import-btn')?.addEventListener('click', () => {
            document.getElementById('send-import-form')?.classList.toggle('hidden');
        });

        // Confirm Import
        document.getElementById('send-confirm-import')?.addEventListener('click', async () => {
            const input = document.getElementById('send-import-address') as HTMLInputElement;
            const address = input.value.trim();
            if (!address || address.length < 42) return this.log('INVALID_ADDRESS', 'error');

            try {
                this.log(`IMPORTING: ${address}...`);
                const provider = BlockchainService.getInstance().provider;
                const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
                const symbol = await tokenContract.symbol();

                // Save
                const stored = localStorage.getItem('tempo_user_tokens');
                const tokens = stored ? JSON.parse(stored) : [];
                if (!tokens.find((t: any) => t.address === address)) {
                    tokens.push({ address, symbol });
                    localStorage.setItem('tempo_user_tokens', JSON.stringify(tokens));
                }

                this.log(`IMPORTED: ${symbol}`, 'success');

                // Refresh Options
                const select = document.getElementById('send-token') as HTMLSelectElement;
                select.innerHTML = this.renderTokenOptions();
                select.value = address;

                input.value = '';
                document.getElementById('send-import-form')?.classList.add('hidden');

            } catch (e) {
                this.log('IMPORT_FAILED', 'error');
            }
        });

        const memoInput = document.getElementById('send-memo') as HTMLInputElement;
        memoInput.addEventListener('input', () => {
            document.getElementById('memo-count')!.textContent = `${memoInput.value.length}/32`;
        });

        document.getElementById('send-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.executeTransfer();
        });
    }

    log(message: string, type: 'info' | 'success' | 'error' = 'info') {
        const container = document.getElementById('transfer-log');
        const content = document.getElementById('transfer-log-content');
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

    async executeTransfer() {
        const tokenAddress = (document.getElementById('send-token') as HTMLSelectElement).value;
        const recipient = (document.getElementById('send-recipient') as HTMLInputElement).value;
        const amount = (document.getElementById('send-amount') as HTMLInputElement).value;
        const memo = (document.getElementById('send-memo') as HTMLInputElement).value;
        const btn = document.getElementById('send-btn') as HTMLButtonElement;

        // Find Symbol for display
        const select = document.getElementById('send-token') as HTMLSelectElement;
        const symbol = select.options[select.selectedIndex].text.split(' ')[0];

        try {
            // Validate
            getAddress(recipient); // checksum check
            if (!amount || parseFloat(amount) <= 0) throw new Error("INVALID_AMOUNT");

            btn.disabled = true;
            btn.textContent = 'SIGNING...';

            this.log(`INITIATING_TRANSFER: ${amount} ${symbol} -> ${recipient.substring(0, 8)}...`);

            const signer = await BlockchainService.getInstance().getSigner();

            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

            this.log('VERIFYING_BALANCE...');
            const decimals = await contract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);

            if (memo) {
                this.log(`ATTACHING_MEMO: "${memo}"`);
                // Encode Memo
                const utf8Bytes = toUtf8Bytes(memo);
                let memoBytes32;
                if (utf8Bytes.length > 32) {
                    throw new Error("MEMO_TOO_LONG");
                } else {
                    // Pad to 32 bytes
                    const padded = new Uint8Array(32);
                    padded.set(utf8Bytes);
                    memoBytes32 = hexlify(padded);
                }

                this.log('SENDING_WITH_MEMO...');
                // Attempt transferWithMemo if supported, else fallback
                // Since we don't have the ABI for transferWithMemo in ERC20_ABI constant yet, let's create a custom one here
                const memoAbi = [
                    ...ERC20_ABI,
                    "function transferWithMemo(address to, uint256 amount, bytes32 memo)"
                ];
                const memoContract = new ethers.Contract(tokenAddress, memoAbi, signer);

                try {
                    const tx = await memoContract.transferWithMemo(recipient, amountWei, memoBytes32);
                    this.log(`TX_HASH: <a href="${CONFIG.EXPLORER_URL}/tx/${tx.hash}" target="_blank" class="underline">${tx.hash.substring(0, 10)}...</a>`, 'info');
                    HistoryService.getInstance().add({ type: 'send', hash: tx.hash, status: 'pending', details: { to: recipient, amount, symbol, tokenAddress } });
                    await tx.wait();
                    HistoryService.getInstance().updateStatus(tx.hash, 'success');
                    PollingService.getInstance().forceRefresh();
                    this.log('TRANSFER_COMPLETE', 'success');
                } catch (e) {
                    this.log('MEMO_UNSUPPORTED_OR_FAILED, FALLING_BACK...', 'error');
                    throw e;
                }

            } else {
                this.log('SENDING_STANDARD_TRANSFER...');
                const tx = await contract.transfer(recipient, amountWei);
                this.log(`TX_HASH: <a href="${CONFIG.EXPLORER_URL}/tx/${tx.hash}" target="_blank" class="underline">${tx.hash.substring(0, 10)}...</a>`, 'info');
                HistoryService.getInstance().add({ type: 'send', hash: tx.hash, status: 'pending', details: { to: recipient, amount, symbol, tokenAddress } });
                await tx.wait();
                HistoryService.getInstance().updateStatus(tx.hash, 'success');
                PollingService.getInstance().forceRefresh();
                this.log('TRANSFER_COMPLETE', 'success');
            }

            // Clear form
            (document.getElementById('send-amount') as HTMLInputElement).value = '';
            (document.getElementById('send-memo') as HTMLInputElement).value = '';

        } catch (e: any) {
            this.log(`ERROR: ${e.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '[ INITIATE_TRANSFER ]';
        }
    }
}
