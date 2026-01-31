import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useWebSocket } from '../contexts/WebSocketContext';
import { apiService } from '../services/api';
import { YieldData, YieldRecommendation } from '../types';
import YieldCard from '../components/YieldCard';
import RecommendationCard from '../components/RecommendationCard';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
        <p className="text-error-600">Failed to load yield data. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Yield Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Real-time yield tracking for Aave protocol assets
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Assets</h3>
          <p className="text-3xl font-bold text-gray-900">{currentYields.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Supply APY</h3>
          <p className="text-3xl font-bold text-success-600">
            {currentYields.length > 0
              ? (
                  currentYields.reduce((sum, y) => sum + parseFloat(y.supplyAPY), 0) /
                  currentYields.length
                ).toFixed(2)
              : '0.00'}%
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Protocol</h3>
          <p className="text-3xl font-bold text-primary-600">Aave V3</p>
        </div>
      </div>

      {/* Recommendation Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Smart Recommendations
        </h2>
        <RecommendationCard 
          recommendation={currentRecommendation} 
          isLive={!!latestRecommendation}
        />
      </div>

      {/* Yield Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentYields.map((yieldData) => (
          <YieldCard
            key={yieldData.symbol}
            yieldData={yieldData}
            isLive={!!liveUpdates[yieldData.symbol]}
          />
        ))}
      </div>

      {currentYields.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No yield data available</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;