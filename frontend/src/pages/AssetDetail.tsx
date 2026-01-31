import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useWebSocket } from '../contexts/WebSocketContext';
import { apiService } from '../services/api';
import { YieldData, ChartDataPoint } from '../types';
import YieldChart from '../components/YieldChart';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const AssetDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { latestYieldData, subscribeToAsset, unsubscribeFromAsset } = useWebSocket();
  const [currentYield, setCurrentYield] = useState<YieldData | null>(null);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Fetch current yield data
  const { data: yieldData, isLoading: yieldLoading } = useQuery(
    ['asset-yield', symbol],
    () => apiService.getAssetYield(symbol!),
    {
      enabled: !!symbol,
      refetchInterval: 30000,
    }
  );

  // Fetch historical data
  const { data: historyData, isLoading: historyLoading } = useQuery(
    ['yield-history', symbol, timeframe],
    () => apiService.getYieldHistory(symbol!, timeframe),
    {
      enabled: !!symbol,
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Subscribe to asset updates
  useEffect(() => {
    if (symbol) {
      subscribeToAsset(symbol);
      return () => unsubscribeFromAsset(symbol);
    }
  }, [symbol, subscribeToAsset, unsubscribeFromAsset]);

  // Handle live updates
  useEffect(() => {
    if (latestYieldData && latestYieldData.symbol === symbol) {
      setCurrentYield(latestYieldData);
    } else if (yieldData) {
      setCurrentYield(yieldData);
    }
  }, [latestYieldData, yieldData, symbol]);

  // Transform history data for chart
  const chartData: ChartDataPoint[] = historyData?.map(item => ({
    timestamp: item.timestamp.toString(),
    supplyAPY: item.supplyAPY ? parseFloat(item.supplyAPY) : 0,
    borrowAPY: item.borrowAPY ? parseFloat(item.borrowAPY) : 0,
    date: new Date(item.timestamp)
  })).reverse() || [];

  const formatAPY = (apy: string | null) => {
    if (apy === null) return 'N/A';
    return parseFloat(apy).toFixed(4);
  };

  const formatNumber = (num: string | null) => {
    if (num === null) return 'N/A';
    return (parseFloat(num) / 1000000).toFixed(2);
  };

  const formatUtilization = (rate: string | null) => {
    if (rate === null) return 'N/A';
    return parseFloat(rate).toFixed(2);
  };

  if (yieldLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentYield) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
        <p className="text-error-600">Asset not found or data unavailable.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{symbol} Yield Details</h1>
            <p className="mt-2 text-gray-600">
              {currentYield.protocol || 'Aave Protocol'} - 
              {currentYield.isAvailable ? ' Real-time yield tracking' : ' Protocol integration pending'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentYield.isAvailable ? (
              <>
                <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse" />
                <span className="text-sm text-success-600 font-medium">Live Updates</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-warning-500 rounded-full" />
                <span className="text-sm text-warning-600 font-medium">Coming Soon</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Current Stats */}
      {currentYield.isAvailable ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Supply APY</h3>
            <p className="text-3xl font-bold text-success-600">
              {formatAPY(currentYield.supplyAPY)}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Borrow APY</h3>
            <p className="text-3xl font-bold text-warning-600">
              {formatAPY(currentYield.borrowAPY)}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Utilization Rate</h3>
            <p className="text-3xl font-bold text-primary-600">
              {formatUtilization(currentYield.utilizationRate)}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Supply</h3>
            <p className="text-3xl font-bold text-gray-900">
              ${formatNumber(currentYield.totalSupply)}M
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-8 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentYield.statusMessage || 'Yield data not available'}
            </h3>
            <p className="text-gray-600">
              This asset is tracked and ready for yield data when protocol integration is complete.
            </p>
          </div>
        </div>
      )}

      {/* Timeframe Selector and Chart */}
      {currentYield.isAvailable ? (
        <>
          {/* Timeframe Selector */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
              {(['1h', '24h', '7d', '30d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {historyLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            </div>
          ) : (
            <YieldChart data={chartData} timeframe={timeframe} />
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Historical Data Coming Soon</h3>
            <p className="text-gray-600">
              Historical yield charts will be available when protocol integration is complete.
            </p>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(currentYield.lastUpdated).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Block Number</p>
            <p className="text-sm font-medium text-gray-900">
              {currentYield.blockNumber ? `#${currentYield.blockNumber.toLocaleString()}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Borrowed</p>
            <p className="text-sm font-medium text-gray-900">
              {currentYield.totalBorrow ? `$${formatNumber(currentYield.totalBorrow)}M` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Protocol</p>
            <p className="text-sm font-medium text-gray-900">
              {currentYield.protocol || 'Aave V3'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className={`text-sm font-medium ${
              currentYield.isAvailable ? 'text-success-600' : 'text-warning-600'
            }`}>
              {currentYield.isAvailable ? 'Active' : 'Coming Soon'}
            </p>
          </div>
          {!currentYield.isAvailable && currentYield.statusMessage && (
            <div>
              <p className="text-sm text-gray-500">Reason</p>
              <p className="text-sm font-medium text-gray-900">
                {currentYield.statusMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;