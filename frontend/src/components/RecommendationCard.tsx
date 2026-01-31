import React, { useState, useEffect } from 'react';
import { YieldRecommendation } from '../types';

interface RecommendationCardProps {
  recommendation: YieldRecommendation | null;
  isLive?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  isLive = false 
}) => {
  const [pulseKey, setPulseKey] = useState(0);

  // Trigger pulse animation when data updates
  useEffect(() => {
    if (isLive && recommendation) {
      setPulseKey(prev => prev + 1);
    }
  }, [recommendation?.bestYield.supplyAPY, isLive]);

  if (!recommendation) {
    return (
      <div className="glass rounded-xl p-6 border-surface-700">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-6 w-48 rounded"></div>
          <div className="skeleton h-4 w-20 rounded"></div>
        </div>
        <div className="skeleton h-32 w-full rounded-lg"></div>
      </div>
    );
  }

  const { bestYield, insights, comparison } = recommendation;

  // Safety check for bestYield data
  if (!bestYield || bestYield.supplyAPY === null || bestYield.supplyAPY === undefined) {
    return (
      <div className="glass rounded-xl p-6 border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-ui text-lg font-semibold text-white">
            Smart Recommendations
          </h3>
          <span className="font-ui text-xs text-surface-500">Analyzing...</span>
        </div>
        <div className="bg-surface-900 rounded-lg p-6 text-center border border-surface-700">
          <div className="w-12 h-12 bg-surface-800 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-surface-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="font-ui text-surface-400">Analyzing yield patterns...</p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-yield-400 bg-yield-500/10 border-yield-500/20';
      case 'medium': return 'text-warning-400 bg-warning-500/10 border-warning-500/20';
      case 'low': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-surface-400 bg-surface-800 border-surface-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-yield-400 bg-yield-500/10 border-yield-500/20';
      case 'warning': return 'text-warning-400 bg-warning-500/10 border-warning-500/20';
      case 'info': return 'text-brand-400 bg-brand-500/10 border-brand-500/20';
      default: return 'text-surface-400 bg-surface-800 border-surface-700';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return (
        <svg className="w-4 h-4 text-yield-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
      case 'down': return (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
      case 'stable': return (
        <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
      default: return (
        <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
    }
  };

  return (
    <div className="glass rounded-xl p-6 border-surface-700 hover-lift relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-yield-500/10"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500/20 to-yield-500/20 rounded-lg flex items-center justify-center border border-surface-600">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-ui text-lg font-semibold text-white">
              Smart Recommendations
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            {isLive && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yield-500 rounded-full live-dot shadow-yield-glow"></div>
                <span className="font-ui text-xs text-yield-500 font-medium">AI Active</span>
              </div>
            )}
            <span className="font-mono text-xs text-surface-500">
              {new Date(recommendation.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Best Yield Recommendation */}
        <div className="bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 rounded-xl p-6 mb-6 border border-surface-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-yield-500/5"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500/20 to-yield-500/20 rounded-xl flex items-center justify-center border border-surface-600">
                  <span className="font-mono text-lg font-bold text-white">
                    {bestYield.symbol}
                  </span>
                </div>
                <div>
                  <h4 className="font-ui text-xl font-bold text-white mb-1">
                    {bestYield.symbol}
                  </h4>
                  <p className="font-ui text-sm text-surface-400">
                    {bestYield.reason}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div 
                  key={pulseKey}
                  className={`font-mono text-3xl font-bold text-yield-500 neon-text mb-2 ${
                    isLive ? 'data-pulse' : ''
                  }`}
                >
                  {(bestYield.supplyAPY || 0).toFixed(3)}%
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(bestYield.confidence)}`}>
                  {bestYield.confidence} confidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights and Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Insights */}
          {insights.length > 0 && (
            <div>
              <h5 className="font-ui text-sm font-medium text-surface-300 mb-3 flex items-center">
                <span className="w-2 h-2 bg-brand-500 rounded-full mr-2"></span>
                Market Intelligence
              </h5>
              <div className="space-y-3">
                {insights.slice(0, 3).map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)} glass`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-sm font-medium">{insight.symbol}</span>
                          <span className="px-2 py-0.5 bg-surface-800 text-surface-300 text-xs rounded font-ui">
                            {insight.type}
                          </span>
                        </div>
                        <p className="font-ui text-sm">{insight.message}</p>
                      </div>
                      {insight.changePercent && (
                        <span className="font-mono text-xs ml-3 text-surface-300">
                          {insight.changePercent > 0 ? '+' : ''}{(insight.changePercent || 0).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yield Comparison */}
          <div>
            <h5 className="font-ui text-sm font-medium text-surface-300 mb-3 flex items-center">
              <span className="w-2 h-2 bg-yield-500 rounded-full mr-2"></span>
              Yield Rankings
            </h5>
            {comparison && comparison.length > 0 ? (
              <div className="space-y-2">
                {comparison.map((asset, index) => (
                  <div
                    key={asset.symbol}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yield-500/10 to-brand-500/10 border border-yield-500/20' 
                        : 'bg-surface-900 border border-surface-700 hover:border-surface-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        index === 0 ? 'bg-yield-500 text-black' : 'bg-surface-700 text-surface-300'
                      }`}>
                        #{asset.rank}
                      </span>
                      <span className="font-mono font-medium text-white">{asset.symbol}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-sm font-semibold text-white">
                        {(asset.supplyAPY || 0).toFixed(3)}%
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(asset.trend)}
                        <span className={`font-mono text-xs ${
                          (asset.changePercent || 0) > 0 ? 'text-yield-500' : 
                          (asset.changePercent || 0) < 0 ? 'text-red-400' : 'text-surface-400'
                        }`}>
                          {(asset.changePercent || 0) > 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-900 rounded-lg p-4 text-center border border-surface-700">
                <p className="font-ui text-surface-500 text-sm">No comparison data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;