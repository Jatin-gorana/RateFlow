import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useWebSocket } from '../contexts/WebSocketContext';
import { apiService } from '../services/api';
import { YieldData, ChartDataPoint } from '../types';
import YieldChart from '../components/YieldChart';
import MetricCard from '../components/MetricCard';

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
    return parseFloat(apy).toFixed(3) + '%';
  };

  const formatNumber = (num: string | null) => {
    if (num === null) return 'N/A';
    const value = parseFloat(num);
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatUtilization = (rate: string | null) => {
    if (rate === null) return 'N/A';
    return parseFloat(rate).toFixed(1) + '%';
  };

  if (yieldLoading) {
    return (
      <div className="bg-zinc-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="skeleton h-8 w-64 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="institutional-card rounded-xl p-6">
                <div className="skeleton h-32 w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentYield) {
    return (
      <div className="bg-zinc-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="institutional-card rounded-xl p-8 border-red-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Asset Not Found</h3>
              <p className="text-zinc-400">The requested asset data is not available.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-violet-400 hover:text-violet-300 mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {symbol} <span className="text-zinc-500">Yield Analytics</span>
              </h1>
              <p className="text-zinc-400 text-lg">
                {currentYield.protocol || 'Aave Protocol'} • 
                {currentYield.isAvailable ? ' Live Data Stream' : ' Integration Pending'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentYield.isAvailable ? (
                <div className="status-live px-4 py-2 rounded-lg flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full live-dot"></div>
                  <span className="font-ui text-sm font-medium">Live Data</span>
                </div>
              ) : (
                <div className="status-pending px-4 py-2 rounded-lg flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span className="font-ui text-sm font-medium">Coming Soon</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric Cards - Consistent Dark Theme */}
        {currentYield.isAvailable ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard
              label="Supply APY"
              value={formatAPY(currentYield.supplyAPY)}
              type="yield"
              isLive={!!latestYieldData}
            />
            
            <MetricCard
              label="Borrow APY"
              value={formatAPY(currentYield.borrowAPY)}
              type="warning"
            />
            
            <MetricCard
              label="Utilization Rate"
              value={formatUtilization(currentYield.utilizationRate)}
              type="brand"
            />
            
            <MetricCard
              label="Total Supply"
              value={formatNumber(currentYield.totalSupply)}
              subValue="Market Liquidity"
            />
          </div>
        ) : (
          <div className="institutional-card rounded-xl p-12 mb-8 text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Protocol Integration Pending
            </h3>
            <p className="text-zinc-400 text-lg max-w-md mx-auto">
              {currentYield.statusMessage || 'This asset is tracked and ready for yield data when protocol integration is complete.'}
            </p>
          </div>
        )}

        {/* Chart Section */}
        {currentYield.isAvailable ? (
          <>
            {/* Timeframe Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Historical Performance</h2>
                <div className="flex space-x-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                  {(['1h', '24h', '7d', '30d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-4 py-2 rounded-md text-sm font-medium font-mono transition-all duration-200 ${
                        timeframe === tf
                          ? 'bg-violet-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Container */}
            {historyLoading ? (
              <div className="institutional-card rounded-xl p-6 mb-8">
                <div className="flex items-center justify-center h-80">
                  <div className="skeleton h-64 w-full rounded"></div>
                </div>
              </div>
            ) : (
              <div className="institutional-card rounded-xl p-6 mb-8">
                <YieldChart data={chartData} timeframe={timeframe} />
              </div>
            )}
          </>
        ) : (
          <div className="institutional-card rounded-xl p-8 mb-8">
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-white mb-2">Historical Data Coming Soon</h3>
              <p className="text-zinc-400">
                Historical yield charts will be available when protocol integration is complete.
              </p>
            </div>
          </div>
        )}

        {/* Asset Information */}
        <div className="institutional-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Asset Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="font-ui text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-2">
                Last Updated
              </span>
              <span className="font-mono text-white text-lg">
                {new Date(currentYield.lastUpdated).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-ui text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-2">
                Block Number
              </span>
              <span className="font-mono text-white text-lg">
                {currentYield.blockNumber ? `#${currentYield.blockNumber.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-ui text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-2">
                Protocol Status
              </span>
              <span className={`font-ui text-lg font-medium ${
                currentYield.isAvailable ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {currentYield.isAvailable ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>
          
          {!currentYield.isAvailable && currentYield.statusMessage && (
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <span className="font-ui text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-2">
                Status Details
              </span>
              <p className="font-ui text-zinc-300">
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