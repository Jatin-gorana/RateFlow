import React from 'react';
import { Link } from 'react-router-dom';
import { YieldData } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface YieldCardProps {
  yieldData: YieldData;
  isLive?: boolean;
}

const YieldCard: React.FC<YieldCardProps> = ({ yieldData, isLive = false }) => {
  const formatAPY = (apy: string | null) => {
    if (apy === null) return 'N/A';
    return parseFloat(apy).toFixed(4);
  };

  const formatNumber = (num: string | null) => {
    if (num === null) return 'N/A';
    const value = parseFloat(num);
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const getStatusBadge = () => {
    if (!yieldData.isAvailable) {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
          Coming Soon
        </div>
      );
    }
    return null;
  };

  const getProtocolName = () => {
    return yieldData.protocol || 'Aave Protocol';
  };

  return (
    <Link
      to={`/asset/${yieldData.symbol}`}
      className={`block bg-white rounded-lg shadow-sm border transition-shadow duration-200 ${
        yieldData.isAvailable 
          ? 'border-gray-200 hover:shadow-md' 
          : 'border-warning-200 bg-warning-50'
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              yieldData.isAvailable 
                ? 'bg-primary-100' 
                : 'bg-warning-100'
            }`}>
              <span className={`font-semibold text-sm ${
                yieldData.isAvailable 
                  ? 'text-primary-600' 
                  : 'text-warning-600'
              }`}>
                {yieldData.symbol}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {yieldData.symbol}
              </h3>
              <p className="text-sm text-gray-500">{getProtocolName()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {isLive && yieldData.isAvailable && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                <span className="text-xs text-success-600 font-medium">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {yieldData.isAvailable ? (
          <>
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
                  {yieldData.utilizationRate ? parseFloat(yieldData.utilizationRate).toFixed(2) : 'N/A'}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Updated {formatDistanceToNow(new Date(yieldData.lastUpdated))} ago
              </span>
              <span>
                {yieldData.blockNumber ? `Block #${yieldData.blockNumber.toLocaleString()}` : 'No block data'}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {yieldData.statusMessage || 'Yield data not available'}
              </h4>
              <p className="text-sm text-gray-600">
                We're tracking this asset and will enable yield data when protocol support is available.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-warning-200 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-warning-700">Protocol Pending</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default YieldCard;