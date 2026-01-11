import { ethers } from 'ethers';
import type { Feature } from './types';
import { BlockchainService } from '../services/BlockchainService';
import { CONFIG } from '../config';
import { getIcon } from '../utils/icons';

export class FaucetFeature implements Feature {
    id = 'faucet';
    name = 'Faucet';
    icon = '';
    order = 3;

    render(container: HTMLElement) {
        container.innerHTML = `
            <div class="max-w-xl mx-auto">
                <div class="card">
                    <!-- Header -->
                    <div class="form-header">
                        <div class="section-icon">
                            ${getIcon('faucet', 20)}
                        </div>
                        <div class="form-title"><span>>></span> request_funds</div>
                    </div>
                    
                    <div class="form-container">
                        <!-- Info Cards -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="p-4 rounded-lg" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                                <p class="text-xs mb-1" style="color: var(--color-text-tertiary);">Network</p>
                                <p class="text-sm font-medium" style="color: var(--color-text-primary);">${CONFIG.NETWORK_NAME}</p>
                            </div>
                            <div class="p-4 rounded-lg" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                                <p class="text-xs mb-1" style="color: var(--color-text-tertiary);">Status</p>
                                <p class="text-sm font-medium" style="color: var(--color-success);">Operational</p>
                            </div>
                        </div>

                        <!-- Payload Info -->
                        <div class="p-4 rounded-lg" style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.15);">
                            <div class="flex items-center gap-2 mb-2">
                                ${getIcon('coins', 18)}
                                <span class="text-sm font-medium" style="color: var(--color-text-primary);">Available Tokens</span>
                            </div>
                            <p class="text-xs" style="color: var(--color-text-secondary);">
                                1,000,000 units each: AlphaUSD, BetaUSD, ThetaUSD, PathUSD
                            </p>
                        </div>

                        <!-- Status Message -->
                        <div id="faucet-status" class="hidden"></div>

                        <!-- Claim Button -->
                        <button id="claim-btn" class="btn btn-primary w-full">
                            ${getIcon('download', 18)}
                            <span id="btn-text">Claim Test Tokens</span>
                        </button>

                        <p class="text-xs text-center" style="color: var(--color-text-tertiary);">
                            Rate limit: 1 request per hour
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('claim-btn')?.addEventListener('click', () => this.claimFaucet());
    }

    async claimFaucet() {
        const btn = document.getElementById('claim-btn') as HTMLButtonElement;
        const btnText = document.getElementById('btn-text');
        const status = document.getElementById('faucet-status');

        if (!btn || !btnText || !status) return;

        btn.disabled = true;
        btnText.textContent = 'Processing...';

        status.classList.remove('hidden');
        status.className = 'status-message status-info';
        status.innerHTML = `${getIcon('refresh', 16)} Contacting faucet...`;

        try {
            const signer = await BlockchainService.getInstance().getSigner();
            const address = await signer.getAddress();

            const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);

            const txHashes = await provider.send('tempo_fundAddress', [address]);

            const hashes: string[] = Array.isArray(txHashes) ? txHashes : [txHashes];

            status.className = 'status-message status-success';
            status.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    ${getIcon('check', 16)}
                    <span class="font-medium">Claim Successful!</span>
                </div>
                <div class="text-xs space-y-1" style="color: var(--color-text-secondary);">
                    ${hashes.map(h => `<div>TX: <a href="${CONFIG.EXPLORER_URL}/tx/${h}" target="_blank" style="color: var(--color-text-link);">${h.substring(0, 10)}...${h.substring(h.length - 8)}</a></div>`).join('')}
                </div>
            `;

            btnText.textContent = 'Claimed!';

        } catch (error: any) {
            console.error(error);
            const msg = error.message || String(error);
            let userMsg = 'Unknown error';

            if (msg.includes('rate limit') || msg.includes('too many requests')) userMsg = 'Rate limit exceeded';
            else if (msg.includes('already claimed')) userMsg = 'Already claimed';
            else if (msg.includes('method not found')) userMsg = 'Faucet offline';
            else userMsg = `Error: ${msg.substring(0, 50)}...`;

            status.className = 'status-message status-error';
            status.innerHTML = `${getIcon('alertCircle', 16)} ${userMsg}`;

            btnText.textContent = 'Retry Claim';
            btn.disabled = false;
        }
    }
}
