import React from 'react';
import { YieldData } from '../types';

interface MobileStickyHeaderProps {
  yields: YieldData[];
  isVisible: boolean;
}

const MobileStickyHeader: React.FC<MobileStickyHeaderProps> = ({ yields, isVisible }) => {
  // Find the best yield from available assets
  const bestYield = yields
    .filter(y => y.isAvailable && y.supplyAPY)
    .sort((a, b) => parseFloat(b.supplyAPY!) - parseFloat(a.supplyAPY!))[0];

  if (!bestYield || !isVisible) return null;

  const apyValue = parseFloat(bestYield.supplyAPY!);

  return (
    <div className="lg:hidden fixed top-16 left-0 right-0 z-40 glass border-b border-surface-800 backdrop-blur-xl">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500/20 to-yield-500/20 rounded-lg flex items-center justify-center border border-surface-700">
              <span className="font-mono text-sm font-bold text-white">
                {bestYield.symbol}
              </span>
            </div>
            <div>
              <div className="font-ui text-xs text-surface-400 uppercase tracking-wider">
                Best Yield
              </div>
              <div className="font-mono text-lg font-bold text-yield-500 neon-text">
                {apyValue.toFixed(3)}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yield-500 rounded-full live-dot"></div>
            <span className="font-ui text-xs text-yield-500 font-medium">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileStickyHeader;