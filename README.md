# Web3 Yield Tracker - Aave Protocol

Real-time yield tracking platform for Aave protocol supporting USDC and USDT.

## Project Structure

```
yield-tracker/
├── backend/           # Node.js + TypeScript API
├── frontend/          # React dashboard
├── shared/            # Shared types and utilities
└── docker-compose.yml # Local development setup
```

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development
docker-compose up -d  # Start Redis & PostgreSQL
cd backend && npm run dev
cd ../frontend && npm start
```

## Architecture

- **Backend**: Node.js + Express + TypeScript + Socket.io
- **Frontend**: React + TypeScript + Socket.io-client
- **Database**: PostgreSQL + Redis
- **Blockchain**: Ethers.js + Aave V3 contracts