/**
 * Data Cache Service
 * Stores fetched data in memory for instant display
 * When switching tabs, cached data is shown immediately
 * Background refresh happens silently without UI loading states
 */

export interface TokenBalance {
    symbol: string;
    address: string;
    balance: string;
    decimals: number;
}

interface CacheData {
    address: string | null;
    balances: TokenBalance[];
    lastUpdated: number;
}

export class CacheService {
    private static instance: CacheService;
    private cache: CacheData = {
        address: null,
        balances: [],
        lastUpdated: 0
    };

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    // Address
    public setAddress(address: string) {
        this.cache.address = address;
    }

    public getAddress(): string | null {
        return this.cache.address;
    }

    // Balances
    public setBalances(balances: TokenBalance[]) {
        this.cache.balances = balances;
        this.cache.lastUpdated = Date.now();
    }

    public getBalances(): TokenBalance[] {
        return this.cache.balances;
    }

    public hasData(): boolean {
        return this.cache.address !== null && this.cache.balances.length > 0;
    }

    public getLastUpdated(): number {
        return this.cache.lastUpdated;
    }

    // Check if cache is stale (older than 30 seconds)
    public isStale(): boolean {
        return Date.now() - this.cache.lastUpdated > 30000;
    }

    /**
     * Preload images to browser cache for seamless display
     */
    public preloadImages(urls: string[]) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
            // No need to append to DOM, browser caches the Request/Response
        });
    }
}
