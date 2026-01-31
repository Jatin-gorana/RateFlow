import React from 'react';
import { YieldRecommendation } from '../types';

interface RecommendationCardProps {
  recommendation: YieldRecommendation | null;
  isLive?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  isLive = false 
}) => {
  if (!recommendation) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const { bestYield, insights, comparison } = recommendation;

  // Safety check for bestYield data
  if (!bestYield || bestYield.supplyAPY === null || bestYield.supplyAPY === undefined) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Yield Recommendation
          </h3>
          <span className="text-xs text-gray-500">Loading...</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-500">Analyzing yield data...</p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-success-600 bg-success-50';
      case 'medium': return 'text-warning-600 bg-warning-50';
      case 'low': return 'text-error-600 bg-error-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-success-600 bg-success-50 border-success-200';
      case 'warning': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Yield Recommendation
        </h3>
        <div className="flex items-center space-x-2">
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-success-600">Live</span>
            </div>
          )}
          <span className="text-xs text-gray-500">
            {new Date(recommendation.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Best Yield Recommendation */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-primary-900">
              {bestYield.symbol}
            </h4>
            <p className="text-2xl font-bold text-primary-600">
              {(bestYield.supplyAPY || 0).toFixed(3)}%
            </p>
            <p className="text-sm text-primary-700 mt-1">
              {bestYield.reason}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(bestYield.confidence)}`}>
              {bestYield.confidence} confidence
            </span>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Market Insights</h5>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{insight.symbol}</span>
                    <p className="text-sm mt-1">{insight.message}</p>
                  </div>
                  {insight.changePercent && (
                    <span className="text-xs font-mono ml-2">
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
        <h5 className="text-sm font-medium text-gray-700 mb-3">Yield Comparison</h5>
        {comparison && comparison.length > 0 ? (
          <div className="space-y-2">
            {comparison.map((asset, index) => (
              <div
                key={asset.symbol}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    index === 0 ? 'bg-primary-600 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    #{asset.rank}
                  </span>
                  <span className="font-medium">{asset.symbol}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="font-mono text-sm">
                    {(asset.supplyAPY || 0).toFixed(3)}%
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{getTrendIcon(asset.trend)}</span>
                    <span className={`text-xs font-mono ${
                      (asset.changePercent || 0) > 0 ? 'text-success-600' : 
                      (asset.changePercent || 0) < 0 ? 'text-error-600' : 'text-gray-500'
                    }`}>
                      {(asset.changePercent || 0) > 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm">No comparison data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;