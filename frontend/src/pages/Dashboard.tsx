import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useWebSocket } from '../contexts/WebSocketContext';
import { apiService } from '../services/api';
import { YieldData, YieldRecommendation } from '../types';
import YieldCard from '../components/YieldCard';
import RecommendationCard from '../components/RecommendationCard';
import HeroTicker from '../components/HeroTicker';

const Dashboard: React.FC = () => {
  const { latestYieldData, latestRecommendation, subscribeToAsset, subscribeToRecommendations } = useWebSocket();
  const [liveUpdates, setLiveUpdates] = useState<Record<string, YieldData>>({});
  const [currentRecommendation, setCurrentRecommendation] = useState<YieldRecommendation | null>(null);

  // Fetch initial yield data
  const { data: yields, isLoading, error } = useQuery(
    'current-yields',
    apiService.getCurrentYields,
    {
      refetchInterval: 30000, // Refetch every 30 seconds as fallback
    }
  );

  // Fetch initial recommendation
  const { data: recommendation } = useQuery(
    'recommendation',
    apiService.getRecommendation,
    {
      refetchInterval: 45000, // Refetch every 45 seconds as fallback
    }
  );

  // Subscribe to all assets for live updates
  useEffect(() => {
    if (yields) {
      yields.forEach(yieldData => {
        subscribeToAsset(yieldData.symbol);
      });
    }
    // Subscribe to recommendations
    subscribeToRecommendations();
  }, [yields, subscribeToAsset, subscribeToRecommendations]);

  // Handle live updates
  useEffect(() => {
    if (latestYieldData) {
      setLiveUpdates(prev => ({
        ...prev,
        [latestYieldData.symbol]: latestYieldData
      }));
    }
  }, [latestYieldData]);

  // Handle live recommendation updates
  useEffect(() => {
    if (latestRecommendation) {
      setCurrentRecommendation(latestRecommendation);
    } else if (recommendation) {
      setCurrentRecommendation(recommendation);
    }
  }, [latestRecommendation, recommendation]);

  // Merge initial data with live updates
  const currentYields = yields?.map(yieldData => {
    const liveUpdate = liveUpdates[yieldData.symbol];
    return liveUpdate || yieldData;
  }) || [];

  // Separate active and tracked assets
  const activeAssets = currentYields.filter(y => y.isAvailable);
  const trackedAssets = currentYields.filter(y => !y.isAvailable);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 font-ui">
        {/* FIXED: Added proper container wrapper */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Skeleton */}
          <div className="skeleton h-32 rounded-xl mb-8"></div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6">
                <div className="skeleton h-4 w-20 mb-2"></div>
                <div className="skeleton h-8 w-16"></div>
              </div>
            ))}
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6">
                <div className="skeleton h-48 w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 font-ui flex items-center justify-center">
        {/* FIXED: Added proper container wrapper */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
              <p className="text-zinc-400">Failed to load yield data. Please refresh to try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-ui custom-scrollbar">
      {/* FIXED: Added proper container wrapper matching Detail page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-ui text-4xl font-bold text-white">
              Rate<span className="text-emerald-500">Flow</span>
            </h1>
            <div className="flex items-center space-x-2 text-zinc-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full live-dot"></div>
              <span className="font-ui text-sm">Real-time Intelligence</span>
            </div>
          </div>
          <p className="font-ui text-zinc-400 text-lg">
            Institutional-grade yield tracking across DeFi protocols
          </p>
        </div>

        {/* Hero Ticker - Best Yield Display */}
        <HeroTicker yields={currentYields} isLive={!!latestYieldData} />

        {/* FIXED: Summary Stats with consistent dark cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 transition-colors duration-200 rounded-xl p-4 md:p-6 hover-lift">
            <h3 className="font-ui text-sm font-medium text-zinc-400 mb-2">Total Assets</h3>
            <p className="font-mono text-2xl md:text-3xl font-bold text-white tracking-tight">{currentYields.length}</p>
            <div className="flex items-center mt-1">
              <span className="font-ui text-xs text-zinc-500">{activeAssets.length} active</span>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 transition-colors duration-200 rounded-xl p-4 md:p-6 hover-lift">
            <h3 className="font-ui text-sm font-medium text-zinc-400 mb-2">Active Protocols</h3>
            <p className="font-mono text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">
              {new Set(activeAssets.map(y => y.protocol)).size}
            </p>
            <div className="flex items-center mt-1">
              <span className="font-ui text-xs text-zinc-500">Live data</span>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 transition-colors duration-200 rounded-xl p-4 md:p-6 hover-lift">
            <h3 className="font-ui text-sm font-medium text-zinc-400 mb-2">Avg Supply APY</h3>
            <p className="font-mono text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">
              {activeAssets.length > 0
                ? (
                    activeAssets
                      .filter(y => y.supplyAPY)
                      .reduce((sum, y) => sum + parseFloat(y.supplyAPY!), 0) /
                    activeAssets.filter(y => y.supplyAPY).length
                  ).toFixed(2)
                : '0.00'}%
            </p>
            <div className="flex items-center mt-1">
              <span className="font-ui text-xs text-zinc-500">Weighted average</span>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 transition-colors duration-200 rounded-xl p-4 md:p-6 hover-lift">
            <h3 className="font-ui text-sm font-medium text-zinc-400 mb-2">Coming Soon</h3>
            <p className="font-mono text-2xl md:text-3xl font-bold text-amber-400 tracking-tight">
              {trackedAssets.length}
            </p>
            <div className="flex items-center mt-1">
              <span className="font-ui text-xs text-zinc-500">Protocols pending</span>
            </div>
          </div>
        </div>

        {/* Smart Recommendations */}
        {currentRecommendation && (
          <div className="mb-8">
            <h2 className="font-ui text-xl font-semibold text-white mb-4 flex items-center">
              <span className="w-2 h-2 bg-violet-500 rounded-full mr-3"></span>
              Smart Recommendations
            </h2>
            <RecommendationCard 
              recommendation={currentRecommendation} 
              isLive={!!latestRecommendation}
            />
          </div>
        )}

        {/* Active Assets Section */}
        {activeAssets.length > 0 && (
          <div className="mb-8">
            <h2 className="font-ui text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3 live-dot"></span>
              Live Assets
              <span className="ml-2 px-2 py-1 bg-emerald-400/10 text-emerald-400 text-xs rounded-full border border-emerald-400/20">
                {activeAssets.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAssets.map((yieldData) => (
                <YieldCard
                  key={yieldData.symbol}
                  yieldData={yieldData}
                  isLive={!!liveUpdates[yieldData.symbol]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tracked Assets Section */}
        {trackedAssets.length > 0 && (
          <div className="mb-8">
            <h2 className="font-ui text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
              Coming Soon
              <span className="ml-2 px-2 py-1 bg-amber-400/10 text-amber-400 text-xs rounded-full border border-amber-400/20">
                {trackedAssets.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackedAssets.map((yieldData) => (
                <YieldCard
                  key={yieldData.symbol}
                  yieldData={yieldData}
                  isLive={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {currentYields.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-ui text-xl font-semibold text-white mb-2">No Yield Data Available</h3>
            <p className="font-ui text-zinc-400 max-w-md mx-auto">
              We're working on connecting to yield protocols. Check back soon for real-time yield intelligence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;