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

export interface YieldRecommendation {
  bestYield: {
    symbol: string;
    supplyAPY: number;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  };
  insights: YieldInsight[];
  comparison: YieldComparison[];
  lastUpdated: Date;
}

export interface YieldInsight {
  symbol: string;
  type: 'spike' | 'cooling' | 'stable' | 'rising' | 'falling';
  message: string;
  severity: 'info' | 'warning' | 'success';
  changePercent?: number;
}

export interface YieldComparison {
  symbol: string;
  supplyAPY: number;
  rank: number;
  changeFromPrevious: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  cached?: boolean;
}

export interface WebSocketMessage {
  type: 'YIELD_UPDATE' | 'ASSET_UPDATE' | 'RECOMMENDATION_UPDATE' | 'ERROR';
  data: any;
  timestamp: Date;
}

export interface ChartDataPoint {
  timestamp: string;
  supplyAPY: number;
  borrowAPY: number;
  date: Date;
}