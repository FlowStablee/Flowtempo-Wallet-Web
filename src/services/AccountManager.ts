import { Wallet, HDNodeWallet } from 'ethers';

export class AccountManager {
    static STORAGE_KEY = 'tempo_local_wallet';

    static hasWallet(): boolean {
        return !!localStorage.getItem(this.STORAGE_KEY);
    }

    static async createWallet(password: string): Promise<string> {
        const wallet = Wallet.createRandom();
        const encrypted = await wallet.encrypt(password);
        localStorage.setItem(this.STORAGE_KEY, encrypted);
        return wallet.address;
    }

    static async importWallet(privateKey: string, password: string): Promise<string> {
        const wallet = new Wallet(privateKey);
        const encrypted = await wallet.encrypt(password);
        localStorage.setItem(this.STORAGE_KEY, encrypted);
        return wallet.address;
    }

    static async unlockWallet(password: string): Promise<Wallet | HDNodeWallet> {
        const encrypted = localStorage.getItem(this.STORAGE_KEY);
        if (!encrypted) throw new Error("No wallet found");
        return await Wallet.fromEncryptedJson(encrypted, password);
    }

    static clearWallet() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
