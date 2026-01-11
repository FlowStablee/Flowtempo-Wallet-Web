import { ethers, keccak256, toUtf8Bytes } from 'ethers';
import type { Feature } from './types';
import { BlockchainService } from '../services/BlockchainService';
import { CONFIG } from '../config';
import { TIP20_FACTORY_ABI } from '../contracts';
import { getIcon } from '../utils/icons';

export class CreateTokenFeature implements Feature {
    id = 'create';
    name = 'DEPLOY_TOKEN';
    icon = '🪙';
    order = 2;

    render(container: HTMLElement) {
        container.innerHTML = `
            <div class="max-w-xl mx-auto">
                <div class="card">
                    <!-- Header -->
                    <div class="form-header">
                        <div class="section-icon">
                            ${getIcon('deploy', 20)}
                        </div>
                        <div class="form-title"><span>>></span> deploy_token</div>
                    </div>
                    
                    <form id="create-token-form" class="form-container">
                        <!-- Options -->
                        <div class="p-4 rounded-lg mb-4" style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.15);">
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" id="useRandom" class="checkbox" checked style="accent-color: var(--color-accent-primary);">
                                <div>
                                    <span class="text-sm font-medium" style="color: var(--color-text-primary);">Auto-generate Metadata</span>
                                    <p class="text-xs" style="color: var(--color-text-tertiary);">Randomly generate name and symbol</p>
                                </div>
                            </label>
                        </div>

                        <!-- Inputs -->
                        <div class="space-y-4">
                            <div class="form-group">
                                <label class="form-label">Token Name</label>
                                <input type="text" id="tokenName" class="input" placeholder="e.g. MyStablecoin" disabled>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Token Symbol</label>
                                <input type="text" id="tokenSymbol" class="input" placeholder="e.g. MST" disabled>
                            </div>
                        </div>

                        <button type="submit" id="deploy-btn" class="btn btn-primary w-full mt-6">
                            ${getIcon('deploy', 18)}
                            <span>Deploy Token</span>
                        </button>
                    </form>

                    <!-- Log -->
                    <div id="deploy-log" class="mt-6 pt-4 hidden" style="border-top: 1px solid rgba(255,255,255,0.06);">
                        <div class="form-label mb-3">Deployment Log</div>
                        <div id="log-content" class="space-y-2 max-h-40 overflow-y-auto" style="font-family: var(--font-mono); font-size: 12px;"></div>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
    }

    attachListeners() {
        const useRandomCb = document.getElementById('useRandom') as HTMLInputElement;
        const nameInput = document.getElementById('tokenName') as HTMLInputElement;
        const symbolInput = document.getElementById('tokenSymbol') as HTMLInputElement;

        useRandomCb.addEventListener('change', () => {
            const disabled = useRandomCb.checked;
            nameInput.disabled = disabled;
            symbolInput.disabled = disabled;
            if (disabled) {
                nameInput.value = '';
                symbolInput.value = '';
                nameInput.parentElement?.classList.add('opacity-50');
                symbolInput.parentElement?.classList.add('opacity-50');
            } else {
                nameInput.parentElement?.classList.remove('opacity-50');
                symbolInput.parentElement?.classList.remove('opacity-50');
            }
        });

        document.getElementById('create-token-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.deployToken();
        });
    }

    log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
        const container = document.getElementById('deploy-log');
        const content = document.getElementById('log-content');
        if (container && content) {
            container.classList.remove('hidden');
            const el = document.createElement('div');
            el.className = type === 'error' ? 'text-red-400' :
                type === 'success' ? 'text-green-400 font-medium' :
                    type === 'warning' ? 'text-yellow-400' : 'text-gray-400';
            el.innerHTML = message;
            content.appendChild(el);
            content.scrollTop = content.scrollHeight;
        }
    }

    generateRandomName() {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Nova', 'Stellar', 'Quantum', 'Prime'];
        const suffixes = ['Dollar', 'USD', 'Coin', 'Cash', 'Pay', 'Credit'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }

    generateRandomSymbol() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let s = '';
        for (let i = 0; i < 3; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
        return s + Math.floor(Math.random() * 99).toString();
    }

    async deployToken() {
        const useRandom = (document.getElementById('useRandom') as HTMLInputElement).checked;
        let name = (document.getElementById('tokenName') as HTMLInputElement).value;
        let symbol = (document.getElementById('tokenSymbol') as HTMLInputElement).value;

        if (useRandom) {
            name = this.generateRandomName();
            symbol = this.generateRandomSymbol();
            this.log(`Generated metadata: ${name} (${symbol})`);
        } else {
            if (!name || !symbol) return this.log('Error: Missing name or symbol', 'error');
        }

        try {
            const btn = document.getElementById('deploy-btn') as HTMLButtonElement;
            btn.disabled = true;
            btn.innerHTML = `<span>Deploying...</span>`;

            const signer = await BlockchainService.getInstance().getSigner();
            const salt = ethers.randomBytes(32);

            this.log('Connecting to factory...');
            const factory = new ethers.Contract(CONFIG.SYSTEM_CONTRACTS.TIP20_FACTORY, TIP20_FACTORY_ABI, signer);

            this.log('Submitting transaction...');

            let tx;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    // Manual gas limit avoids estimateGas calls which often fail on flaky RPCs
                    tx = await factory.createToken(
                        name,
                        symbol,
                        "USD",
                        CONFIG.TOKENS.PathUSD,
                        await signer.getAddress(),
                        salt,
                        { gasLimit: 3000000 }
                    );
                    break; // Success
                } catch (e: any) {
                    this.log(`ATTEMPT ${attempts} FAILED: ${e.message.split('(')[0]}`, 'warning');
                    if (attempts === maxAttempts) throw e;
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
                }
            }

            this.log(`Tx Hash: ${tx.hash}`);
            this.log('Waiting for confirmation...');

            const receipt = await tx.wait();

            if (receipt.status === 1) {
                // Find event
                let tokenAddress = null;
                for (const log of receipt.logs) {
                    try {
                        const parsed = factory.interface.parseLog(log);
                        if (parsed && parsed.name === 'TokenCreated') {
                            tokenAddress = parsed.args.token;
                            break;
                        }
                    } catch (e) { continue; }
                }

                if (tokenAddress) {
                    const explorerLink = `${CONFIG.EXPLORER_URL}/address/${tokenAddress}`;
                    this.log(`Success: <a href="${explorerLink}" target="_blank" class="underline text-green-400 hover:text-green-300 transition-colors">${tokenAddress}</a>`, 'success');

                    // SAVE_TO_LOCAL_STORAGE (Shared with MintTokens)
                    try {
                        const stored = localStorage.getItem('tempo_user_tokens');
                        const tokens = stored ? JSON.parse(stored) : [];
                        if (!tokens.find((t: any) => t.address === tokenAddress)) {
                            tokens.push({ address: tokenAddress, symbol: symbol });
                            localStorage.setItem('tempo_user_tokens', JSON.stringify(tokens));
                            this.log('Token added to wallet', 'success');
                        }
                    } catch (e) {
                        console.warn('Failed to cache token locally', e);
                    }

                    this.log('Granting issuer privileges...');
                    await this.grantIssuerRole(tokenAddress, signer);
                } else {
                    this.log('WARNING: TOKEN_ADDRESS_NOT_FOUND', 'error');
                }
            } else {
                this.log('TX_FAILED', 'error');
            }

        } catch (error: any) {
            this.log(`Error: ${error.message || error}`, 'error');
            this.log('Suggestion: Check internet or try again later.', 'info');
        } finally {
            const btn = document.getElementById('deploy-btn') as HTMLButtonElement;
            btn.disabled = false;
            btn.innerHTML = `${getIcon('deploy', 18)} <span>Deploy Token</span>`;
        }
    }

    async grantIssuerRole(tokenAddr: string, signer: any) {
        // ISSUER_ROLE = keccak256("ISSUER_ROLE")
        const ROLE = keccak256(toUtf8Bytes("ISSUER_ROLE"));
        const abi = ["function grantRole(bytes32 role, address account)"];
        const contract = new ethers.Contract(tokenAddr, abi, signer);
        try {
            const tx = await contract.grantRole(ROLE, await signer.getAddress());
            await tx.wait();
            this.log('ISSUER_ROLE_GRANTED', 'success');
        } catch (e) {
            this.log('ROLE_GRANT_FAILED', 'error');
        }
    }
}
