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
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-8 mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="skeleton h-8 w-32 rounded"></div>
          <div className="skeleton h-16 w-48 rounded"></div>
          <div className="skeleton h-8 w-24 rounded"></div>
        </div>
      </div>
    );
  }

  const apyValue = parseFloat(bestYield.supplyAPY!);
  const isHighYield = apyValue > 4.0;

  return (
    <div className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 transition-colors duration-200 rounded-xl p-8 mb-8 hover-lift relative overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-400/5"></div>

      <div className="relative">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
          {/* Left Section - Label */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isLive && (
                <div className="w-3 h-3 bg-emerald-400 rounded-full live-dot"></div>
              )}
              <span className="font-ui text-zinc-400 text-sm uppercase tracking-wider font-medium">
                Best Yield Right Now
              </span>
            </div>
          </div>

          {/* Center Section - Main Display */}
          <div className="flex items-center space-x-6">
            {/* Asset Symbol */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-emerald-400/20 rounded-xl flex items-center justify-center border border-zinc-700 mb-2">
                <span className="font-mono text-xl font-bold text-white">
                  {bestYield.symbol}
                </span>
              </div>
              <span className="font-ui text-zinc-400 text-xs">
                {bestYield.protocol}
              </span>
            </div>

            {/* FIXED: APY Display - Crisp LED Style, No Blur */}
            <div className="text-center">
              <div 
                key={pulseKey}
                className={`font-mono text-6xl lg:text-7xl font-bold tracking-tight ${
                  isHighYield ? 'text-emerald-300' : 'text-emerald-400'
                } ${isLive ? 'data-pulse' : ''}`}
              >
                {apyValue.toFixed(3)}%
              </div>
              <div className="font-ui text-zinc-400 text-sm mt-1">
                Supply APY
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-400/10 rounded-xl border border-emerald-400/20">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="font-ui text-emerald-400 text-xs mt-1 font-medium">
                Trending
              </span>
            </div>
          </div>

          {/* Right Section - Stats */}
          <div className="flex flex-col space-y-2 text-right">
            <div>
              <span className="font-ui text-zinc-400 text-xs">Utilization</span>
              <div className="font-mono text-white text-lg font-semibold tracking-tight">
                {bestYield.utilizationRate ? parseFloat(bestYield.utilizationRate).toFixed(1) : 'N/A'}%
              </div>
            </div>
            <div>
              <span className="font-ui text-zinc-400 text-xs">Total Supply</span>
              <div className="font-mono text-zinc-300 text-sm tracking-tight">
                ${bestYield.totalSupply ? (parseFloat(bestYield.totalSupply) / 1000000).toFixed(0) : 'N/A'}M
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only sticky version */}
        <div className="lg:hidden mt-6 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="font-ui text-zinc-400 text-sm">Live Updates</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full live-dot"></div>
              <span className="font-ui text-emerald-400 text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroTicker;