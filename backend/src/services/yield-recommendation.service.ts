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

export class YieldRecommendationService {
  private previousYields: Map<string, number> = new Map();
  private yieldHistory: Map<string, number[]> = new Map();
  private readonly SPIKE_THRESHOLD = 0.15; // 0.15% increase
  private readonly COOLING_THRESHOLD = -0.10; // 0.10% decrease
  private readonly STABLE_THRESHOLD = 0.05; // ±0.05% is stable
  private readonly HISTORY_LENGTH = 10; // Keep last 10 readings

  public analyzeYields(currentYields: any[]): YieldRecommendation {
    // Safety check for input data
    if (!currentYields || currentYields.length === 0) {
      return {
        bestYield: {
          symbol: 'N/A',
          supplyAPY: 0,
          reason: 'No yield data available',
          confidence: 'low'
        },
        insights: [{
          symbol: 'SYSTEM',
          type: 'stable',
          message: 'Waiting for yield data...',
          severity: 'info'
        }],
        comparison: [],
        lastUpdated: new Date()
      };
    }

    const comparison = this.createComparison(currentYields);
    const insights = this.generateInsights(currentYields);
    const bestYield = this.determineBestYield(comparison, insights);

    // Update history
    this.updateHistory(currentYields);

    return {
      bestYield,
      insights,
      comparison,
      lastUpdated: new Date()
    };
  }

  private createComparison(yields: any[]): YieldComparison[] {
    return yields
      .map(asset => {
        const currentAPY = typeof asset.supplyAPY === 'string' ? parseFloat(asset.supplyAPY) : asset.supplyAPY;
        const previousAPY = this.previousYields.get(asset.symbol) || currentAPY;
        const changeFromPrevious = currentAPY - previousAPY;
        const changePercent = previousAPY > 0 ? (changeFromPrevious / previousAPY) * 100 : 0;

        return {
          symbol: asset.symbol,
          supplyAPY: currentAPY,
          rank: 0, // Will be set after sorting
          changeFromPrevious,
          changePercent,
          trend: this.determineTrend(changePercent)
        };
      })
      .sort((a, b) => b.supplyAPY - a.supplyAPY)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  private generateInsights(yields: any[]): YieldInsight[] {
    const insights: YieldInsight[] = [];

    yields.forEach(asset => {
      const currentAPY = typeof asset.supplyAPY === 'string' ? parseFloat(asset.supplyAPY) : asset.supplyAPY;
      const previousAPY = this.previousYields.get(asset.symbol) || currentAPY;
      const change = currentAPY - previousAPY;
      const changePercent = previousAPY > 0 ? (change / previousAPY) * 100 : 0;

      // Detect spikes
      if (change >= this.SPIKE_THRESHOLD) {
        insights.push({
          symbol: asset.symbol,
          type: 'spike',
          message: `${asset.symbol} yield spiked +${change.toFixed(3)}% to ${currentAPY.toFixed(3)}%`,
          severity: 'success',
          changePercent
        });
      }
      // Detect cooling
      else if (change <= this.COOLING_THRESHOLD) {
        insights.push({
          symbol: asset.symbol,
          type: 'cooling',
          message: `${asset.symbol} yield cooling ${change.toFixed(3)}% to ${currentAPY.toFixed(3)}%`,
          severity: 'warning',
          changePercent
        });
      }
      // Detect trends from history
      else {
        const trend = this.analyzeTrend(asset.symbol, currentAPY);
        if (trend) {
          insights.push(trend);
        }
      }
    });

    // Add market overview if no specific insights
    if (insights.length === 0) {
      const avgAPY = yields.reduce((sum, asset) => {
        const apy = typeof asset.supplyAPY === 'string' ? parseFloat(asset.supplyAPY) : asset.supplyAPY;
        return sum + apy;
      }, 0) / yields.length;
      insights.push({
        symbol: 'MARKET',
        type: 'stable',
        message: `Market stable - Average APY: ${avgAPY.toFixed(3)}%`,
        severity: 'info'
      });
    }

    return insights;
  }

  private determineBestYield(comparison: YieldComparison[], insights: YieldInsight[]): YieldRecommendation['bestYield'] {
    // Safety check for empty comparison
    if (!comparison || comparison.length === 0) {
      return {
        symbol: 'N/A',
        supplyAPY: 0,
        reason: 'No yield data available for comparison',
        confidence: 'low'
      };
    }

    // Start with highest APY
    const highest = comparison[0];
    
    // Check for recent spikes (prioritize growing yields)
    const spikeInsight = insights.find(i => i.type === 'spike');
    if (spikeInsight) {
      const spikeAsset = comparison.find(c => c.symbol === spikeInsight.symbol);
      if (spikeAsset && spikeAsset.rank <= 2) { // Only if it's in top 2
        return {
          symbol: spikeAsset.symbol,
          supplyAPY: spikeAsset.supplyAPY || 0,
          reason: `Highest yield with recent spike (+${(spikeAsset.changePercent || 0).toFixed(2)}%)`,
          confidence: 'high'
        };
      }
    }

    // Check for rising trends
    const risingAsset = comparison.find(c => c.trend === 'up' && c.rank === 1);
    if (risingAsset) {
      return {
        symbol: risingAsset.symbol,
        supplyAPY: risingAsset.supplyAPY || 0,
        reason: `Highest yield with upward trend (+${(risingAsset.changePercent || 0).toFixed(2)}%)`,
        confidence: 'high'
      };
    }

    // Default to highest APY
    const confidence = this.determineConfidence(highest, insights);
    return {
      symbol: highest.symbol,
      supplyAPY: highest.supplyAPY || 0,
      reason: `Highest current yield at ${(highest.supplyAPY || 0).toFixed(3)}%`,
      confidence
    };
  }

  private determineTrend(changePercent: number): 'up' | 'down' | 'stable' {
    if (changePercent > this.STABLE_THRESHOLD) return 'up';
    if (changePercent < -this.STABLE_THRESHOLD) return 'down';
    return 'stable';
  }

  private analyzeTrend(symbol: string, currentAPY: number): YieldInsight | null {
    const history = this.yieldHistory.get(symbol) || [];
    if (history.length < 3) return null;

    const recent = history.slice(-3);
    const isRising = recent.every((val, i) => i === 0 || val >= recent[i - 1]);
    const isFalling = recent.every((val, i) => i === 0 || val <= recent[i - 1]);

    if (isRising && recent[recent.length - 1] - recent[0] > 0.05) {
      return {
        symbol,
        type: 'rising',
        message: `${symbol} showing consistent upward trend`,
        severity: 'success'
      };
    }

    if (isFalling && recent[0] - recent[recent.length - 1] > 0.05) {
      return {
        symbol,
        type: 'falling',
        message: `${symbol} in declining trend`,
        severity: 'warning'
      };
    }

    return null;
  }

  private determineConfidence(asset: YieldComparison, insights: YieldInsight[]): 'high' | 'medium' | 'low' {
    const hasPositiveInsight = insights.some(i => 
      i.symbol === asset.symbol && (i.type === 'spike' || i.type === 'rising')
    );
    const hasNegativeInsight = insights.some(i => 
      i.symbol === asset.symbol && (i.type === 'cooling' || i.type === 'falling')
    );

    if (hasPositiveInsight) return 'high';
    if (hasNegativeInsight) return 'low';
    return 'medium';
  }

  private updateHistory(yields: any[]): void {
    yields.forEach(asset => {
      const currentAPY = typeof asset.supplyAPY === 'string' ? parseFloat(asset.supplyAPY) : asset.supplyAPY;
      
      // Update previous yields
      this.previousYields.set(asset.symbol, currentAPY);
      
      // Update history
      const history = this.yieldHistory.get(asset.symbol) || [];
      history.push(currentAPY);
      
      // Keep only recent history
      if (history.length > this.HISTORY_LENGTH) {
        history.shift();
      }
      
      this.yieldHistory.set(asset.symbol, history);
    });
  }

  public getRecommendationSummary(): string {
    const bestSymbol = Array.from(this.previousYields.entries())
      .sort(([,a], [,b]) => b - a)[0];
    
    if (!bestSymbol) return "Analyzing yields...";
    
    return `${bestSymbol[0]} offers the best yield at ${bestSymbol[1].toFixed(3)}%`;
  }
}