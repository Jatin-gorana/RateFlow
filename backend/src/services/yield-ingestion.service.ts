/**
 * Yield Ingestion Service
 * 
 * Responsible for:
 * - Receiving raw yield data from Aave service
 * - Validating and normalizing data
 * - Storing in memory cache for fast access
 * - Triggering downstream processing
 */
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { YieldSnapshot } from '../types/yield-events';
import { YieldInfo } from './aave-v3.service';

interface IngestionMetrics {
  totalIngested: number;
  lastIngestionTime: Date;
  ingestionRate: number; // yields per minute
  errorCount: number;
  validationFailures: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class YieldIngestionService extends EventEmitter {
  private cache: Map<string, YieldSnapshot> = new Map();
  private metrics: IngestionMetrics = {
    totalIngested: 0,
    lastIngestionTime: new Date(),
    ingestionRate: 0,
    errorCount: 0,
    validationFailures: 0
  };
  private ingestionHistory: Date[] = [];
  private readonly RATE_CALCULATION_WINDOW = 60000; // 1 minute in ms
  private readonly MAX_CACHE_SIZE = 1000;

  constructor() {
    super();
    logger.info('YieldIngestionService initialized');
  }

  /**
   * Ingest yield data from Aave service
   */
  public async ingest(yieldInfo: YieldInfo): Promise<void> {
    try {
      // Validate incoming data
      const validation = this.validateYieldInfo(yieldInfo);
      if (!validation.isValid) {
        this.metrics.validationFailures++;
        logger.warn(`Validation failed for ${yieldInfo.symbol}:`, validation.errors);
        this.emit('validation_error', { symbol: yieldInfo.symbol, errors: validation.errors });
        return;
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn(`Validation warnings for ${yieldInfo.symbol}:`, validation.warnings);
      }

      // Normalize data
      const snapshot = this.normalizeYieldData(yieldInfo);

      // Store in cache
      this.storeInCache(snapshot);

      // Update metrics
      this.updateMetrics();

      // Emit events for downstream processing
      this.emit('yield_ingested', snapshot);
      
      // Check for significant changes
      const previousSnapshot = this.getPreviousSnapshot(snapshot.symbol);
      if (previousSnapshot && this.hasSignificantChange(previousSnapshot, snapshot)) {
        this.emit('significant_change', { previous: previousSnapshot, current: snapshot });
      }

      logger.debug(`Successfully ingested yield data for ${snapshot.symbol}`, {
        supplyAPY: snapshot.supplyAPY,
        borrowAPY: snapshot.borrowAPY,
        timestamp: snapshot.timestamp
      });

    } catch (error) {
      this.metrics.errorCount++;
      logger.error(`Error ingesting yield data for ${yieldInfo.symbol}:`, error);
      this.emit('ingestion_error', { symbol: yieldInfo.symbol, error });
      throw error;
    }
  }

  /**
   * Batch ingest multiple yield data points
   */
  public async batchIngest(yieldInfos: YieldInfo[]): Promise<void> {
    const results = await Promise.allSettled(
      yieldInfos.map(yieldInfo => this.ingest(yieldInfo))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(`Batch ingestion completed: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      this.emit('batch_ingestion_partial_failure', { successful, failed, total: yieldInfos.length });
    }
  }

  /**
   * Validate yield information
   */
  private validateYieldInfo(yieldInfo: YieldInfo): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!yieldInfo.symbol || typeof yieldInfo.symbol !== 'string') {
      errors.push('Symbol is required and must be a string');
    }

    if (typeof yieldInfo.supplyAPY !== 'number' || isNaN(yieldInfo.supplyAPY)) {
      errors.push('Supply APY must be a valid number');
    }

    if (typeof yieldInfo.borrowAPY !== 'number' || isNaN(yieldInfo.borrowAPY)) {
      errors.push('Borrow APY must be a valid number');
    }

    if (typeof yieldInfo.utilizationRate !== 'number' || isNaN(yieldInfo.utilizationRate)) {
      errors.push('Utilization rate must be a valid number');
    }

    if (!yieldInfo.lastUpdated || !(yieldInfo.lastUpdated instanceof Date)) {
      errors.push('Last updated must be a valid Date');
    }

    if (typeof yieldInfo.blockNumber !== 'number' || yieldInfo.blockNumber <= 0) {
      errors.push('Block number must be a positive number');
    }

    // Range validations
    if (yieldInfo.supplyAPY < 0 || yieldInfo.supplyAPY > 1000) {
      warnings.push('Supply APY seems unusually high or negative');
    }

    if (yieldInfo.borrowAPY < 0 || yieldInfo.borrowAPY > 1000) {
      warnings.push('Borrow APY seems unusually high or negative');
    }

    if (yieldInfo.utilizationRate < 0 || yieldInfo.utilizationRate > 100) {
      errors.push('Utilization rate must be between 0 and 100');
    }

    // Logical validations
    if (yieldInfo.borrowAPY < yieldInfo.supplyAPY) {
      warnings.push('Borrow APY is lower than supply APY, which is unusual');
    }

    // Timestamp validation
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - yieldInfo.lastUpdated.getTime());
    if (timeDiff > 300000) { // 5 minutes
      warnings.push('Data timestamp is more than 5 minutes old');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Normalize yield data into standard format
   */
  private normalizeYieldData(yieldInfo: YieldInfo): YieldSnapshot {
    return {
      symbol: yieldInfo.symbol.toUpperCase(),
      supplyAPY: Math.round(yieldInfo.supplyAPY * 10000) / 10000, // 4 decimal places
      borrowAPY: Math.round(yieldInfo.borrowAPY * 10000) / 10000,
      utilizationRate: Math.round(yieldInfo.utilizationRate * 100) / 100, // 2 decimal places
      totalSupply: yieldInfo.totalSupply,
      totalBorrow: yieldInfo.totalBorrow,
      blockNumber: yieldInfo.blockNumber,
      timestamp: yieldInfo.lastUpdated,
      ingestionTime: new Date(),
      source: 'aave-v3'
    };
  }

  /**
   * Store snapshot in memory cache
   */
  private storeInCache(snapshot: YieldSnapshot): void {
    // Implement LRU-like behavior if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(snapshot.symbol, snapshot);
  }

  /**
   * Get previous snapshot for comparison
   */
  private getPreviousSnapshot(symbol: string): YieldSnapshot | null {
    return this.cache.get(symbol) || null;
  }

  /**
   * Check if there's a significant change between snapshots
   */
  private hasSignificantChange(previous: YieldSnapshot, current: YieldSnapshot): boolean {
    const SIGNIFICANT_THRESHOLD = 0.1; // 0.1% change

    const supplyChange = Math.abs(current.supplyAPY - previous.supplyAPY);
    const borrowChange = Math.abs(current.borrowAPY - previous.borrowAPY);
    const utilizationChange = Math.abs(current.utilizationRate - previous.utilizationRate);

    return supplyChange >= SIGNIFICANT_THRESHOLD || 
           borrowChange >= SIGNIFICANT_THRESHOLD || 
           utilizationChange >= SIGNIFICANT_THRESHOLD;
  }

  /**
   * Update ingestion metrics
   */
  private updateMetrics(): void {
    const now = new Date();
    this.metrics.totalIngested++;
    this.metrics.lastIngestionTime = now;
    
    // Add to history for rate calculation
    this.ingestionHistory.push(now);
    
    // Remove old entries outside the calculation window
    const cutoff = now.getTime() - this.RATE_CALCULATION_WINDOW;
    this.ingestionHistory = this.ingestionHistory.filter(time => time.getTime() > cutoff);
    
    // Calculate ingestion rate (per minute)
    this.metrics.ingestionRate = this.ingestionHistory.length;
  }

  /**
   * Get current snapshot for an asset
   */
  public getCurrentSnapshot(symbol: string): YieldSnapshot | null {
    return this.cache.get(symbol.toUpperCase()) || null;
  }

  /**
   * Get all current snapshots
   */
  public getAllSnapshots(): YieldSnapshot[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get ingestion metrics
   */
  public getMetrics(): IngestionMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache and reset metrics
   */
  public reset(): void {
    this.cache.clear();
    this.ingestionHistory = [];
    this.metrics = {
      totalIngested: 0,
      lastIngestionTime: new Date(),
      ingestionRate: 0,
      errorCount: 0,
      validationFailures: 0
    };
    logger.info('YieldIngestionService reset');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      utilizationPercent: (this.cache.size / this.MAX_CACHE_SIZE) * 100,
      assets: Array.from(this.cache.keys())
    };
  }

  /**
   * Health check
   */
  public getHealthStatus() {
    const now = new Date();
    const timeSinceLastIngestion = now.getTime() - this.metrics.lastIngestionTime.getTime();
    const isHealthy = timeSinceLastIngestion < 300000; // 5 minutes

    return {
      isHealthy,
      timeSinceLastIngestion,
      metrics: this.getMetrics(),
      cacheStats: this.getCacheStats()
    };
  }
}