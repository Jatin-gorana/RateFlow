import React, { useState, useEffect } from 'react';
import { YieldData } from '../types';

interface HeroTickerProps {
  yields: YieldData[];
  isLive?: boolean;
}

const HeroTicker: React.FC<HeroTickerProps> = ({ yields, isLive = false }) => {
  const [pulseKey, setPulseKey] = useState(0);

  // Find the best yield from available assets
  const bestYield = yields
    .filter(y => y.isAvailable && y.supplyAPY)
    .sort((a, b) => parseFloat(b.supplyAPY!) - parseFloat(a.supplyAPY!))[0];

  // Trigger pulse animation when data updates
  useEffect(() => {
    if (isLive && bestYield) {
      setPulseKey(prev => prev + 1);
    }
  }, [bestYield?.supplyAPY, isLive]);

  if (!bestYield) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-950 via-surface-900 to-surface-950 border border-surface-800 rounded-2xl p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-yield-500/5"></div>
        <div className="relative">
          <div className="flex items-center justify-center space-x-4">
            <div className="skeleton h-8 w-32 rounded"></div>
            <div className="skeleton h-16 w-48 rounded"></div>
            <div className="skeleton h-8 w-24 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const apyValue = parseFloat(bestYield.supplyAPY!);
  const isHighYield = apyValue > 4.0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-surface-950 via-surface-900 to-surface-950 border border-surface-800 rounded-2xl p-8 mb-8 hover-lift">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-yield-500/5"></div>
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl glow-border opacity-60"></div>

      <div className="relative">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
          {/* Left Section - Label */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isLive && (
                <div className="w-3 h-3 bg-yield-500 rounded-full live-dot shadow-yield-glow"></div>
              )}
              <span className="font-ui text-surface-400 text-sm uppercase tracking-wider font-medium">
                Best Yield Right Now
              </span>
            </div>
          </div>

          {/* Center Section - Main Display */}
          <div className="flex items-center space-x-6">
            {/* Asset Symbol */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500/20 to-yield-500/20 rounded-xl flex items-center justify-center border border-surface-700 mb-2">
                <span className="font-mono text-xl font-bold text-white">
                  {bestYield.symbol}
                </span>
              </div>
              <span className="font-ui text-surface-400 text-xs">
                {bestYield.protocol}
              </span>
            </div>

            {/* APY Display */}
            <div className="text-center">
              <div 
                key={pulseKey}
                className={`font-mono text-6xl lg:text-7xl font-bold neon-text ${
                  isHighYield ? 'text-yield-400' : 'text-yield-500'
                } ${isLive ? 'data-pulse' : ''}`}
              >
                {apyValue.toFixed(3)}%
              </div>
              <div className="font-ui text-surface-400 text-sm mt-1">
                Supply APY
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yield-500/10 rounded-xl border border-yield-500/20">
                <svg className="w-6 h-6 text-yield-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="font-ui text-yield-500 text-xs mt-1 font-medium">
                Trending
              </span>
            </div>
          </div>

          {/* Right Section - Stats */}
          <div className="flex flex-col space-y-2 text-right">
            <div>
              <span className="font-ui text-surface-400 text-xs">Utilization</span>
              <div className="font-mono text-white text-lg font-semibold">
                {bestYield.utilizationRate ? parseFloat(bestYield.utilizationRate).toFixed(1) : 'N/A'}%
              </div>
            </div>
            <div>
              <span className="font-ui text-surface-400 text-xs">Total Supply</span>
              <div className="font-mono text-surface-300 text-sm">
                ${bestYield.totalSupply ? (parseFloat(bestYield.totalSupply) / 1000000).toFixed(0) : 'N/A'}M
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only sticky version */}
        <div className="lg:hidden mt-6 pt-4 border-t border-surface-800">
          <div className="flex items-center justify-between">
            <span className="font-ui text-surface-400 text-sm">Live Updates</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yield-500 rounded-full live-dot"></div>
              <span className="font-ui text-yield-500 text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroTicker;