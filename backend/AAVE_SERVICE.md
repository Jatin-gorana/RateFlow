# Aave V3 Service Documentation

## Overview

The Aave V3 Service is a production-ready Node.js service that connects to Aave V3 protocol contracts on Ethereum mainnet to fetch real-time supply and borrow APY data for USDC and USDT.

## Features

- ✅ **Real-time Data**: Fetches live APY data from Aave V3 contracts
- ✅ **Polling Mechanism**: Configurable polling interval (30-60 seconds)
- ✅ **Error Handling**: Comprehensive error handling with retry logic
- ✅ **APY Calculation**: Converts Aave's ray format rates to human-readable APY
- ✅ **Production Ready**: Logging, monitoring, and graceful shutdown
- ✅ **TypeScript**: Fully typed with comprehensive interfaces

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ethereum      │    │   Aave V3       │    │   Yield         │
│   RPC Provider  │◀──▶│   Service       │◀──▶│   Manager       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Contract      │    │   Database      │
                       │   Calls         │    │   & Cache       │
                       └─────────────────┘    └─────────────────┘
```

## Contract Addresses (Ethereum Mainnet)

```typescript
export const AAVE_V3_ADDRESSES = {
  POOL: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3'
} as const;

export const ASSET_ADDRESSES = {
  USDC: '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
} as const;
```

## APY Calculation

Aave stores interest rates in "ray" format (1e27 precision) as rates per second. The service converts these to annual percentage yield (APY):

```typescript
// Formula: APY = (1 + ratePerSecond)^(secondsPerYear) - 1
private calculateAPY(rate: bigint): number {
  const RAY = BigInt('1000000000000000000000000000'); // 1e27
  const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);
  
  const ratePerSecond = Number(rate) / Number(RAY);
  const apy = Math.pow(1 + ratePerSecond, Number(SECONDS_PER_YEAR)) - 1;
  
  return Math.round(apy * 100 * 1000000) / 1000000; // 6 decimal places
}
```

## Configuration

```typescript
interface AaveServiceConfig {
  rpcUrl: string;           // Ethereum RPC endpoint
  pollingInterval: number;  // Polling interval in milliseconds
  maxRetries: number;       // Max retry attempts
  retryDelay: number;       // Base retry delay in milliseconds
}
```

## Usage

### Basic Usage

```typescript
import { AaveV3Service } from './services/aave-v3.service';

const aaveService = new AaveV3Service({
  rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
  pollingInterval: 45000, // 45 seconds
  maxRetries: 3,
  retryDelay: 2000
});

// Start polling
await aaveService.start();

// Manual fetch
const yieldData = await aaveService.fetchNow();
console.log(yieldData);

// Stop polling
aaveService.stop();
```

### With Yield Manager

```typescript
import { YieldManagerService } from './services/yield-manager.service';

const yieldManager = new YieldManagerService(wsService);
await yieldManager.start();

// Get current yields
const yields = await yieldManager.getCurrentYields();

// Get specific asset yield
const usdcYield = await yieldManager.getAssetYield('USDC');
```

## API Endpoints

### GET /api/v1/yields/status
Get service status and configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "aaveService": {
      "isRunning": true,
      "pollingInterval": 45000,
      "supportedAssets": ["USDC", "USDT"],
      "contractAddresses": {
        "POOL": "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
        "DATA_PROVIDER": "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3"
      }
    },
    "connectedClients": 5
  },
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

### POST /api/v1/yields/fetch-now
Manually trigger a data fetch (useful for testing).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "asset": "0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505",
      "symbol": "USDC",
      "supplyAPY": 4.2567,
      "borrowAPY": 5.1234,
      "utilizationRate": 75.5,
      "totalSupply": "1000000.00",
      "totalBorrow": "755000.00",
      "lastUpdated": "2024-01-31T10:30:00.000Z",
      "blockNumber": 19234567
    }
  ],
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

## Testing

### Run the test script:
```bash
npm run test:aave
```

### Manual testing:
```bash
# Start the service
npm run dev

# In another terminal, test the API
curl http://localhost:3001/api/v1/yields/status
curl -X POST http://localhost:3001/api/v1/yields/fetch-now
```

## Environment Variables

```bash
# Required
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-api-key

# Optional
POLLING_INTERVAL=45000  # 45 seconds
LOG_LEVEL=info
```

## Error Handling

The service includes comprehensive error handling:

- **Connection Errors**: Automatic retry with exponential backoff
- **Rate Limiting**: Built-in delays between requests
- **Invalid Data**: Graceful handling of malformed responses
- **Network Issues**: Automatic reconnection attempts

## Monitoring

The service provides detailed logging:

```typescript
// Success logs
logger.info('Successfully fetched yield data for USDC', {
  supplyAPY: 4.2567,
  borrowAPY: 5.1234,
  utilizationRate: 75.5
});

// Error logs
logger.error('Failed to fetch data for USDC after 3 attempts', error);
```

## Production Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
ETHEREUM_RPC_URL=https://your-production-rpc-url
POLLING_INTERVAL=60000
LOG_LEVEL=warn
```

### Health Checks
```bash
# Health check endpoint
curl http://localhost:3001/health

# Service status
curl http://localhost:3001/api/v1/yields/status
```

## Troubleshooting

### Common Issues

1. **RPC Connection Failed**
   - Check your RPC URL and API key
   - Verify network connectivity
   - Check rate limits on your RPC provider

2. **Contract Call Failed**
   - Verify contract addresses are correct
   - Check if the network is Ethereum mainnet
   - Ensure sufficient RPC credits

3. **APY Calculation Errors**
   - Check if rate values are valid
   - Verify ray format conversion
   - Look for overflow issues with large numbers

### Debug Mode
```bash
LOG_LEVEL=debug npm run dev
```

## Future Enhancements

- [ ] Support for additional assets (USDE, CevUSD)
- [ ] Integration with other protocols (Compound, Curve)
- [ ] Historical data analysis
- [ ] Performance metrics and alerting
- [ ] WebSocket event streaming
- [ ] Rate limiting and caching optimizations