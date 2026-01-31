/**
 * Yield event types and interfaces
 */

export interface YieldSnapshot {
  symbol: string;
  supplyAPY: number;
  borrowAPY: number;
  utilizationRate: number;
  totalSupply: string;
  totalBorrow: string;
  blockNumber: number;
  timestamp: Date;
  ingestionTime: Date;
  source: string;
}

export interface YieldChangeEvent {
  symbol: string;
  changeType: 'increase' | 'decrease';
  field: 'supplyAPY' | 'borrowAPY' | 'utilizationRate';
  previousValue: number;
  newValue: number;
  changeAmount: number;
  changePercent: number;
  severity: 'minor' | 'significant' | 'major';
  timestamp: Date;
}

export interface YieldAlert {
  id: string;
  symbol: string;
  alertType: 'spike' | 'drop' | 'anomaly' | 'threshold';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  timestamp: Date;
  acknowledged: boolean;
}

export interface IngestionEvent {
  type: 'yield_ingested' | 'validation_error' | 'ingestion_error' | 'significant_change' | 'batch_ingestion_partial_failure';
  symbol?: string;
  data: any;
  timestamp: Date;
}

export interface ValidationError {
  symbol: string;
  errors: string[];
  warnings?: string[];
  timestamp: Date;
}

export interface IngestionError {
  symbol: string;
  error: Error;
  timestamp: Date;
}

export interface SignificantChangeEvent {
  previous: YieldSnapshot;
  current: YieldSnapshot;
  changes: YieldChangeEvent[];
  timestamp: Date;
}