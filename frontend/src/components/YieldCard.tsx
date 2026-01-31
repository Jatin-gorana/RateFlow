import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { YieldData } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface YieldCardProps {
  yieldData: YieldData;
  isLive?: boolean;
}

const YieldCard: React.FC<YieldCardProps> = ({ yieldData, isLive = false }) => {
  const [pulseKey, setPulseKey] = useState(0);

  // Trigger pulse animation when data updates
  useEffect(() => {
    if (isLive && yieldData.isAvailable) {
      setPulseKey(prev => prev + 1);
    }
  }, [yieldData.supplyAPY, isLive]);

  const formatAPY = (apy: string | null) => {
    if (apy === null) return 'N/A';
    return parseFloat(apy).toFixed(3);
  };

  const formatNumber = (num: string | null) => {
    if (num === null) return 'N/A';
    const value = parseFloat(num);
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const getUtilizationWidth = () => {
    if (!yieldData.utilizationRate) return 0;
    return Math.min(parseFloat(yieldData.utilizationRate), 100);
  };

  const getCardStyles = () => {
    if (!yieldData.isAvailable) {
      return "glass border-surface-700 opacity-75 hover:opacity-90";
    }
    return "glass glass-hover border-surface-700 hover:border-brand-500/50 hover:shadow-glow-sm";
  };

  return (
    <Link
      to={`/asset/${yieldData.symbol}`}
      className={`block ${getCardStyles()} rounded-xl p-6 hover-lift transition-all duration-300 group relative overflow-hidden`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-yield-500/10"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {/* Asset Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              yieldData.isAvailable 
                ? 'bg-gradient-to-br from-brand-500/20 to-yield-500/20 border-surface-600' 
                : 'bg-surface-800 border-surface-700'
            }`}>
              <span className={`font-mono text-lg font-bold ${
                yieldData.isAvailable ? 'text-white' : 'text-surface-400'
              }`}>
                {yieldData.symbol}
              </span>
            </div>
            
            {/* Asset Info */}
            <div>
              <h3 className="font-ui text-lg font-semibold text-white group-hover:text-brand-400 transition-colors">
                {yieldData.symbol}
              </h3>
              <p className="font-ui text-sm text-surface-400">
                {yieldData.protocol || 'Aave Protocol'}
              </p>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            {yieldData.isAvailable ? (
              <>
                {isLive && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yield-500 rounded-full live-dot shadow-yield-glow"></div>
                    <span className="font-ui text-xs text-yield-500 font-medium">LIVE</span>
                  </div>
                )}
              </>
            ) : (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-500/10 text-warning-400 border border-warning-500/20">
                Coming Soon
              </div>
            )}
          </div>
        </div>

        {yieldData.isAvailable ? (
          <>
            {/* Main APY Display */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="font-ui text-sm text-surface-400">Supply APY</span>
                {isLive && (
                  <div className="w-1 h-1 bg-yield-500 rounded-full live-dot"></div>
                )}
              </div>
              <div 
                key={pulseKey}
                className={`font-mono text-4xl font-bold text-yield-500 neon-text ${
                  isLive ? 'data-pulse' : ''
                }`}
              >
                {formatAPY(yieldData.supplyAPY)}%
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="font-ui text-xs text-surface-400 block mb-1">Borrow APY</span>
                <span className="font-mono text-lg font-semibold text-warning-400">
                  {formatAPY(yieldData.borrowAPY)}%
                </span>
              </div>
              <div>
                <span className="font-ui text-xs text-surface-400 block mb-1">Total Supply</span>
                <span className="font-mono text-lg font-semibold text-surface-300">
                  ${formatNumber(yieldData.totalSupply)}
                </span>
              </div>
            </div>

            {/* Utilization Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-ui text-xs text-surface-400">Utilization</span>
                <span className="font-mono text-xs text-surface-300">
                  {yieldData.utilizationRate ? parseFloat(yieldData.utilizationRate).toFixed(1) : 'N/A'}%
                </span>
              </div>
              <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="progress-bar h-full rounded-full transition-all duration-500"
                  style={{ width: `${getUtilizationWidth()}%` }}
                ></div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-surface-500">
              <span className="font-ui">
                Updated {formatDistanceToNow(new Date(yieldData.lastUpdated))} ago
              </span>
              <span className="font-mono">
                {yieldData.blockNumber ? `#${yieldData.blockNumber.toLocaleString()}` : 'No block'}
              </span>
            </div>
          </>
        ) : (
          /* Unavailable Asset Display */
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-surface-800 rounded-xl flex items-center justify-center mx-auto mb-3 border border-surface-700">
                <svg className="w-8 h-8 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-ui text-lg font-medium text-surface-300 mb-2">
                Protocol Integration Pending
              </h4>
              <p className="font-ui text-sm text-surface-500 max-w-xs mx-auto">
                {yieldData.statusMessage || 'Yield data will be available when protocol support is added.'}
              </p>
            </div>
            
            <div className="bg-surface-900 rounded-lg border border-surface-700 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-ui text-surface-400">Status:</span>
                <span className="font-ui font-medium text-warning-400">Tracked</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/5 to-yield-500/5"></div>
      </div>
    </Link>
  );
};

export default YieldCard;