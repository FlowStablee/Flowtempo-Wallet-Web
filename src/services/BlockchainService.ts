import { ethers, Wallet, JsonRpcProvider, HDNodeWallet } from 'ethers';
import { CONFIG } from '../config';

export class BlockchainService {
    private static instance: BlockchainService;
    public provider: JsonRpcProvider;
    public wallet: Wallet | HDNodeWallet | null = null;

    private constructor() {
        this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL, {
            chainId: CONFIG.CHAIN_ID,
            name: 'tempo-moderato'
        });
    }

    public static getInstance(): BlockchainService {
        if (!BlockchainService.instance) {
            BlockchainService.instance = new BlockchainService();
        }
        return BlockchainService.instance;
    }

    public setWallet(wallet: Wallet | HDNodeWallet) {
        this.wallet = wallet.connect(this.provider);
    }

    public getSigner(): Wallet | HDNodeWallet {
        if (!this.wallet) {
            throw new Error("Wallet not unlocked");
        }
        return this.wallet;
    }

    public async getBalance(address: string): Promise<string> {
        // TEMPO quirk: native balance is huge/fake. We should ignore it or explain it.
        // But users might want to see it.
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
    }
}
