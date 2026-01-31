# Setup Instructions

## Required API Keys

### 1. Ethereum RPC Provider (Required for real data)
Choose one of these providers:

**Alchemy (Recommended)**
- Sign up at: https://www.alchemy.com/
- Create a new app for Ethereum Mainnet
- Copy your API key
- Set: `ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY`

**Infura**
- Sign up at: https://infura.io/
- Create a new project
- Copy your project ID
- Set: `ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID`

**Free Alternative (Rate Limited)**
- Use: `ETHEREUM_RPC_URL=https://rpc.ankr.com/eth`
- No API key required but has rate limits

## Quick Start (Mock Data)

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start the server:
```bash
npm run dev
```

3. Start the frontend:
```bash
cd ../frontend
npm install
npm start
```

The app will work with mock data without any API keys.

## Production Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Add your Ethereum RPC URL to `.env`:
```bash
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
```

3. Start services:
```bash
# Start database (optional)
docker-compose up -d

# Start backend
npm run dev
```

## Current Status

- ✅ Mock API endpoints working
- ✅ WebSocket connections working
- ✅ CORS configured
- ✅ Frontend can connect
- 🔄 Real Aave data (requires API key)
- 🔄 Database persistence (optional)