import { Router } from 'express';
import { YieldManagerService } from '../services/yield-manager.service';
import { CacheService } from '../cache/redis';
import { db } from '../database/connection';
import { APIResponse, YieldData, HistoricalYield } from '../types';
import { logger } from '../utils/logger';

export const yieldsRouter = Router();

// We'll inject the yield manager service instance
let yieldManagerService: YieldManagerService;

// GET /api/v1/yields - Get current yields for all assets
yieldsRouter.get('/', async (req, res) => {
  try {
    const yields = await db('current_yields').select('*');
    
    const response: APIResponse<YieldData[]> = {
      success: true,
      data: yields.map(row => ({
        assetId: row.id,
        symbol: row.asset_symbol,
        supplyAPY: row.supply_apy,
        borrowAPY: row.borrow_apy,
        utilizationRate: row.utilization_rate,
        totalSupply: row.total_supply,
        totalBorrow: row.total_borrow,
        lastUpdated: row.last_updated,
        blockNumber: row.block_number
      })),
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching yields:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// GET /api/v1/yields/:symbol - Get current yield for specific asset
yieldsRouter.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Try cache first
    const cached = await CacheService.getYieldData(symbol.toUpperCase());
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        timestamp: new Date(),
        cached: true
      });
    }

    // Fetch from database
    const yield_ = await db('current_yields')
      .where('asset_symbol', symbol.toUpperCase())
      .first();

    if (!yield_) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found',
        timestamp: new Date()
      });
    }

    const yieldData: YieldData = {
      assetId: yield_.id,
      symbol: yield_.asset_symbol,
      supplyAPY: yield_.supply_apy,
      borrowAPY: yield_.borrow_apy,
      utilizationRate: yield_.utilization_rate,
      totalSupply: yield_.total_supply,
      totalBorrow: yield_.total_borrow,
      lastUpdated: yield_.last_updated,
      blockNumber: yield_.block_number
    };

    res.json({
      success: true,
      data: yieldData,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error fetching yield:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// GET /api/v1/yields/:symbol/history - Get historical yield data
yieldsRouter.get('/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = '100', offset = '0', timeframe = '24h' } = req.query;

    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeframe) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setDate(now.getDate() - 1);
    }

    const history = await db('yield_history')
      .where('asset_symbol', symbol.toUpperCase())
      .where('timestamp', '>=', startTime)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const response: APIResponse<HistoricalYield[]> = {
      success: true,
      data: history.map(row => ({
        id: row.id,
        assetId: row.asset_id,
        supplyAPY: row.supply_apy,
        borrowAPY: row.borrow_apy,
        timestamp: row.timestamp,
        blockNumber: row.block_number
      })),
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching yield history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Function to set the yield manager service instance
export function setYieldManagerService(service: YieldManagerService) {
  yieldManagerService = service;
}

// GET /api/v1/yields/fetch-now - Manually trigger data fetch (for testing)
yieldsRouter.post('/fetch-now', async (req, res) => {
  try {
    if (!yieldManagerService) {
      return res.status(503).json({
        success: false,
        error: 'Yield service not initialized',
        timestamp: new Date()
      });
    }

    const yieldInfos = await yieldManagerService.fetchNow();
    
    res.json({
      success: true,
      data: yieldInfos,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error in manual fetch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch yield data',
      timestamp: new Date()
    });
  }
});

// GET /api/v1/yields/status - Get service status
yieldsRouter.get('/status', (req, res) => {
  try {
    if (!yieldManagerService) {
      return res.status(503).json({
        success: false,
        error: 'Yield service not initialized',
        timestamp: new Date()
      });
    }

    const status = yieldManagerService.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      timestamp: new Date()
    });
  }
});