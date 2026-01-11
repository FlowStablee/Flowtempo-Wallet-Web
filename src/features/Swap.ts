import { ethers, parseUnits, formatUnits, Contract } from 'ethers';
import type { Feature } from './types';
import { BlockchainService } from '../services/BlockchainService';
import { CONFIG } from '../config';
import { ERC20_ABI, STABLECOIN_DEX_ABI } from '../contracts';
import { getIcon, getTokenLogo } from '../utils/icons';

export class SwapFeature implements Feature {
    id = 'swap';
    name = 'Swap';
    icon = '';
    order = 5;

    slippageTolerance = 1;

    render(container: HTMLElement) {
        // Load User Tokens
        let userTokens: { symbol: string, address: string }[] = [];
        try {
            const stored = localStorage.getItem('tempo_user_tokens');
            if (stored) userTokens = JSON.parse(stored);
        } catch { }

        // Combine for Dropdowns
        const allTokens = [
            ...Object.keys(CONFIG.TOKENS).map(k => ({ symbol: k, address: CONFIG.TOKENS[k as keyof typeof CONFIG.TOKENS] })),
            ...userTokens
        ];

        const tokenOptions = allTokens.map(t => `<option value="${t.address}">${t.symbol}</option>`).join('');

        container.innerHTML = `
            <div class="max-w-xl mx-auto">
                <div class="card">
                    <!-- Header -->
                    <div class="form-header">
                        <div class="section-icon">
                            ${getIcon('swap', 20)}
                        </div>
                        <div class="form-title"><span>>></span> asset_exchange</div>
                    </div>
                    
                    <form id="swap-form" class="form-container">
                        <!-- Token In -->
                        <div class="form-group">
                            <div class="flex justify-between items-center mb-1">
                                <label class="form-label" style="margin-bottom: 0;">From</label>
                                <span id="swap-balance-in" class="text-xs text-gray-400 font-mono">Balance: 0.0000</span>
                            </div>
                            <div class="flex gap-3">
                                <div class="relative flex items-center" style="width: 45%;">
                                    <div class="absolute left-3 pointer-events-none" id="token-in-icon-container">
                                        <!-- Icon injected by JS -->
                                    </div>
                                    <select id="token-in" class="select" style="padding-left: 42px; width: 100%;">
                                        ${tokenOptions}
                                    </select>
                                </div>
                                <input type="number" id="amount-in" class="input" style="flex: 1;" placeholder="0.00" min="0" onkeydown="return event.keyCode !== 69 && event.keyCode !== 189 && event.key !== '-'">
                            </div>
                        </div>

                        <!-- Swap Direction Icon -->
                        <div class="flex justify-center py-2">
                            <div class="section-icon" style="width: 28px; height: 28px; border-radius: 50%;">
                                ${getIcon('arrowDown', 16)}
                            </div>
                        </div>

                        <!-- Token Out -->
                        <div class="form-group">
                            <label class="form-label">To</label>
                            <div class="flex gap-3">
                                <div class="relative flex items-center" style="width: 45%;">
                                    <div class="absolute left-3 pointer-events-none" id="token-out-icon-container">
                                        <!-- Icon injected by JS -->
                                    </div>
                                    <select id="token-out" class="select" style="padding-left: 42px; width: 100%;">
                                        ${tokenOptions.replace('selected', '') /* Reset selection logic handled in init or we just default */}
                                    </select>
                                </div>
                                <input type="text" id="amount-out" class="input" style="flex: 1; opacity: 0.6;" placeholder="Calculating..." disabled>
                            </div>
                        </div>

                        <!-- Settings -->
                        <div class="pt-4" style="border-top: 1px solid rgba(255,255,255,0.06);">
                            <div class="flex items-center justify-between mb-3">
                                <span class="form-label" style="margin: 0;">Slippage</span>
                                <div class="flex gap-2">
                                    <button type="button" class="slippage-btn btn-ghost btn-sm" data-val="0.5">0.5%</button>
                                    <button type="button" class="slippage-btn btn-ghost btn-sm active" data-val="1" style="background: rgba(255, 255, 255, 0.1); color: var(--color-text-primary);">1.0%</button>
                                    <button type="button" class="slippage-btn btn-ghost btn-sm" data-val="2">2.0%</button>
                                </div>
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" id="auto-liquidity" checked style="accent-color: var(--color-accent-secondary);">
                                <span class="text-xs" style="color: var(--color-text-secondary);">Auto-provision liquidity</span>
                            </label>
                        </div>

                        <button type="submit" id="swap-btn" class="btn btn-primary w-full">
                            ${getIcon('swap', 18)}
                            <span>Execute Swap</span>
                        </button>
                    </form>

                    <!-- Log -->
                    <div id="swap-log" class="mt-6 pt-4 hidden" style="border-top: 1px solid rgba(255,255,255,0.06);">
                        <div class="form-label mb-3">Exchange Log</div>
                        <div id="swap-log-content" class="space-y-2 max-h-40 overflow-y-auto" style="font-family: var(--font-mono); font-size: 12px;"></div>
                    </div>
                </div>
            </div>
        `;

        // Set Default To Token (AlphaUSD Address)
        const alphaAddr = CONFIG.TOKENS.AlphaUSD;
        const outSelect = document.getElementById('token-out') as HTMLSelectElement;
        if (outSelect) outSelect.value = alphaAddr;

        this.updateLogos(); // Initial Render
        this.updateBalance(); // Initial Balance
        this.attachListeners();
    }

    async updateBalance() {
        const inSelect = document.getElementById('token-in') as HTMLSelectElement;
        const balanceEl = document.getElementById('swap-balance-in');
        if (!inSelect || !balanceEl) return;

        balanceEl.textContent = 'Balance: ...';

        try {
            const address = inSelect.value;
            if (!address) return;

            const signer = BlockchainService.getInstance().getSigner();
            const userAddr = await signer.getAddress();
            const contract = new ethers.Contract(address, ERC20_ABI, signer);
            const bal = await contract.balanceOf(userAddr);
            const decimals = await contract.decimals();

            balanceEl.textContent = `Balance: ${parseFloat(formatUnits(bal, decimals)).toFixed(4)}`;
        } catch (e) {
            console.error(e);
            balanceEl.textContent = 'Balance: Error';
        }
    }

    updateLogos() {
        const inSelect = document.getElementById('token-in') as HTMLSelectElement;
        const outSelect = document.getElementById('token-out') as HTMLSelectElement;
        const inContainer = document.getElementById('token-in-icon-container');
        const outContainer = document.getElementById('token-out-icon-container');

        if (inContainer && inSelect && inSelect.selectedIndex >= 0) {
            const sym = inSelect.options[inSelect.selectedIndex].text;
            inContainer.innerHTML = getTokenLogo(sym, 24, inSelect.value);
        }
        if (outContainer && outSelect && outSelect.selectedIndex >= 0) {
            const sym = outSelect.options[outSelect.selectedIndex].text;
            outContainer.innerHTML = getTokenLogo(sym, 24, outSelect.value);
        }
    }

    attachListeners() {
        const inSelect = document.getElementById('token-in') as HTMLSelectElement;
        const outSelect = document.getElementById('token-out') as HTMLSelectElement;
        const amountIn = document.getElementById('amount-in') as HTMLInputElement;

        const updateQuote = () => this.getQuote();
        const handleLogoUpdate = () => {
            this.updateLogos();
            this.updateBalance();
            updateQuote();
        };

        inSelect.addEventListener('change', handleLogoUpdate);
        outSelect.addEventListener('change', handleLogoUpdate);
        outSelect.addEventListener('change', updateQuote);
        amountIn.addEventListener('input', () => {
            if (this.quoteTimeout) clearTimeout(this.quoteTimeout);
            this.quoteTimeout = setTimeout(updateQuote, 500);
        });

        document.querySelectorAll('.slippage-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                document.querySelectorAll('.slippage-btn').forEach(b => {
                    (b as HTMLElement).style.background = 'transparent';
                    (b as HTMLElement).style.color = 'var(--color-text-secondary)';
                });
                target.style.background = 'rgba(139, 92, 246, 0.15)';
                target.style.color = 'var(--color-accent-secondary)';
                this.slippageTolerance = parseFloat(target.dataset.val!);
            });
        });

        document.getElementById('swap-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.executeSwap();
        });
    }

    private quoteTimeout: any;

    log(message: string, type: 'info' | 'success' | 'error' = 'info') {
        const container = document.getElementById('swap-log');
        const content = document.getElementById('swap-log-content');
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

    async getQuote() {
        const amountEl = document.getElementById('amount-in') as HTMLInputElement;
        const outEl = document.getElementById('amount-out') as HTMLInputElement;
        const inSym = (document.getElementById('token-in') as HTMLSelectElement).value;
        const outSym = (document.getElementById('token-out') as HTMLSelectElement).value;

        if (!amountEl.value || parseFloat(amountEl.value) <= 0 || inSym === outSym) {
            outEl.value = '...';
            return;
        }

        try {
            outEl.placeholder = 'Fetching...';

            // @ts-ignore
            const tokenInAddr = CONFIG.TOKENS[inSym];
            // @ts-ignore
            const tokenOutAddr = CONFIG.TOKENS[outSym];

            const provider = BlockchainService.getInstance().provider;
            const dex = new Contract(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, STABLECOIN_DEX_ABI, provider);

            const tokenInContract = new Contract(tokenInAddr, ERC20_ABI, provider);
            const tokenOutContract = new Contract(tokenOutAddr, ERC20_ABI, provider);

            const decimalsIn = await tokenInContract.decimals();
            const decimalsOut = await tokenOutContract.decimals();

            const amountIn = parseUnits(amountEl.value, decimalsIn);

            const expectedOut = await dex.quoteSwapExactAmountIn(tokenInAddr, tokenOutAddr, amountIn);

            if (expectedOut > 0) {
                const formatted = formatUnits(expectedOut, decimalsOut);
                outEl.value = parseFloat(formatted).toFixed(6);
            } else {
                outEl.value = "No liquidity";
            }

        } catch (e) {
            outEl.value = "Error";
        }
    }

    async executeSwap() {
        const amountVal = (document.getElementById('amount-in') as HTMLInputElement).value;
        const inSym = (document.getElementById('token-in') as HTMLSelectElement).value;
        const outSym = (document.getElementById('token-out') as HTMLSelectElement).value;
        const autoLiquidity = (document.getElementById('auto-liquidity') as HTMLInputElement).checked;
        const btn = document.getElementById('swap-btn') as HTMLButtonElement;

        if (!amountVal || parseFloat(amountVal) <= 0 || inSym === outSym) return;

        try {
            btn.disabled = true;
            btn.innerHTML = `<span>Executing...</span>`;

            const signer = await BlockchainService.getInstance().getSigner();
            // @ts-ignore
            const tokenIn = CONFIG.TOKENS[inSym];
            // @ts-ignore
            const tokenOut = CONFIG.TOKENS[outSym];

            this.log(`Swapping ${amountVal} ${inSym} → ${outSym}`);

            const dex = new Contract(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, STABLECOIN_DEX_ABI, signer);
            const tokenInContract = new Contract(tokenIn, ERC20_ABI, signer);

            const decimalsIn = await tokenInContract.decimals();
            const amountIn = parseUnits(amountVal, decimalsIn);

            this.log('Checking balance...');
            const bal = await tokenInContract.balanceOf(await signer.getAddress());
            if (bal < amountIn) throw new Error("Insufficient balance");

            this.log('Approving DEX...');
            const allowance = await tokenInContract.allowance(await signer.getAddress(), CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX);
            if (allowance < amountIn) {
                const tx = await tokenInContract.approve(CONFIG.SYSTEM_CONTRACTS.STABLECOIN_DEX, ethers.MaxUint256);
                await tx.wait();
                this.log('Approval granted');
            }

            let minOut = BigInt(0);
            try {
                const quote = await dex.quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn);
                if (quote > 0) {
                    minOut = (quote * BigInt(Math.floor((100 - this.slippageTolerance) * 100))) / BigInt(10000);
                }
            } catch (e) { }

            if (minOut === BigInt(0)) {
                if (autoLiquidity) {
                    this.log('No liquidity found', 'error');
                    throw new Error("No liquidity pool");
                } else {
                    throw new Error("No liquidity pool");
                }
            }

            this.log('Sending swap transaction...');
            const tx = await dex.swapExactAmountIn(tokenIn, tokenOut, amountIn, minOut);
            this.log(`TX: <a href="${CONFIG.EXPLORER_URL}/tx/${tx.hash}" target="_blank" style="color: var(--color-text-link);">${tx.hash.substring(0, 10)}...</a>`, 'info');
            await tx.wait();

            this.log('Swap complete!', 'success');
            (document.getElementById('amount-in') as HTMLInputElement).value = '';
            (document.getElementById('amount-out') as HTMLInputElement).value = '';

        } catch (e: any) {
            this.log(`Error: ${e.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `${getIcon('swap', 18)}<span>Execute Swap</span>`;
        }
    }
}
