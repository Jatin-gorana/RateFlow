import { ethers } from 'ethers';
import { db } from '../database/connection';
import { CacheService } from '../cache/redis';
import { WebSocketService } from './websocket.service';
import { YieldData, AaveReserveData, SUPPORTED_ASSETS } from '../types';
import { logger } from '../utils/logger';

export class AaveDataService {
  private wsService: WebSocketService;

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  public async processReserveUpdate(reserveData: AaveReserveData, blockNumber: number): Promise<void> {
    try {
      // Find which asset this reserve belongs to
      const asset = this.getAssetByAddress(reserveData.reserve);
      if (!asset) {
        logger.warn(`Unknown reserve address: ${reserveData.reserve}`);
        return;
      }

      // Calculate APY from rates
      const supplyAPY = this.calculateAPY(reserveData.liquidityRate);
      const borrowAPY = this.calculateAPY(reserveData.variableBorrowRate);

      // Get additional data (total supply, utilization, etc.)
      const additionalData = await this.getAdditionalReserveData(reserveData.reserve);

      const yieldData: YieldData = {
        assetId: 1, // Will be properly set from DB
        symbol: asset.symbol,
        supplyAPY: supplyAPY.toString(),
        borrowAPY: borrowAPY.toString(),
        utilizationRate: additionalData.utilizationRate,
        totalSupply: additionalData.totalSupply,
        totalBorrow: additionalData.totalBorrow,
        lastUpdated: new Date(),
        blockNumber
      };

      // Save to database
      await this.saveYieldData(yieldData);

      // Update cache
      await CacheService.setYieldData(asset.symbol, yieldData);

      // Broadcast via WebSocket
      this.wsService.broadcastYieldUpdate(yieldData);

      logger.info(`Processed yield update for ${asset.symbol}: ${supplyAPY}% APY`);
    } catch (error) {
      logger.error('Error processing reserve update:', error);
    }
  }

  private calculateAPY(rate: bigint): number {
    // Aave rates are in ray (1e27)
    const RAY = BigInt('1000000000000000000000000000');
    const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);
    
    // Convert to APY: ((1 + rate/RAY)^SECONDS_PER_YEAR - 1) * 100
    const ratePerSecond = Number(rate) / Number(RAY);
    const apy = (Math.pow(1 + ratePerSecond, Number(SECONDS_PER_YEAR)) - 1) * 100;
    
    return Math.round(apy * 10000) / 10000; // Round to 4 decimal places
  }

  private getAssetByAddress(address: string): typeof SUPPORTED_ASSETS[keyof typeof SUPPORTED_ASSETS] | null {
    return Object.values(SUPPORTED_ASSETS).find(asset => 
      asset.address.toLowerCase() === address.toLowerCase()
    ) || null;
  }

  private async getAdditionalReserveData(reserveAddress: string) {
    // This would typically fetch from Aave contracts
    // For now, return mock data
    return {
      utilizationRate: '75.50',
      totalSupply: '1000000.00',
      totalBorrow: '755000.00'
    };
  }

  private async saveYieldData(yieldData: YieldData): Promise<void> {
    try {
      // Update current yields table
      await db('current_yields')
        .insert({
          asset_symbol: yieldData.symbol,
          supply_apy: yieldData.supplyAPY,
          borrow_apy: yieldData.borrowAPY,
          utilization_rate: yieldData.utilizationRate,
          total_supply: yieldData.totalSupply,
          total_borrow: yieldData.totalBorrow,
          block_number: yieldData.blockNumber,
          last_updated: yieldData.lastUpdated
        })
        .onConflict('asset_symbol')
        .merge();

      // Insert into historical data
      await db('yield_history').insert({
        asset_symbol: yieldData.symbol,
        supply_apy: yieldData.supplyAPY,
        borrow_apy: yieldData.borrowAPY,
        block_number: yieldData.blockNumber,
        timestamp: yieldData.lastUpdated
      });
    } catch (error) {
      logger.error('Error saving yield data:', error);
      throw error;
    }
  }

  public async getCurrentYields(): Promise<YieldData[]> {
    try {
      const yields = await db('current_yields').select('*');
      return yields.map(row => ({
        assetId: row.id,
        symbol: row.asset_symbol,
        supplyAPY: row.supply_apy,
        borrowAPY: row.borrow_apy,
        utilizationRate: row.utilization_rate,
        totalSupply: row.total_supply,
        totalBorrow: row.total_borrow,
        lastUpdated: row.last_updated,
        blockNumber: row.block_number
      }));
    } catch (error) {
      logger.error('Error fetching current yields:', error);
      throw error;
    }
  }
}