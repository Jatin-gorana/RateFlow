# Web3 Yield Tracker API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
Currently, the API is public and does not require authentication. Rate limiting is applied to prevent abuse.

## Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers

## Response Format
All API responses follow this standard format:

```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "timestamp": "ISO 8601 date string",
  "cached": boolean (optional)
}
```

---

## Endpoints

### Assets

#### GET /assets
Get all supported assets.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "symbol": "USDC",
      "address": "0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505",
      "decimals": 6,
      "name": "USD Coin",
      "isActive": true
    },
    {
      "id": 2,
      "symbol": "USDT",
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "decimals": 6,
      "name": "Tether USD",
      "isActive": true
    }
  ],
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

#### GET /assets/:symbol
Get specific asset information.

**Parameters:**
- `symbol` (string): Asset symbol (e.g., "USDC", "USDT")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "symbol": "USDC",
    "address": "0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505",
    "decimals": 6,
    "name": "USD Coin",
    "isActive": true
  },
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Asset not found",
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

---

### Yields

#### GET /yields
Get current yield data for all assets.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assetId": 1,
      "symbol": "USDC",
      "supplyAPY": "4.2567",
      "borrowAPY": "5.1234",
      "utilizationRate": "75.50",
      "totalSupply": "1000000.00",
      "totalBorrow": "755000.00",
      "lastUpdated": "2024-01-31T10:30:00.000Z",
      "blockNumber": 19234567
    },
    {
      "assetId": 2,
      "symbol": "USDT",
      "supplyAPY": "3.8901",
      "borrowAPY": "4.7890",
      "utilizationRate": "68.25",
      "totalSupply": "2000000.00",
      "totalBorrow": "1365000.00",
      "lastUpdated": "2024-01-31T10:30:00.000Z",
      "blockNumber": 19234567
    }
  ],
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

#### GET /yields/:symbol
Get current yield data for a specific asset.

**Parameters:**
- `symbol` (string): Asset symbol (e.g., "USDC", "USDT")

**Response:**
```json
{
  "success": true,
  "data": {
    "assetId": 1,
    "symbol": "USDC",
    "supplyAPY": "4.2567",
    "borrowAPY": "5.1234",
    "utilizationRate": "75.50",
    "totalSupply": "1000000.00",
    "totalBorrow": "755000.00",
    "lastUpdated": "2024-01-31T10:30:00.000Z",
    "blockNumber": 19234567
  },
  "timestamp": "2024-01-31T10:30:00.000Z",
  "cached": true
}
```

#### GET /yields/:symbol/history
Get historical yield data for a specific asset.

**Parameters:**
- `symbol` (string): Asset symbol (e.g., "USDC", "USDT")

**Query Parameters:**
- `timeframe` (string, optional): Time range for data. Options: "1h", "24h", "7d", "30d". Default: "24h"
- `limit` (number, optional): Maximum number of records to return. Default: 100
- `offset` (number, optional): Number of records to skip. Default: 0

**Example Request:**
```
GET /yields/USDC/history?timeframe=24h&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "assetId": 1,
      "supplyAPY": "4.2567",
      "borrowAPY": "5.1234",
      "timestamp": "2024-01-31T10:30:00.000Z",
      "blockNumber": 19234567
    },
    {
      "id": 12344,
      "assetId": 1,
      "supplyAPY": "4.2456",
      "borrowAPY": "5.1123",
      "timestamp": "2024-01-31T10:29:00.000Z",
      "blockNumber": 19234566
    }
  ],
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

#### POST /yields/fetch-now
Manually trigger a yield data fetch (useful for testing).

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

#### GET /yields/status
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

---

## WebSocket API

### Connection
```javascript
const socket = io('http://localhost:3001');
```

### Events

#### Client → Server

##### subscribe_asset
Subscribe to yield updates for a specific asset.
```javascript
socket.emit('subscribe_asset', 'USDC');
```

##### unsubscribe_asset
Unsubscribe from yield updates for a specific asset.
```javascript
socket.emit('unsubscribe_asset', 'USDC');
```

#### Server → Client

##### yield_update
Real-time yield data updates.
```javascript
socket.on('yield_update', (message) => {
  console.log('Yield update:', message);
  // message format:
  // {
  //   type: 'YIELD_UPDATE',
  //   data: { /* YieldData object */ },
  //   timestamp: '2024-01-31T10:30:00.000Z'
  // }
});
```

##### yield_alert
Significant yield change alerts.
```javascript
socket.on('yield_alert', (alert) => {
  console.log('Yield alert:', alert);
  // alert format:
  // {
  //   type: 'YIELD_ALERT',
  //   data: {
  //     asset: 'USDC',
  //     hasSignificantChange: true,
  //     changes: [
  //       {
  //         type: 'supply',
  //         previousValue: 4.2567,
  //         newValue: 4.7890,
  //         absoluteChange: 0.5323,
  //         percentageChange: 12.5,
  //         severity: 'major'
  //       }
  //     ]
  //   },
  //   timestamp: '2024-01-31T10:30:00.000Z'
  // }
});
```

##### error
Error messages.
```javascript
socket.on('error', (message) => {
  console.error('WebSocket error:', message);
});
```

##### connect
Connection established.
```javascript
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

##### disconnect
Connection lost.
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Error Response Format
```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2024-01-31T10:30:00.000Z"
}
```

---

## Data Types

### YieldData
```typescript
interface YieldData {
  assetId: number;
  symbol: string;
  supplyAPY: string;      // Decimal string (e.g., "4.2567")
  borrowAPY: string;      // Decimal string (e.g., "5.1234")
  utilizationRate: string; // Decimal string (e.g., "75.50")
  totalSupply: string;    // Decimal string (e.g., "1000000.00")
  totalBorrow: string;    // Decimal string (e.g., "755000.00")
  lastUpdated: Date;      // ISO 8601 date string
  blockNumber: number;    // Ethereum block number
}
```

### Asset
```typescript
interface Asset {
  id: number;
  symbol: string;         // Asset symbol (e.g., "USDC")
  address: string;        // Ethereum contract address
  decimals: number;       // Token decimals
  name: string;          // Full asset name
  isActive: boolean;     // Whether asset is actively tracked
}
```

### HistoricalYield
```typescript
interface HistoricalYield {
  id: number;
  assetId: number;
  supplyAPY: string;
  borrowAPY: string;
  timestamp: Date;
  blockNumber: number;
}
```

---

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get current yields
const response = await axios.get('http://localhost:3001/api/v1/yields');
console.log(response.data);

// Get USDC yield history
const history = await axios.get('http://localhost:3001/api/v1/yields/USDC/history?timeframe=24h');
console.log(history.data);
```

### Python
```python
import requests

# Get current yields
response = requests.get('http://localhost:3001/api/v1/yields')
data = response.json()
print(data)

# Get USDT yield data
usdt_response = requests.get('http://localhost:3001/api/v1/yields/USDT')
usdt_data = usdt_response.json()
print(usdt_data)
```

### cURL
```bash
# Get all current yields
curl http://localhost:3001/api/v1/yields

# Get USDC yield history for last 7 days
curl "http://localhost:3001/api/v1/yields/USDC/history?timeframe=7d&limit=100"

# Manually trigger data fetch
curl -X POST http://localhost:3001/api/v1/yields/fetch-now

# Get service status
curl http://localhost:3001/api/v1/yields/status
```

---

## Changelog

### v1.0.0 (2024-01-31)
- Initial API release
- Support for USDC and USDT yield tracking
- Real-time WebSocket updates
- Historical data endpoints
- Yield change detection and alerts