import { FeatureManager } from '../services/FeatureManager';
import { DashboardFeature } from '../features/Dashboard';
import { CreateTokenFeature } from '../features/CreateToken';
import { FaucetFeature } from '../features/Faucet';
import { SendFeature } from '../features/Send';
import { SwapFeature } from '../features/Swap';
import { MintTokensFeature } from '../features/MintTokens';
import { BlockchainService } from '../services/BlockchainService';
import { AccountManager } from '../services/AccountManager';
import { Icons, getIcon } from '../utils/icons';

// Map feature IDs to icon names
const featureIcons: Record<string, keyof typeof Icons> = {
    dashboard: 'dashboard',
    'create-token': 'deploy',
    faucet: 'faucet',
    send: 'send',
    swap: 'swap',
    mint: 'mint',
};

export function renderDashboard(container: HTMLElement) {
    container.innerHTML = `
        <div class="dashboard-layout">
            
            <!-- Fixed Sidebar -->
            <aside class="dashboard-sidebar">
                <!-- Logo Section -->
                <div class="sidebar-header" style="justify-content: center; padding: 20px 0; display: flex; gap: 12px; align-items: center;">
                    <img src="/tempoflow-icon.jpg" alt="Icon" style="width: 38px; height: 38px; border-radius: 10px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
                    <div class="flex flex-col justify-center">
                        <h1 class="text-lg font-bold tracking-wide leading-none" style="background: linear-gradient(135deg, #60A5FA 0%, #22D3EE 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 10px rgba(96, 165, 250, 0.3));">TEMPOFLOW</h1>
                        <p class="text-[9px] text-gray-400 tracking-[0.35em] uppercase leading-none mt-1" style="margin-left: 2px;">Wallet</p>
                    </div>
                </div>
                
                <!-- Navigation -->
                <nav id="sidebar-nav" class="sidebar-nav">
                    <!-- Nav Items Injected Here -->
                </nav>

                <!-- Bottom Actions -->
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

            <!-- Mobile Bottom Nav -->
            <nav id="mobile-nav" class="mobile-nav">
                <!-- Injected on mobile -->
            </nav>

            <!-- Main Content Area -->
            <main class="dashboard-main">
                <!-- Header Bar -->
                <header class="dashboard-header">
                    <div class="flex items-center gap-3">
                        <h2 id="current-feature-title" class="text-lg font-semibold" style="color: var(--color-text-primary);">Dashboard</h2>
                    </div>
                    <div class="flex items-center gap-4">
                        <!-- Network Indicator -->
                        <div class="network-badge">
                            <span class="network-dot"></span>
                            <span>Tempo Network</span>
                        </div>
                        <!-- Profile Avatar -->
                        <div class="profile-avatar">
                            ${getIcon('wallet', 18)}
                        </div>
                    </div>
                </header>

                <!-- Scrollable Content -->
                <div id="feature-container" class="dashboard-content">
                     <!-- Content Injected Here -->
                </div>
            </main>

            <!-- Export Modal -->
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

            <!-- Reset Modal -->
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
                        <p class="text-xs text-text-secondary mb-6">This will <b>permanently delete</b> your wallet from this device. You will lose all funds if you haven't backed up your key.</p>
                        <button id="confirm-reset-btn" class="btn w-full font-bold" style="background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.5);">
                            Yes, Delete Wallet
                        </button>
                        <button class="btn btn-ghost w-full mt-2 close-reset">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Mobile Menu Overlay -->
            <div id="mobile-menu-overlay" class="fixed inset-0 z-50 transform translate-y-full transition-transform duration-300" style="background: rgba(5, 5, 5, 0.98); backdrop-filter: blur(20px);">
                <div class="flex flex-col h-full p-6">
                    <div class="flex items-center justify-between mb-8">
                        <div class="flex items-center gap-3">
                            <img src="/tempoflow-icon.jpg" alt="Tempo" class="w-10 h-10 rounded-xl shadow-lg">
                            <span class="text-xl font-bold tracking-wide text-white">Menu</span>
                        </div>
                        <button id="close-mobile-menu" class="p-2 rounded-full hover:bg-white/10 text-white">
                            ${getIcon('x', 24)}
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto space-y-6">
                        <!-- Navigation -->
                        <div>
                            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Features</h3>
                            <div class="grid grid-cols-2 gap-3" id="mobile-menu-features">
                                <!-- Injected via JS -->
                            </div>
                        </div>

                        <!-- Settings -->
                        <div>
                            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Settings</h3>
                            <div class="space-y-3">
                                <button id="mobile-export-btn" class="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left text-white">
                                    <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        ${getIcon('key', 20)}
                                    </div>
                                    <div>
                                        <div class="font-medium">Backup Key</div>
                                        <div class="text-xs text-gray-400">Save your recovery phrase</div>
                                    </div>
                                </button>
                                
                                <button id="mobile-lock-btn" class="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left text-white">
                                    <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                        ${getIcon('lock', 20)}
                                    </div>
                                    <div>
                                        <div class="font-medium">Lock Wallet</div>
                                        <div class="text-xs text-gray-400">Secure this session</div>
                                    </div>
                                </button>
                                
                                <button id="mobile-nuke-btn" class="w-full flex items-center gap-4 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-left text-red-400 border border-red-500/20">
                                    <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        ${getIcon('trash', 20)}
                                    </div>
                                    <div>
                                        <div class="font-medium">Reset Wallet</div>
                                        <div class="text-xs text-red-300/70">Permanently delete data</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        
        <style>
            .dashboard-layout {
                display: flex;
                min-height: 100vh;
                background: #050505;
            }
            
            /* Fixed Sidebar */
            .dashboard-sidebar {
                position: fixed;
                top: 0;
                left: 0;
                width: 260px;
                height: 100vh;
                display: flex;
                flex-direction: column;
                background: linear-gradient(180deg, rgba(15, 15, 20, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%);
                border-right: 1px solid rgba(139, 92, 246, 0.1);
                backdrop-filter: blur(20px);
                z-index: 40;
            }
            
            .sidebar-header {
                padding: 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            
            .sidebar-nav {
                flex: 1;
                padding: 16px 12px;
                display: flex;
                flex-direction: column;
                gap: 4px;
                overflow-y: auto;
            }
            
            .sidebar-footer {
                padding: 12px;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .nav-item-danger {
                color: var(--color-error) !important;
            }
            .nav-item-danger:hover {
                background: rgba(248, 81, 73, 0.1) !important;
            }
            
            /* Mobile Nav */
            .mobile-nav {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(10, 10, 15, 0.98);
                border-top: 1px solid rgba(139, 92, 246, 0.1);
                padding: 8px;
                z-index: 50;
                backdrop-filter: blur(20px);
            }
            
            /* Main Content */
            .dashboard-main {
                flex: 1;
                margin-left: 260px;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                background: #050505;
                width: calc(100% - 260px); /* Explicit width for desktop */
                overflow-x: hidden; /* Prevent horizontal scroll */
            }
            
            .dashboard-header {
                position: sticky;
                top: 0;
                height: 64px;
                padding: 0 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(10, 10, 15, 0.95);
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                backdrop-filter: blur(12px);
                z-index: 30;
            }
            
            .network-badge {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 14px;
                background: rgba(63, 185, 80, 0.1);
                border: 1px solid rgba(63, 185, 80, 0.2);
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                color: var(--color-success);
            }
            
            .network-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--color-success);
                animation: pulse 2s ease-in-out infinite;
            }
            
            .profile-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--gradient-primary);
                color: white;
            }
            
            .dashboard-content {
                flex: 1;
                padding: 32px;
                overflow-y: auto;
            }
            
            /* Mobile Menu Overlay */
            #mobile-menu-overlay {
                top: 0; left: 0; right: 0; bottom: 0;
            }
            #mobile-menu-overlay.open {
                transform: translateY(0);
            }

            /* Responsive */
            @media (max-width: 1024px) {
                .dashboard-sidebar {
                    width: 72px;
                }
                .dashboard-sidebar .sidebar-header h1,
                .dashboard-sidebar .sidebar-header p,
                .dashboard-sidebar .nav-item span {
                    display: none;
                }
                .dashboard-sidebar .nav-item {
                    justify-content: center;
                    padding: 12px;
                }
                .dashboard-main {
                    margin-left: 72px;
                }
            }
            
            @media (max-width: 768px) {
                .dashboard-sidebar {
                    display: none;
                }
                .mobile-nav {
                    display: flex;
                    justify-content: space-around;
                }
                .dashboard-main {
                    margin-left: 0;
                    width: 100%; /* Full width on mobile */
                    padding-bottom: 80px;
                }
                .dashboard-content {
                    padding: 16px;
                    width: 100%; /* Ensure content doesn't overflow */
                }
                .dashboard-header {
                    padding: 0 16px;
                }
            }
        </style>
    `;

    // Initialize Features
    const featureManager = FeatureManager.getInstance();
    const contentContainer = document.getElementById('feature-container');
    if (contentContainer) featureManager.setContainer(contentContainer);

    // Register Features
    featureManager.register(new DashboardFeature());
    featureManager.register(new CreateTokenFeature());
    featureManager.register(new FaucetFeature());
    featureManager.register(new SendFeature());
    featureManager.register(new SwapFeature());
    featureManager.register(new MintTokensFeature());

    // Render Sidebar Navigation
    const nav = document.getElementById('sidebar-nav');
    const mobileNav = document.getElementById('mobile-nav');

    if (nav) {
        featureManager.getAllFeatures().forEach(feature => {
            const iconName = featureIcons[feature.id] || 'dashboard';
            const btn = document.createElement('button');
            btn.className = 'nav-item';
            btn.dataset.id = feature.id;
            btn.innerHTML = `
                ${getIcon(iconName, 20)}
                <span>${feature.name}</span>
            `;
            btn.onclick = () => activateFeature(feature.id, feature.name);
            nav.appendChild(btn);
        });
    }

    // Render Mobile Navigation WITH MENU
    if (mobileNav) {
        const mobileFeatures = ['dashboard', 'send', 'swap', 'faucet'];

        // Render standard items
        featureManager.getAllFeatures()
            .filter(f => mobileFeatures.includes(f.id))
            .forEach(feature => {
                const iconName = featureIcons[feature.id] || 'dashboard';
                const btn = document.createElement('button');
                btn.className = 'nav-item flex-col text-center';
                btn.style.cssText = 'flex: 1; gap: 2px; padding: 8px 4px; font-size: 10px;';
                btn.dataset.id = feature.id;
                btn.innerHTML = `
                    ${getIcon(iconName, 22)}
                    <span class="truncate">${feature.name.split(' ')[0]}</span>
                `;
                btn.onclick = () => activateFeature(feature.id, feature.name);
                mobileNav.appendChild(btn);
            });

        // Add Menu Button
        const menuBtn = document.createElement('button');
        menuBtn.className = 'nav-item flex-col text-center';
        menuBtn.style.cssText = 'flex: 1; gap: 2px; padding: 8px 4px; font-size: 10px;';
        menuBtn.innerHTML = `
            ${getIcon('menu', 22)}
            <span>Menu</span>
        `;
        menuBtn.id = 'mobile-menu-trigger';
        mobileNav.appendChild(menuBtn);
    }

    // Populate Mobile Menu Features Grid
    const mobileMenuFeatures = document.getElementById('mobile-menu-features');
    if (mobileMenuFeatures) {
        featureManager.getAllFeatures().forEach(feature => {
            const iconName = featureIcons[feature.id] || 'dashboard';
            const btn = document.createElement('button');
            btn.className = 'flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors gap-2';
            btn.innerHTML = `
                <div class="text-purple-400">${getIcon(iconName, 24)}</div>
                <span class="text-xs font-medium text-gray-300">${feature.name}</span>
            `;
            btn.onclick = () => {
                activateFeature(feature.id, feature.name);
                document.getElementById('mobile-menu-overlay')?.classList.remove('open');
            };
            mobileMenuFeatures.appendChild(btn);
        });
    }

    // Mobile Menu Toggle Logic
    const mobileMenu = document.getElementById('mobile-menu-overlay');
    document.getElementById('mobile-menu-trigger')?.addEventListener('click', () => {
        mobileMenu?.classList.add('open');
    });
    document.getElementById('close-mobile-menu')?.addEventListener('click', () => {
        mobileMenu?.classList.remove('open');
    });

    // Activate Feature Helper
    function activateFeature(id: string, name: string) {
        featureManager.activate(id);
        document.getElementById('current-feature-title')!.textContent = name;

        // Update active states
        document.querySelectorAll('.nav-item[data-id]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.nav-item[data-id="${id}"]`).forEach(b => b.classList.add('active'));
    }

    // Default Activation
    activateFeature('dashboard', 'Dashboard');

    // System Controls (Desktop + Mobile)
    const exportModal = document.getElementById('export-modal');
    const step1 = document.getElementById('export-step-1');
    const step2 = document.getElementById('export-step-2');
    const pkDisplay = document.getElementById('private-key-display');
    const resetModal = document.getElementById('reset-modal'); // Define here for scoping

    // Helper to open Export Modal (Shared)
    const openExportModal = () => {
        if (exportModal && exportModal.parentElement !== document.body) document.body.appendChild(exportModal);
        exportModal?.classList.remove('hidden');
        step1?.classList.remove('hidden');
        step2?.classList.add('hidden');
        if (pkDisplay) pkDisplay.textContent = '';
        mobileMenu?.classList.remove('open'); // Close mobile menu if open
    };

    document.getElementById('export-btn')?.addEventListener('click', openExportModal);
    document.getElementById('mobile-export-btn')?.addEventListener('click', openExportModal);

    document.querySelectorAll('.close-export').forEach(btn =>
        btn.addEventListener('click', () => exportModal?.classList.add('hidden'))
    );

    document.getElementById('reveal-key-btn')?.addEventListener('click', async () => {
        try {
            // @ts-ignore
            const signer = BlockchainService.getInstance().getSigner();
            const pk = signer.privateKey || "Error retrieving key";
            if (pkDisplay) pkDisplay.textContent = pk;
            step1?.classList.add('hidden');
            step2?.classList.remove('hidden');
        } catch (e) { console.error(e); }
    });

    document.getElementById('copy-key-btn')?.addEventListener('click', () => {
        const pk = pkDisplay?.textContent || "";
        navigator.clipboard.writeText(pk);
        alert("Key copied to clipboard!");
    });

    document.getElementById('download-key-btn')?.addEventListener('click', () => {
        const pk = pkDisplay?.textContent || "";
        const blob = new Blob([pk], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tempo-backup-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Lock Wallet (Shared)
    const lockWallet = () => window.location.reload();
    document.getElementById('lock-btn')?.addEventListener('click', lockWallet);
    document.getElementById('mobile-lock-btn')?.addEventListener('click', lockWallet);

    // Reset Wallet Logic (Shared)
    const openResetModal = () => {
        if (resetModal && resetModal.parentElement !== document.body) document.body.appendChild(resetModal);
        resetModal?.classList.remove('hidden');
        mobileMenu?.classList.remove('open');
    };

    document.getElementById('nuke-btn')?.addEventListener('click', openResetModal);
    document.getElementById('mobile-nuke-btn')?.addEventListener('click', openResetModal);

    document.querySelectorAll('.close-reset').forEach(btn =>
        btn.addEventListener('click', () => resetModal?.classList.add('hidden'))
    );

    document.getElementById('confirm-reset-btn')?.addEventListener('click', () => {
        AccountManager.clearWallet();
        window.location.reload();
    });
}

