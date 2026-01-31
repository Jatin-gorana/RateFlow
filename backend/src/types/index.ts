export interface Asset {
  id: number;
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  isActive: boolean;
  protocols: ProtocolSupport[];
  status: AssetStatus;
}

export interface ProtocolSupport {
  name: string;
  isSupported: boolean;
  isActive: boolean;
  reason?: string;
}

export type AssetStatus = 'active' | 'tracked' | 'coming_soon' | 'inactive';

export interface YieldData {
  assetId: number;
  symbol: string;
  supplyAPY: string | null;
  borrowAPY: string | null;
  utilizationRate: string | null;
  totalSupply: string | null;
  totalBorrow: string | null;
  lastUpdated: Date;
  blockNumber: number | null;
  isAvailable: boolean;
  protocol: string;
  statusMessage?: string;
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
    name: 'USD Coin',
    protocols: ['aave'],
    status: 'active' as AssetStatus
  },
  USDT: {
    symbol: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    name: 'Tether USD',
    protocols: ['aave'],
    status: 'active' as AssetStatus
  },
  USDE: {
    symbol: 'USDE',
    address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    decimals: 18,
    name: 'Ethena USDe',
    protocols: ['ethena'],
    status: 'tracked' as AssetStatus
  },
  CEVUSD: {
    symbol: 'CevUSD',
    address: '0x3F3B3B3B3B3B3B3B3B3B3B3B3B3B3B3B3B3B3B3B',
    decimals: 18,
    name: 'Curve USD',
    protocols: ['curve'],
    status: 'tracked' as AssetStatus
  }
} as const;

export const PROTOCOL_INFO = {
  aave: {
    name: 'Aave V3',
    isActive: true,
    description: 'Decentralized lending protocol'
  },
  ethena: {
    name: 'Ethena',
    isActive: false,
    description: 'Synthetic dollar protocol'
  },
  curve: {
    name: 'Curve Finance',
    isActive: false,
    description: 'Stablecoin AMM protocol'
  },
  pendle: {
    name: 'Pendle',
    isActive: false,
    description: 'Yield tokenization protocol'
  }
} as const;