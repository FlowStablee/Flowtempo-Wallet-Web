/**
 * Genesis AI Splash Screen
 * Futuristic loading screen with 3D neural prism animation
 */
export function renderSplashScreen(container: HTMLElement, onComplete?: () => void) {
    container.innerHTML = `
        <div id="splash-screen" class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style="background: #050505;">
            
            <!-- Data Smoke Background -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="smoke-layer smoke-1"></div>
                <div class="smoke-layer smoke-2"></div>
                <div class="smoke-layer smoke-3"></div>
            </div>

            <!-- Ambient Glow -->
            <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-30" style="background: radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(6,182,212,0.3) 50%, transparent 70%);"></div>

            <!-- Main Content -->
            <div class="relative z-10 flex flex-col items-center fade-in">
                
                <!-- 3D Prism Container -->
                <div class="prism-container mb-12">
                    <div class="prism">
                        <div class="prism-face front"></div>
                        <div class="prism-face back"></div>
                        <div class="prism-face right"></div>
                        <div class="prism-face left"></div>
                        <div class="prism-face top"></div>
                        <div class="prism-face bottom"></div>
                    <div class="prism-core">
                        <img src="/tempoflow-logo.png" alt="Tempo" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.6)); animation: pulse 2s infinite;">
                    </div>
                </div>
                </div>

                <!-- Terminal Card -->
                <div class="terminal-card">
                    <div class="terminal-text">
                        <span class="terminal-prompt">>></span>
                        <span id="terminal-line-1" class="terminal-command">INITIALIZING_ASSETS...</span>
                    </div>
                    <div id="terminal-line-2" class="terminal-subtext">OPTIMIZING_ROUTE</div>
                    
                    <!-- Progress Bar -->
                    <div class="progress-track">
                        <div id="splash-progress" class="progress-fill"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            /* Data Smoke */
            .smoke-layer {
                position: absolute;
                width: 200%;
                height: 200%;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(76, 29, 149, 0.05) 60%, transparent 80%);
                animation: drift 20s ease-in-out infinite;
            }
            .smoke-1 { top: -50%; left: -50%; animation-delay: 0s; }
            .smoke-2 { top: -30%; left: -30%; animation-delay: -7s; opacity: 0.5; }
            .smoke-3 { top: -40%; left: -40%; animation-delay: -14s; opacity: 0.3; }
            
            @keyframes drift {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(2%, 3%) rotate(1deg); }
                50% { transform: translate(-1%, 2%) rotate(-1deg); }
                75% { transform: translate(1%, -2%) rotate(0.5deg); }
            }

            /* 3D Prism */
            .prism-container {
                width: 160px;
                height: 160px;
                perspective: 600px;
            }
            
            .prism {
                width: 100%;
                height: 100%;
                position: relative;
                transform-style: preserve-3d;
                animation: rotate-prism 12s ease-in-out infinite;
            }
            
            @keyframes rotate-prism {
                0% { transform: rotateX(-20deg) rotateY(0deg); }
                50% { transform: rotateX(-20deg) rotateY(180deg); }
                100% { transform: rotateX(-20deg) rotateY(360deg); }
            }
            
            .prism-face {
                position: absolute;
                width: 100px;
                height: 100px;
                left: 50%;
                top: 50%;
                margin-left: -50px;
                margin-top: -50px;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
                border: 1px solid rgba(139, 92, 246, 0.3);
                backdrop-filter: blur(4px);
                box-shadow: inset 0 0 30px rgba(139, 92, 246, 0.2), 0 0 20px rgba(6, 182, 212, 0.1);
            }
            
            .prism-face.front  { transform: translateZ(50px); }
            .prism-face.back   { transform: rotateY(180deg) translateZ(50px); }
            .prism-face.right  { transform: rotateY(90deg) translateZ(50px); }
            .prism-face.left   { transform: rotateY(-90deg) translateZ(50px); }
            .prism-face.top    { transform: rotateX(90deg) translateZ(50px); }
            .prism-face.bottom { transform: rotateX(-90deg) translateZ(50px); }
            
            .prism-core {
                position: absolute;
                width: 40px;
                height: 40px;
                left: 50%;
                top: 50%;
                margin-left: -20px;
                margin-top: -20px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, #a78bfa, #8b5cf6, #4c1d95);
                box-shadow: 0 0 40px rgba(139, 92, 246, 0.8), 0 0 80px rgba(6, 182, 212, 0.4);
                animation: core-pulse 2s ease-in-out infinite;
            }
            
            @keyframes core-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }

            /* Terminal Card */
            .terminal-card {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 24px 32px;
                min-width: 320px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
            }
            
            .terminal-text {
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 4px;
            }
            
            .terminal-prompt {
                color: #8b5cf6;
                margin-right: 8px;
            }
            
            .terminal-command {
                animation: blink-cursor 1s infinite;
            }
            
            @keyframes blink-cursor {
                0%, 50% { border-right: 2px solid rgba(139, 92, 246, 0.8); }
                51%, 100% { border-right: 2px solid transparent; }
            }
            
            .terminal-subtext {
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.4);
                margin-bottom: 16px;
                padding-left: 24px;
            }
            
            /* Progress Bar */
            .progress-track {
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #8b5cf6, #06b6d4);
                box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
                border-radius: 2px;
                transition: width 0.4s ease;
            }
        </style>
    `;

    // Animate progress
    const progressBar = document.getElementById('splash-progress');
    const terminalLine1 = document.getElementById('terminal-line-1');
    const terminalLine2 = document.getElementById('terminal-line-2');

    const stages = [
        { progress: 15, cmd: 'INITIALIZING_ASSETS...', sub: 'Loading core modules' },
        { progress: 35, cmd: 'CONNECTING_NETWORK...', sub: 'Establishing RPC connection' },
        { progress: 55, cmd: 'DECRYPTING_VAULT...', sub: 'Verifying credentials' },
        { progress: 75, cmd: 'SYNCING_BALANCES...', sub: 'Fetching token data' },
        { progress: 90, cmd: 'OPTIMIZING_ROUTE...', sub: 'Preparing interface' },
        { progress: 100, cmd: 'SYSTEM_READY', sub: 'Launch complete' },
    ];

    let currentStage = 0;

    const interval = setInterval(() => {
        if (currentStage < stages.length && progressBar && terminalLine1 && terminalLine2) {
            progressBar.style.width = `${stages[currentStage].progress}%`;
            terminalLine1.textContent = stages[currentStage].cmd;
            terminalLine2.textContent = stages[currentStage].sub;
            currentStage++;
        } else {
            clearInterval(interval);

            setTimeout(() => {
                const splash = document.getElementById('splash-screen');
                if (splash) {
                    splash.style.transition = 'opacity 0.6s ease';
                    splash.style.opacity = '0';
                    setTimeout(() => {
                        splash.remove();
                        if (onComplete) onComplete();
                    }, 600);
                }
            }, 500);
        }
    }, 500);
}
