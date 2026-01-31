import { YieldData } from '../types';
import { logger } from '../utils/logger';
import { WebSocketService } from './websocket.service';

/**
 * Yield Change Detection Service
 * 
 * Detects significant changes in yield rates and triggers alerts/notifications
 * Useful for monitoring yield volatility and market conditions
 */
export class YieldChangeDetectorService {
  private previousYields: Map<string, YieldData> = new Map();
  private wsService: WebSocketService;
  
  // Thresholds for change detection (in percentage points)
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 0.1; // 0.1% change
  private readonly MAJOR_CHANGE_THRESHOLD = 0.5; // 0.5% change

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    logger.info('YieldChangeDetectorService initialized');
  }

  /**
   * Analyze yield changes and detect significant movements
   */
  public analyzeYieldChange(newYield: YieldData): YieldChangeAnalysis {
    const previousYield = this.previousYields.get(newYield.symbol);
    
    if (!previousYield) {
      // First time seeing this asset
      this.previousYields.set(newYield.symbol, newYield);
      return {
        asset: newYield.symbol,
        hasSignificantChange: false,
        changes: []
      };
    }

    const changes: YieldChange[] = [];

    // Analyze supply APY change
    const supplyChange = this.calculateChange(
      parseFloat(previousYield.supplyAPY),
      parseFloat(newYield.supplyAPY)
    );

    if (Math.abs(supplyChange.percentageChange) >= this.SIGNIFICANT_CHANGE_THRESHOLD) {
      changes.push({
        type: 'supply',
        previousValue: parseFloat(previousYield.supplyAPY),
        newValue: parseFloat(newYield.supplyAPY),
        absoluteChange: supplyChange.absoluteChange,
        percentageChange: supplyChange.percentageChange,
        severity: this.determineSeverity(Math.abs(supplyChange.percentageChange))
      });
    }

    // Analyze borrow APY change
    const borrowChange = this.calculateChange(
      parseFloat(previousYield.borrowAPY),
      parseFloat(newYield.borrowAPY)
    );

    if (Math.abs(borrowChange.percentageChange) >= this.SIGNIFICANT_CHANGE_THRESHOLD) {
      changes.push({
        type: 'borrow',
        previousValue: parseFloat(previousYield.borrowAPY),
        newValue: parseFloat(newYield.borrowAPY),
        absoluteChange: borrowChange.absoluteChange,
        percentageChange: borrowChange.percentageChange,
        severity: this.determineSeverity(Math.abs(borrowChange.percentageChange))
      });
    }

    // Analyze utilization rate change
    const utilizationChange = this.calculateChange(
      parseFloat(previousYield.utilizationRate),
      parseFloat(newYield.utilizationRate)
    );

    if (Math.abs(utilizationChange.percentageChange) >= this.SIGNIFICANT_CHANGE_THRESHOLD) {
      changes.push({
        type: 'utilization',
        previousValue: parseFloat(previousYield.utilizationRate),
        newValue: parseFloat(newYield.utilizationRate),
        absoluteChange: utilizationChange.absoluteChange,
        percentageChange: utilizationChange.percentageChange,
        severity: this.determineSeverity(Math.abs(utilizationChange.percentageChange))
      });
    }

    // Update stored yield data
    this.previousYields.set(newYield.symbol, newYield);

    const analysis: YieldChangeAnalysis = {
      asset: newYield.symbol,
      hasSignificantChange: changes.length > 0,
      changes,
      timestamp: new Date()
    };

    // Log significant changes
    if (analysis.hasSignificantChange) {
      this.logYieldChanges(analysis);
      this.broadcastYieldAlert(analysis);
    }

    return analysis;
  }

  /**
   * Calculate absolute and percentage change between two values
   */
  private calculateChange(oldValue: number, newValue: number): {
    absoluteChange: number;
    percentageChange: number;
  } {
    const absoluteChange = newValue - oldValue;
    const percentageChange = oldValue !== 0 ? (absoluteChange / oldValue) * 100 : 0;

    return {
      absoluteChange: Math.round(absoluteChange * 10000) / 10000, // 4 decimal places
      percentageChange: Math.round(percentageChange * 100) / 100 // 2 decimal places
    };
  }

  /**
   * Determine the severity of a yield change
   */
  private determineSeverity(changePercentage: number): 'minor' | 'significant' | 'major' {
    if (changePercentage >= this.MAJOR_CHANGE_THRESHOLD) {
      return 'major';
    } else if (changePercentage >= this.SIGNIFICANT_CHANGE_THRESHOLD) {
      return 'significant';
    }
    return 'minor';
  }

  /**
   * Log yield changes for monitoring
   */
  private logYieldChanges(analysis: YieldChangeAnalysis): void {
    analysis.changes.forEach(change => {
      const direction = change.absoluteChange > 0 ? '↑' : '↓';
      const message = `${analysis.asset} ${change.type} APY ${direction} ${Math.abs(change.absoluteChange).toFixed(4)}% (${change.percentageChange > 0 ? '+' : ''}${change.percentageChange.toFixed(2)}%)`;
      
      if (change.severity === 'major') {
        logger.warn(`MAJOR YIELD CHANGE: ${message}`, {
          asset: analysis.asset,
          type: change.type,
          severity: change.severity,
          change: change
        });
      } else {
        logger.info(`Yield change detected: ${message}`, {
          asset: analysis.asset,
          type: change.type,
          severity: change.severity,
          change: change
        });
      }
    });
  }

  /**
   * Broadcast yield alerts via WebSocket
   */
  private broadcastYieldAlert(analysis: YieldChangeAnalysis): void {
    const alertMessage = {
      type: 'YIELD_ALERT',
      data: analysis,
      timestamp: new Date()
    };

    // Broadcast to all connected clients
    this.wsService.broadcastYieldAlert(alertMessage);
  }

  /**
   * Get current yield change statistics
   */
  public getChangeStatistics(): YieldChangeStatistics {
    const stats: YieldChangeStatistics = {
      totalAssetsTracked: this.previousYields.size,
      assetsWithData: Array.from(this.previousYields.keys()),
      lastAnalysisTime: new Date()
    };

    return stats;
  }

  /**
   * Reset change detection (useful for testing or reinitialization)
   */
  public reset(): void {
    this.previousYields.clear();
    logger.info('YieldChangeDetectorService reset');
  }
}

/**
 * Interface for yield change analysis results
 */
export interface YieldChangeAnalysis {
  asset: string;
  hasSignificantChange: boolean;
  changes: YieldChange[];
  timestamp?: Date;
}

/**
 * Interface for individual yield changes
 */
export interface YieldChange {
  type: 'supply' | 'borrow' | 'utilization';
  previousValue: number;
  newValue: number;
  absoluteChange: number;
  percentageChange: number;
  severity: 'minor' | 'significant' | 'major';
}

/**
 * Interface for yield change statistics
 */
export interface YieldChangeStatistics {
  totalAssetsTracked: number;
  assetsWithData: string[];
  lastAnalysisTime: Date;
}