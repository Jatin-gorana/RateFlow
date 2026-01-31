import axios from 'axios';
import { APIResponse, Asset, YieldData, HistoricalYield, YieldRecommendation } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Assets
  async getAssets(): Promise<Asset[]> {
    const response = await api.get<APIResponse<Asset[]>>('/assets');
    return response.data.data || [];
  },

  async getAsset(symbol: string): Promise<Asset> {
    const response = await api.get<APIResponse<Asset>>(`/assets/${symbol}`);
    if (!response.data.data) {
      throw new Error('Asset not found');
    }
    return response.data.data;
  },

  // Yields
  async getCurrentYields(): Promise<YieldData[]> {
    const response = await api.get<APIResponse<YieldData[]>>('/yields');
    return response.data.data || [];
  },

  async getAssetYield(symbol: string): Promise<YieldData> {
    const response = await api.get<APIResponse<YieldData>>(`/yields/${symbol}`);
    if (!response.data.data) {
      throw new Error('Yield data not found');
    }
    return response.data.data;
  },

  async getYieldHistory(
    symbol: string,
    timeframe: '1h' | '24h' | '7d' | '30d' = '24h',
    limit: number = 100
  ): Promise<HistoricalYield[]> {
    const response = await api.get<APIResponse<HistoricalYield[]>>(
      `/yields/${symbol}/history`,
      {
        params: { timeframe, limit }
      }
    );
    return response.data.data || [];
  },

  // Recommendations
  async getRecommendation(): Promise<YieldRecommendation> {
    const response = await api.get<APIResponse<YieldRecommendation>>('/recommendation');
    if (!response.data.data) {
      throw new Error('Recommendation not available');
    }
    return response.data.data;
  },
};

export default apiService;