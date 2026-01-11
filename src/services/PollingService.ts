/**
 * Smart Polling Service - MetaMask Style
 * - Polls every 20 seconds when tab is active
 * - Immediately polls on tab focus (visibility change)
 * - Stops polling when tab is hidden
 */

type PollCallback = () => void | Promise<void>;

export class PollingService {
    private static instance: PollingService;
    private callbacks: Map<string, PollCallback> = new Map();
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private readonly POLL_INTERVAL = 20000; // 20 seconds
    private isActive = true;

    private constructor() {
        this.setupVisibilityListener();
        this.startPolling();
    }

    public static getInstance(): PollingService {
        if (!PollingService.instance) {
            PollingService.instance = new PollingService();
        }
        return PollingService.instance;
    }

    private setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.isActive = true;
                // Immediate poll on tab focus
                this.pollAll();
                this.startPolling();
            } else {
                this.isActive = false;
                this.stopPolling();
            }
        });

        // Also trigger on window focus (some browsers don't fire visibilitychange)
        window.addEventListener('focus', () => {
            if (!this.isActive) {
                this.isActive = true;
                this.pollAll();
                this.startPolling();
            }
        });

        window.addEventListener('blur', () => {
            // Don't stop immediately on blur, only on visibility hidden
        });
    }

    private startPolling() {
        if (this.intervalId) return; // Already polling

        this.intervalId = setInterval(() => {
            if (this.isActive) {
                this.pollAll();
            }
        }, this.POLL_INTERVAL);
    }

    private stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private async pollAll() {
        for (const [_id, callback] of this.callbacks) {
            try {
                await callback();
            } catch (e) {
                console.warn('[PollingService] Callback error:', e);
            }
        }
    }

    /**
     * Register a callback to be called on each poll cycle
     */
    public register(id: string, callback: PollCallback) {
        this.callbacks.set(id, callback);
    }

    /**
     * Unregister a callback
     */
    public unregister(id: string) {
        this.callbacks.delete(id);
    }

    /**
     * Force an immediate poll (useful after a transaction)
     */
    public forceRefresh() {
        this.pollAll();
    }
}
