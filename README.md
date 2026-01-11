# TempoFlow Wallet Web

![TempoFlow Wallet](public/tempoflow-logo.png)

**TempoFlow Wallet** is a secure, fast, and decentralized web-based crypto wallet designed for the modern DeFi ecosystem. Built with performance and mobile-responsiveness in mind, it provides a seamless experience for managing assets, interacting with the blockchain, and deploying tokens.

## 🚀 Features

### Core Capabilities
- **🔐 Secure Authentication:** Create new wallets or import existing private keys safely.
- **📱 Fully Mobile Responsive:** Optimized experience on all devices with a dedicated mobile menu.
- **💼 Dashboard:** Real-time asset tracking and transaction history.
- **💸 Send & Receive:** Transfer crypto assets with an intuitive interface.
- **🔄 Token Swap:** Built-in swap interface for exchanging assets.
- **🪙 Token Factory:** Deploy your own standard ERC-20 tokens in seconds (No coding required).
- **🚰 Faucet:** Integrated testnet faucet for developers.
- **🔒 Security Tools:** Wallet locking, key backup, and secure encryption.

## 🛠️ Technology Stack

- **Framework:** [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Dark Mode First)
- **Blockchain:** [Ethers.js v6](https://docs.ethers.org/v6/) + [Viem](https://viem.sh/)
- **Icons:** Custom SVG System & Lucide

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/FlowStablee/Flowtempo-Wallet-Web.git
    cd Flowtempo-Wallet-Web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`

### Building for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## 📁 Project Structure

```bash
src/
├── features/       # Modular feature logic (Send, Swap, CreateToken)
├── services/       # Core services (Blockchain, Account, formatting)
├── ui/             # UI Components (Dashboard, AuthScreen, Sidebar)
├── utils/          # Helpers and Icons
├── config.ts       # Chain configuration
├── style.css       # Tailwind 4 & Global Styles
└── main.ts         # Application Entry Point
```

## 📱 Mobile Support

TempoFlow is designed "Mobile First".
- **Desktop:** Full sidebar navigation with glassmorphism effects.
- **Mobile:** Bottom navigation bar + Slide-up feature menu.

## 📄 License

This project is licensed under the MIT License.

---
*Built with ❤️ by FlowStablee*
