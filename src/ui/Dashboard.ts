import { getIcon } from '../utils/icons';
import { FeatureManager } from '../services/FeatureManager';
import { AccountManager } from '../services/AccountManager';
import { BlockchainService } from '../services/BlockchainService';
import { DashboardFeature } from '../features/Dashboard';
import { CreateTokenFeature } from '../features/CreateToken';
import { FaucetFeature } from '../features/Faucet';
import { SendFeature } from '../features/Send';
import { SwapFeature } from '../features/Swap';
import { MintTokensFeature } from '../features/MintTokens';

// Map Feature IDs to Icon definitions
const featureIcons: Record<string, string> = {
    dashboard: 'dashboard',
    send: 'send',
    mint: 'mint',
    swap: 'swap',
    create: 'deploy',
    faucet: 'faucet'
};

export function renderDashboard(container: HTMLElement) {
    const blockchainService = BlockchainService.getInstance();
    const featureManager = FeatureManager.getInstance();

    // Sidebar Template
    const Sidebar = () => `
        <aside class="dashboard-sidebar">
            <div class="sidebar-header" style="justify-content: center; padding: 20px 0; display: flex; gap: 12px; align-items: center;">
                <img src="/tempoflow-icon.jpg" alt="Icon" style="width: 38px; height: 38px; border-radius: 10px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
                <div class="flex flex-col justify-center">
                    <h1 class="text-lg font-bold tracking-wide leading-none" style="background: linear-gradient(135deg, #60A5FA 0%, #22D3EE 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 10px rgba(96, 165, 250, 0.3));">TEMPOFLOW</h1>
                    <p class="text-[9px] text-gray-400 tracking-[0.35em] uppercase leading-none mt-1" style="margin-left: 2px;">Wallet</p>
                </div>
            </div>
            <nav id="sidebar-nav" class="sidebar-nav">
                <!-- Populated via JS -->
            </nav>
            <div class="sidebar-footer">
                <button id="export-btn" class="nav-item">
                    ${getIcon('key', 20)}
                    <span>Backup Key</span>
                </button>
                <button id="lock-btn" class="nav-item">
                    ${getIcon('lock', 20)}
                    <span>Lock Wallet</span>
                </button>
                <button id="nuke-btn" class="nav-item nav-item-danger">
                    ${getIcon('trash', 20)}
                    <span>Reset Wallet</span>
                </button>
            </div>
        </aside>
    `;

    // Render App Shell
    container.innerHTML = `
        <div class="dashboard-container">
            ${Sidebar()}
            <div class="dashboard-main">
                 <div class="dashboard-header flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            ${getIcon('wallet', 18)}
                        </div>
                        <h2 class="text-lg font-semibold" id="current-feature-title">Dashboard</h2>
                    </div>
                </div>
                <div class="dashboard-content" id="dashboard-content"></div>
            </div>
        </div>

        <!-- Modals -->
        <div id="export-modal" class="modal-overlay hidden">
             <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Backup Private Key</h3>
                    <button class="modal-close close-export">${getIcon('x', 18)}</button>
                </div>
                <div class="modal-body text-center">
                    <div id="export-step-1">
                        <div class="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 mb-4">
                            ${getIcon('lock', 24)}
                        </div>
                        <h4 class="text-lg font-bold mb-2">Security Warning</h4>
                        <p class="text-xs text-gray-400 mb-6">Never share your private key. Anyone with this key can steal your assets. <br>Are you sure you want to reveal it?</p>
                        <button id="reveal-key-btn" class="btn btn-primary w-full">I Understand, Reveal Key</button>
                    </div>
                    
                    <div id="export-step-2" class="hidden">
                        <p class="text-xs text-gray-400 mb-2">Your Private Key</p>
                        <div class="p-3 bg-black/50 rounded border border-white/10 break-all font-mono text-xs mb-4 select-all text-left" id="private-key-display"></div>
                        <div class="flex gap-2">
                             <button id="copy-key-btn" class="btn btn-secondary flex-1">
                                ${getIcon('copy', 16)} 
                                <span>Copy</span>
                            </button>
                             <button id="download-key-btn" class="btn btn-secondary flex-1">
                                ${getIcon('download', 16)} 
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="reset-modal" class="modal-overlay hidden">
            <div class="modal-content" style="max-width: 360px;">
                <div class="modal-header">
                    <h3 class="text-red-500">Reset Wallet</h3>
                    <button class="modal-close close-reset">${getIcon('x', 18)}</button>
                </div>
                <div class="modal-body text-center">
                    <div class="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
                        ${getIcon('trash', 24)}
                    </div>
                    <h4 class="font-bold mb-2">Are you sure?</h4>
                    <p class="text-xs text-gray-400 mb-6">This will <b>permanently delete</b> your wallet from this device. You will lose all funds if you haven't backed up your key.</p>
                    <button id="confirm-reset-btn" class="btn w-full font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                        Yes, Delete Wallet
                    </button>
                    <button class="btn btn-ghost w-full mt-2 close-reset">Cancel</button>
                </div>
            </div>
        </div>

        <style>
            :root {
                --sidebar-width: 260px;
                --header-height: 70px;
            }

            .dashboard-container {
                display: flex;
                min-height: 100vh;
                background: #000;
                position: relative;
                overflow-x: hidden;
            }

            .dashboard-sidebar {
                width: var(--sidebar-width);
                height: 100vh;
                position: fixed;
                top: 0;
                left: 0;
                background: rgba(10, 10, 10, 0.95);
                border-right: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                flex-direction: column;
                z-index: 40;
                backdrop-filter: blur(20px);
            }

            .sidebar-header {
                height: var(--header-height);
                display: flex;
                align-items: center;
                padding: 0 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .sidebar-nav {
                flex: 1;
                overflow-y: auto;
                padding: 24px 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .nav-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: 12px;
                color: #9CA3AF;
                transition: all 0.2s;
                background: transparent;
                border: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 500;
            }

            .nav-item:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #F3F4F6;
            }

            .nav-item.active {
                background: rgba(99, 102, 241, 0.1);
                color: #818CF8;
            }

            .nav-item svg {
                width: 20px;
                height: 20px;
            }

            .sidebar-footer {
                padding: 24px 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .nav-item-danger {
                color: #EF4444;
            }
            
            .nav-item-danger:hover {
                background: rgba(239, 68, 68, 0.1);
                color: #F87171;
            }

            .dashboard-main {
                margin-left: var(--sidebar-width);
                flex: 1;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                background: radial-gradient(circle at top right, rgba(20, 20, 30, 1) 0%, rgba(0, 0, 0, 1) 100%);
                width: calc(100% - var(--sidebar-width));
            }

            .dashboard-header {
                height: var(--header-height);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 32px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                position: sticky;
                top: 0;
                z-index: 30;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(12px);
            }

            .dashboard-content {
                padding: 32px;
                max-width: 1200px;
                margin: 0 auto;
                width: 100%;
                flex: 1;
            }

            .network-badge {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.2);
                border-radius: 20px;
                font-size: 0.85rem;
                color: #10B981;
            }

            .network-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #10B981;
                box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .dashboard-sidebar {
                    display: none;
                }

                .dashboard-main {
                    margin-left: 0;
                    width: 100%;
                }

                .dashboard-header {
                    padding: 0 20px;
                }

                .dashboard-content {
                    padding: 20px;
                    padding-bottom: 100px; /* Space for mobile nav */
                }
            }

            /* Modal Styles */
            .modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 1;
                transition: opacity 0.2s;
            }
            
            .modal-overlay.hidden {
                opacity: 0;
                pointer-events: none;
                display: none; 
            }

            .modal-content {
                background: #111;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 24px;
                width: 90%;
                max-width: 400px;
                position: relative;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }

            .modal-header h3 {
                font-size: 1.1rem;
                font-weight: 600;
                color: #F3F4F6;
            }

            .modal-close {
                color: #6B7280;
                padding: 4px;
                border-radius: 8px;
                transition: all 0.2s;
                background: transparent;
            }

            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .btn {
                padding: 12px 20px;
                border-radius: 12px;
                font-weight: 600;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                cursor: pointer;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                color: white;
                border: none;
            }
            
            .btn-primary:active { transform: scale(0.98); }

            .btn-secondary {
                background: rgba(255, 255, 255, 0.05);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }
            
            .btn-ghost {
                background: transparent;
                color: #9CA3AF;
                border: none;
            }
            
            .btn-ghost:hover { color: white; }

        </style>
    `;

    // Initialize Feature Manager Target
    const contentArea = document.getElementById('dashboard-content');
    if (contentArea) {
        featureManager.setContainer(contentArea);
    }

    // Register Features
    featureManager.register(new DashboardFeature());
    featureManager.register(new CreateTokenFeature());
    featureManager.register(new FaucetFeature());
    featureManager.register(new SendFeature());
    featureManager.register(new SwapFeature());
    featureManager.register(new MintTokensFeature());

    // Render Sidebar Nav Items
    const sidebarNav = document.getElementById('sidebar-nav');
    if (sidebarNav) {
        sidebarNav.innerHTML = featureManager.getAllFeatures().map(f => `
            <button class="nav-item" data-id="${f.id}">
                ${getIcon((featureIcons[f.id] || 'circle') as any, 20)}
                <span>${f.name}</span>
            </button>
        `).join('');
    }

    // --- Helper Functions ---

    const activateUi = (id: string, name: string) => {
        featureManager.activate(id);
        document.getElementById('current-feature-title')!.textContent = name;

        // Update Sidebar
        document.querySelectorAll('.nav-item').forEach(b => {
            if ((b as HTMLElement).dataset.id === id) b.classList.add('active');
            else b.classList.remove('active');
        });

        // Update Mobile Nav
        document.querySelectorAll('.mobile-nav-item').forEach(b => {
            const btnId = (b as HTMLElement).dataset.id;
            if (btnId === id) {
                b.classList.add('text-indigo-400');
                b.classList.remove('text-gray-400');
            } else {
                b.classList.remove('text-indigo-400');
                b.classList.add('text-gray-400');
            }
        });

        // If not menu, ensure menu button is gray
        if (id !== 'menu-screen') {
            document.getElementById('mobile-nav-menu')?.classList.remove('text-indigo-400');
            document.getElementById('mobile-nav-menu')?.classList.add('text-gray-400');
        }
    };

    // --- Modal Logic ---
    const exportModal = document.getElementById('export-modal');
    const resetModal = document.getElementById('reset-modal');
    const pkDisplay = document.getElementById('private-key-display');
    const step1 = document.getElementById('export-step-1');
    const step2 = document.getElementById('export-step-2');

    const openExportModal = () => {
        if (exportModal) {
            exportModal.classList.remove('hidden');
        }
        if (step1) step1.classList.remove('hidden');
        if (step2) step2.classList.add('hidden');
        if (pkDisplay) pkDisplay.textContent = '';
    };

    const openResetModal = () => {
        if (resetModal) resetModal.classList.remove('hidden');
    };

    const renderMenuScreen = () => {
        const content = document.getElementById('dashboard-content');
        if (!content) return;

        document.getElementById('current-feature-title')!.textContent = 'Menu';

        // Highlights
        document.querySelectorAll('.mobile-nav-item').forEach(b => {
            b.classList.remove('text-indigo-400');
            b.classList.add('text-gray-400');
        });
        document.getElementById('mobile-nav-menu')?.classList.add('text-indigo-400');
        document.getElementById('mobile-nav-menu')?.classList.remove('text-gray-400');

        content.innerHTML = `
            <div class="flex flex-col gap-6 animate-fade-in pb-20">
                <div class="grid grid-cols-2 gap-4">
                     ${featureManager.getAllFeatures().map(f => `
                        <button class="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all text-white"
                            id="menu-btn-${f.id}">
                            <div class="text-indigo-400">${getIcon((featureIcons[f.id] || 'circle') as any, 28)}</div>
                            <span class="text-sm font-medium text-gray-200">${f.name}</span>
                        </button>
                     `).join('')}
                </div>
                <div class="h-px bg-white/5 w-full my-2"></div>
                <div class="flex flex-col gap-3">
                    <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider ml-1">Security</h3>
                    <button id="menu-screen-export" class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 active:scale-95 transition-all w-full text-left text-white">
                        <div class="text-gray-400">${getIcon('key', 20)}</div>
                        <span class="text-sm font-medium text-gray-200">Backup Private Key</span>
                    </button>
                    <button id="menu-screen-lock" class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 active:scale-95 transition-all w-full text-left text-white">
                        <div class="text-gray-400">${getIcon('lock', 20)}</div>
                        <span class="text-sm font-medium text-gray-200">Lock Wallet</span>
                    </button>
                     <button id="menu-screen-reset" class="p-4 rounded-xl bg-red-500/10 border border-red-500/10 flex items-center gap-4 hover:bg-red-500/20 active:scale-95 transition-all w-full text-left text-red-400">
                        <div class="text-red-400">${getIcon('trash', 20)}</div>
                        <span class="text-sm font-medium text-red-400">Reset Wallet</span>
                    </button>
                </div>
            </div>
        `;

        // Attach Menu Listeners
        featureManager.getAllFeatures().forEach(f => {
            document.getElementById(`menu-btn-${f.id}`)?.addEventListener('click', () => activateUi(f.id, f.name));
        });
        document.getElementById('menu-screen-export')?.addEventListener('click', () => {
            activateUi('dashboard', 'Dashboard');
            openExportModal();
        });
        document.getElementById('menu-screen-lock')?.addEventListener('click', () => window.location.reload());
        document.getElementById('menu-screen-reset')?.addEventListener('click', openResetModal);
    };

    // Attach Sidebar/General Listeners
    document.querySelectorAll('.nav-item').forEach(btn => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
            const f = featureManager.getAllFeatures().find(ft => ft.id === id);
            btn.addEventListener('click', () => activateUi(id, f?.name || 'Feature'));
        }
    });

    document.getElementById('export-btn')?.addEventListener('click', openExportModal);
    document.getElementById('nuke-btn')?.addEventListener('click', openResetModal);
    document.getElementById('lock-btn')?.addEventListener('click', () => window.location.reload());

    // Modal Internal Listeners
    document.querySelectorAll('.close-export').forEach(b => b.addEventListener('click', () => exportModal?.classList.add('hidden')));
    document.querySelectorAll('.close-reset').forEach(b => b.addEventListener('click', () => resetModal?.classList.add('hidden')));

    document.getElementById('reveal-key-btn')?.addEventListener('click', () => {
        const signer = blockchainService.getSigner();
        if (pkDisplay) pkDisplay.textContent = signer?.privateKey || "Error";
        step1?.classList.add('hidden');
        step2?.classList.remove('hidden');
    });

    document.getElementById('copy-key-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(pkDisplay?.textContent || "").then(() => alert("Copied"));
    });

    document.getElementById('download-key-btn')?.addEventListener('click', () => {
        const blob = new Blob([pkDisplay?.textContent || ""], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'backup.txt';
        a.click();
    });

    document.getElementById('confirm-reset-btn')?.addEventListener('click', () => {
        AccountManager.clearWallet();
        window.location.reload();
    });


    // --- Mobile Nav ---
    if (window.innerWidth <= 768) {
        document.querySelector('.mobile-nav')?.remove();
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav flex justify-around items-center bg-black/90 backdrop-blur-xl border-t border-white/10 fixed bottom-0 left-0 right-0 z-50 px-2 py-2 pb-6 safe-area-bottom';
        mobileNav.style.zIndex = "9999";

        const coreIds = ['dashboard', 'send', 'swap'];
        coreIds.forEach(id => {
            const f = featureManager.getAllFeatures().find(x => x.id === id);
            if (!f) return;
            const btn = document.createElement('button');
            btn.className = 'mobile-nav-item flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-gray-400 transition-colors flex-1';
            btn.dataset.id = id;
            btn.innerHTML = `
                ${getIcon((featureIcons[id] || 'circle') as any, 20)}
                <span class="text-[10px] font-medium">${f.name}</span>
            `;
            btn.onclick = () => activateUi(id, f.name);
            mobileNav.appendChild(btn);
        });

        // Menu Button
        const menuBtn = document.createElement('button');
        menuBtn.id = 'mobile-nav-menu';
        menuBtn.className = 'mobile-nav-item flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-gray-400 transition-colors flex-1';
        menuBtn.innerHTML = `
            ${getIcon('menu', 20)}
            <span class="text-[10px] font-medium">Menu</span>
        `;
        menuBtn.onclick = () => renderMenuScreen();
        mobileNav.appendChild(menuBtn);

        document.body.appendChild(mobileNav);
    }

    // Initial Load
    activateUi('dashboard', 'Dashboard');
}
