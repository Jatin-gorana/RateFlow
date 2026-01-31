export interface Asset {
  id: number;
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  isActive: boolean;
}

export interface YieldData {
  assetId: number;
  symbol: string;
  supplyAPY: string;
  borrowAPY: string;
  utilizationRate: string;
  totalSupply: string;
  totalBorrow: string;
  lastUpdated: Date;
  blockNumber: number;
}

export interface HistoricalYield {
  id: number;
  assetId: number;
  supplyAPY: string;
  borrowAPY: string;
  timestamp: Date;
  blockNumber: number;
}

export interface WebSocketMessage {
  type: 'YIELD_UPDATE' | 'YIELD_CHANGE' | 'BEST_YIELD' | 'ASSET_UPDATE' | 'ERROR';
  data: any;
  timestamp: Date;
}

export interface AaveReserveData {
  reserve: string;
  liquidityRate: bigint;
  stableBorrowRate: bigint;
  variableBorrowRate: bigint;
  liquidityIndex: bigint;
  variableBorrowIndex: bigint;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export const SUPPORTED_ASSETS = {
  USDC: {
    symbol: 'USDC',
    address: '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505',
    decimals: 6,
    name: 'USD Coin'
  },
  USDT: {
    symbol: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    name: 'Tether USD'
  }
} as const;