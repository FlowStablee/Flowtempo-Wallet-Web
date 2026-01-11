/**
 * Transaction History Service
 * Persists transaction history to localStorage
 */

export interface HistoryEntry {
    id: string;
    type: 'send' | 'mint' | 'swap' | 'deploy' | 'faucet';
    hash: string;
    timestamp: number;
    status: 'pending' | 'success' | 'failed';
    details: {
        from?: string;
        to?: string;
        amount?: string;
        symbol?: string;
        tokenAddress?: string;
    };
}

const STORAGE_KEY = 'tempo_tx_history';
const MAX_ENTRIES = 50;

export class HistoryService {
    private static instance: HistoryService;

    public static getInstance(): HistoryService {
        if (!HistoryService.instance) {
            HistoryService.instance = new HistoryService();
        }
        return HistoryService.instance;
    }

    /**
     * Add a new transaction to history
     */
    public add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
        const history = this.getAll();

        const newEntry: HistoryEntry = {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };

        history.unshift(newEntry); // Add to beginning

        // Trim if too long
        if (history.length > MAX_ENTRIES) {
            history.splice(MAX_ENTRIES);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return newEntry;
    }

    /**
     * Update a transaction status (e.g., pending -> success)
     */
    public updateStatus(hash: string, status: HistoryEntry['status']) {
        const history = this.getAll();
        const entry = history.find(e => e.hash === hash);
        if (entry) {
            entry.status = status;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
    }

    /**
     * Get all history entries
     */
    public getAll(): HistoryEntry[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Get recent entries (last N)
     */
    public getRecent(count: number = 10): HistoryEntry[] {
        return this.getAll().slice(0, count);
    }

    /**
     * Clear all history
     */
    public clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
}
