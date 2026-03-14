# Wallet Demo App 

A Demo wallet app built with React + Vite that demonstrates real-time interaction with a smart contract on Polygon Amoy testnet. Users can connect their MetaMask wallet, read contract data, and execute blockchain transactions to buy reward tokens.

## 🎯 What This Demo Does

This application allows you to:

1. **Connect MetaMask Wallet** - Securely connect your  wallet
2. **View Network & Contract Info** - See blockchain configuration and contract details. By default, the data is read from config/config.json and config/abi.json. Currently, the EDIT option is disabled for MVP
3. **Read Smart Contract Data** - Query  reward balance from smart contract ( A demo contract is deployed on Polygon Amoy test network)
4. **Execute Transactions** - Buy reward tokens by sending POL (Polygon's native token)

### Smart Contract

- **Name**: Reward
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Address**: `0x536439961895BE509a1660218C3646B5BCc8da95`
- **Price**: 0.01 POL per reward token

## 🚀 Quick Start

### Prerequisites

Before running this demo, you need:

1. **Node.js 18.0.0 or higher** - JavaScript runtime
2. **npm** - Package manager (comes with Node.js)
3. **MetaMask Browser Extension** - [Install from metamask.io](https://metamask.io)
4. **Test POL Tokens** - Get free testnet tokens from [Polygon Faucet](https://faucet.polygon.technology/)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Step 3: Setup MetaMask

1. Open MetaMask extension
2. Add Polygon Amoy Testnet:
   - Network Name: `Polygon Amoy Testnet`
   - RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Currency Symbol: `POL`
   - Block Explorer: `https://amoy.polygonscan.com`
3. Get test tokens from the [faucet](https://faucet.polygon.technology/)

### Step 4: Use the App

1. Click **"Connect to Wallet"** in the sidebar
2. Approve MetaMask connection
3. Try the features:
   - **Read Parameters**: Check your reward balance
   - **Write Parameters**: Buy rewards (costs POL)
   - **Chain & Contract Setup**: View network configuration

## 📋 Features

### ✅ Wallet Connection
- MetaMask integration using ethers.js

### 📖 Read Smart Contract Data
- **Dynamic ABI Reader** - Automatically parses contract functions
- Query any view function from the contract:
  
### ✍️ Execute Transactions
- **Buy Rewards** - Purchase reward tokens with POL
- Automatic cost calculation
- Transaction status tracking:
  - ⚡ Ready to execute
  - 🔄 Waiting for signature
  - 🔄 Transaction pending
  - ✅ Transaction successful
  - ❌ Transaction failed
- View transaction hash and block explorer links
- Comprehensive error handling

### ⚙️ Configuration
- View network details (RPC, chain ID, block explorer)
- See contract ABI
- All settings stored in `config.json` for easy updates

## 🏗️ Technology Stack

- **React 18.3.1** - UI framework with hooks
- **Vite 5.3.4** - Fast build tool and dev server
- **ethers.js 6.13.4** - Ethereum library for Web3 interactions
- **Polygon Amoy** - Ethereum-compatible testnet blockchain

## 🔧 Configuration

All blockchain settings are in `src/config/config.json`:

```json
{
  "network": {
    "name": "Polygon Amoy Testnet",
    "chainId": "0x13882",
    "rpcUrl": "https://rpc-amoy.polygon.technology",
    "gas": {
      "maxPriorityFeePerGwei": "30",
      "maxFeePerGwei": "100"
    }
  },
  "contract": {
    "address": "0x536439961895BE509a1660218C3646B5BCc8da95",
    "rewardPrice": "0.01"
  }
}
```


## 📝 Build Commands

```bash
# Development server
npm run dev

```
## TODO
backend not implemented
