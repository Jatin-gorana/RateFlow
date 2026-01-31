import React from 'react';
import { Link } from 'react-router-dom';
import { YieldData } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface YieldCardProps {
  yieldData: YieldData;
  isLive?: boolean;
}

const YieldCard: React.FC<YieldCardProps> = ({ yieldData, isLive = false }) => {
  const formatAPY = (apy: string) => {
    return parseFloat(apy).toFixed(4);
  };

  const formatNumber = (num: string) => {
    const value = parseFloat(num);
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  return (
    <Link
      to={`/asset/${yieldData.symbol}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-sm">
                {yieldData.symbol}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {yieldData.symbol}
              </h3>
              <p className="text-sm text-gray-500">Aave Protocol</p>
            </div>
          </div>
          
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <span className="text-xs text-success-600 font-medium">LIVE</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Supply APY</p>
            <p className="text-2xl font-bold text-success-600">
              {formatAPY(yieldData.supplyAPY)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Borrow APY</p>
            <p className="text-2xl font-bold text-warning-600">
              {formatAPY(yieldData.borrowAPY)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Supply</p>
            <p className="text-sm font-medium text-gray-900">
              ${formatNumber(yieldData.totalSupply)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Utilization</p>
            <p className="text-sm font-medium text-gray-900">
              {parseFloat(yieldData.utilizationRate).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Updated {formatDistanceToNow(new Date(yieldData.lastUpdated))} ago
          </span>
          <span>Block #{yieldData.blockNumber.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
};

export default YieldCard;