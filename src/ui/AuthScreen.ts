import { AccountManager } from '../services/AccountManager';
import { Wallet } from 'ethers';
import { getIcon } from '../utils/icons';

export function renderAuthScreen(container: HTMLElement, isUnlockMode: boolean) {
    container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4" style="background: var(--color-background-primary);">
            <!-- Background gradient -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: var(--gradient-primary);"></div>
                <div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: var(--gradient-accent);"></div>
            </div>

            <div class="card w-full max-w-md fade-in relative z-10" style="padding: 32px;">
                <!-- Logo Header -->
                <div class="flex flex-col items-center justify-center mb-8">
                    <img src="/tempoflow-icon.jpg" alt="Tempo" style="width: 60px; height: 60px; border-radius: 14px; margin-bottom: 12px; filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.4));">
                    <h1 class="text-2xl font-bold tracking-wide" style="background: linear-gradient(135deg, #60A5FA 0%, #22D3EE 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">TEMPOFLOW</h1>
                    <p class="text-[10px] text-gray-400 tracking-[0.4em] uppercase mt-1">Wallet</p>
                </div>

                <p class="text-sm text-center mb-8" style="color: var(--color-text-secondary);">
                    ${isUnlockMode ? 'Welcome back. Enter your password to unlock.' : 'Secure. Fast. Decentralized.'}
                </p>

                <div id="auth-form" class="space-y-6">
                    ${isUnlockMode ? renderUnlockForm() : renderSetupOptions()}
                </div>
            </div>
        </div>
    `;

    attachListeners(isUnlockMode);
}

function renderUnlockForm() {
    return `
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-medium mb-2" style="color: var(--color-text-secondary);">Password</label>
                <input type="password" id="password-input" class="input" placeholder="Enter your password" />
            </div>
            <button id="unlock-btn" class="btn btn-primary w-full">
                ${getIcon('lock', 18)}
                <span>Unlock Wallet</span>
            </button>
            <button id="reset-btn" class="w-full text-xs font-medium mt-4 text-center transition-colors" style="color: var(--color-error);">
                Forgot Password? Reset Wallet
            </button>
        </div>
    `;
}

function renderSetupOptions() {
    return `
        <div class="grid grid-cols-2 gap-4">
            <button id="create-mode-btn" class="card group text-left transition-all hover:scale-[1.02]" style="padding: 20px;">
                <div class="icon-container icon-bg-primary mb-4 group-hover:scale-110 transition-transform">
                    ${getIcon('plus', 24)}
                </div>
                <p class="font-semibold mb-1" style="color: var(--color-text-primary);">Create New</p>
                <p class="text-xs" style="color: var(--color-text-tertiary);">Generate a fresh wallet</p>
            </button>

            <button id="import-mode-btn" class="card group text-left transition-all hover:scale-[1.02]" style="padding: 20px;">
                <div class="icon-container icon-bg-info mb-4 group-hover:scale-110 transition-transform">
                    ${getIcon('download', 24)}
                </div>
                <p class="font-semibold mb-1" style="color: var(--color-text-primary);">Import Key</p>
                <p class="text-xs" style="color: var(--color-text-tertiary);">Use existing private key</p>
            </button>
        </div>

        <div id="setup-form-container" class="mt-6 hidden fade-in"></div>
    `;
}

function attachListeners(isUnlockMode: boolean) {
    if (isUnlockMode) {
        document.getElementById('unlock-btn')?.addEventListener('click', () => {
            const password = (document.getElementById('password-input') as HTMLInputElement).value;
            if (!password) return;
            window.dispatchEvent(new CustomEvent('wallet-unlocked', { detail: { password } }));
        });

        document.getElementById('password-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('unlock-btn')?.click();
            }
        });

        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (confirm("Warning: Resetting will delete your wallet from this device. Make sure you have a backup of your private key.")) {
                AccountManager.clearWallet();
                window.location.reload();
            }
        });
    } else {
        const container = document.getElementById('setup-form-container')!;

        // CREATE FLOW
        document.getElementById('create-mode-btn')?.addEventListener('click', () => {
            const tempWallet = Wallet.createRandom();

            container.classList.remove('hidden');
            container.innerHTML = `
                <div class="space-y-4">
                    <div class="p-4 rounded-xl" style="background: rgba(210, 153, 34, 0.1); border: 1px solid rgba(210, 153, 34, 0.2);">
                        <div class="flex items-center gap-2 mb-2">
                            ${getIcon('alertCircle', 18)}
                            <span class="font-semibold text-sm" style="color: var(--color-warning);">Save Your Recovery Key</span>
                        </div>
                        <p class="text-xs mb-3" style="color: var(--color-text-secondary);">
                            This is the only way to recover your wallet. Store it securely.
                        </p>
                        <div class="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
                            <code class="flex-1 text-xs break-all font-mono" style="color: var(--color-warning);">
                                ${tempWallet.privateKey}
                            </code>
                            <button id="copy-key-btn" class="btn-ghost btn-sm text-yellow-500 hover:text-yellow-400" title="Copy">
                                ${getIcon('copy', 18)}
                            </button>
                        </div>
                    </div>

                    <button id="download-key-btn" class="btn btn-secondary w-full">
                        ${getIcon('download', 18)}
                        <span>Download Backup</span>
                    </button>

                    <div class="pt-4" style="border-top: 1px solid var(--color-border-subtle);">
                        <label class="block text-xs font-medium mb-2" style="color: var(--color-text-secondary);">Set Password</label>
                        <input type="password" id="new-password" class="input" placeholder="Create a strong password" />
                    </div>

                    <label class="flex items-center gap-3 py-2 cursor-pointer">
                         <input type="checkbox" id="saved-check" class="w-4 h-4 rounded" style="accent-color: var(--color-accent-primary);" />
                         <span class="text-xs" style="color: var(--color-text-secondary);">I have saved my private key securely</span>
                    </label>

                    <button id="confirm-create" class="btn btn-primary w-full" disabled>
                        ${getIcon('plus', 18)}
                        <span>Create Wallet</span>
                    </button>
                </div>
             `;

            const check = document.getElementById('saved-check') as HTMLInputElement;
            const btn = document.getElementById('confirm-create') as HTMLButtonElement;
            check.addEventListener('change', () => btn.disabled = !check.checked);

            document.getElementById('copy-key-btn')?.addEventListener('click', () => {
                navigator.clipboard.writeText(tempWallet.privateKey);
                const copyBtn = document.getElementById('copy-key-btn');
                if (copyBtn) {
                    copyBtn.innerHTML = getIcon('check', 16);
                    setTimeout(() => copyBtn.innerHTML = getIcon('copy', 16), 2000);
                }
            });

            document.getElementById('download-key-btn')?.addEventListener('click', () => {
                const blob = new Blob([tempWallet.privateKey], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = 'none';
                a.href = url;
                a.download = `tempo-backup-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            btn.addEventListener('click', async () => {
                const password = (document.getElementById('new-password') as HTMLInputElement).value;
                if (!password) return alert("Password required to encrypt your wallet.");

                btn.innerHTML = `<span>Encrypting...</span>`;
                await AccountManager.importWallet(tempWallet.privateKey, password);
                window.dispatchEvent(new CustomEvent('wallet-created', { detail: { password } }));
            });
        });

        // IMPORT FLOW
        document.getElementById('import-mode-btn')?.addEventListener('click', () => {
            container.classList.remove('hidden');
            container.innerHTML = `
                <div class="space-y-4">
                    <div>
                         <label class="block text-xs font-medium mb-2" style="color: var(--color-text-secondary);">Private Key</label>
                        <input type="password" id="import-key" class="input font-mono text-xs" placeholder="0x..." />
                    </div>
                    <div>
                         <label class="block text-xs font-medium mb-2" style="color: var(--color-text-secondary);">Set Password</label>
                        <input type="password" id="import-password" class="input" placeholder="Create a password" />
                    </div>
                    <button id="confirm-import" class="btn btn-primary w-full">
                        ${getIcon('download', 18)}
                        <span>Import Wallet</span>
                    </button>
                </div>
             `;

            document.getElementById('confirm-import')?.addEventListener('click', async () => {
                const key = (document.getElementById('import-key') as HTMLInputElement).value;
                const password = (document.getElementById('import-password') as HTMLInputElement).value;
                if (!key || !password) return alert("All fields required.");

                try {
                    const btn = document.getElementById('confirm-import')!;
                    btn.innerHTML = `<span>Importing...</span>`;
                    await AccountManager.importWallet(key, password);
                    window.dispatchEvent(new CustomEvent('wallet-created', { detail: { password } }));
                } catch (e) {
                    alert("Invalid Private Key.");
                }
            });
        });
    }
}

