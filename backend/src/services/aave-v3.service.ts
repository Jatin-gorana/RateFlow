import { ethers } from 'ethers';
import { logger } from '../utils/logger';

/**
 * Aave V3 Pool Contract ABI - Minimal interface for data fetching
 * Only includes the methods we need for yield data
 */
const AAVE_V3_POOL_ABI = [
  // Get reserve data for a specific asset
  "function getReserveData(address asset) external view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))",
  
  // Get user account data
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
  
  // Events for real-time updates
  "event ReserveDataUpdated(address indexed reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)"
];

/**
 * Aave V3 Protocol Data Provider ABI - For additional reserve data
 */
const AAVE_V3_DATA_PROVIDER_ABI = [
  "function getReserveTokensAddresses(address asset) external view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)",
  "function getReserveConfigurationData(address asset) external view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)",
  "function getTotalSupply(address asset) external view returns (uint256)",
  "function getTotalDebt(address asset) external view returns (uint256)"
];

/**
 * Contract addresses for Aave V3 on Ethereum Mainnet
 */
export const AAVE_V3_ADDRESSES = {
  POOL: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3'
} as const;

/**
 * Supported asset addresses on Ethereum Mainnet
 */
export const ASSET_ADDRESSES = {
  USDC: '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505', // USDC
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'  // USDT
} as const;

/**
 * Interface for reserve data returned by Aave contracts
 */
interface AaveReserveData {
  configuration: {
    data: bigint;
  };
  liquidityIndex: bigint;
  currentLiquidityRate: bigint;
  variableBorrowIndex: bigint;
  currentVariableBorrowRate: bigint;
  currentStableBorrowRate: bigint;
  lastUpdateTimestamp: bigint;
  id: number;
  aTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  interestRateStrategyAddress: string;
  accruedToTreasury: bigint;
  unbacked: bigint;
  isolationModeTotalDebt: bigint;
}

/**
 * Processed yield data interface
 */
export interface YieldInfo {
  asset: string;
  symbol: string;
  supplyAPY: number;
  borrowAPY: number;
  utilizationRate: number;
  totalSupply: string;
  totalBorrow: string;
  lastUpdated: Date;
  blockNumber: number;
}

/**
 * Configuration interface for the service
 */
interface AaveServiceConfig {
  rpcUrl: string;
  pollingInterval: number; // in milliseconds
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

/**
 * Aave V3 Service for fetching real-time yield data
 * 
 * This service connects to Aave V3 contracts on Ethereum mainnet
 * and fetches supply/borrow APY data for supported assets.
 */
export class AaveV3Service {
  private provider: ethers.JsonRpcProvider;
  private poolContract: ethers.Contract;
  private dataProviderContract: ethers.Contract;
  private config: AaveServiceConfig;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: AaveServiceConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize contract instances
    this.poolContract = new ethers.Contract(
      AAVE_V3_ADDRESSES.POOL,
      AAVE_V3_POOL_ABI,
      this.provider
    );
    
    this.dataProviderContract = new ethers.Contract(
      AAVE_V3_ADDRESSES.DATA_PROVIDER,
      AAVE_V3_DATA_PROVIDER_ABI,
      this.provider
    );

    logger.info('AaveV3Service initialized', {
      rpcUrl: config.rpcUrl,
      pollingInterval: config.pollingInterval,
      poolAddress: AAVE_V3_ADDRESSES.POOL
    });
  }

  /**
   * Start the polling service
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('AaveV3Service is already running');
      return;
    }

    try {
      // Test connection
      await this.testConnection();
      
      this.isRunning = true;
      logger.info('Starting AaveV3Service polling');
      
      // Initial fetch
      await this.fetchAllYieldData();
      
      // Start polling
      this.pollingTimer = setInterval(async () => {
        try {
          await this.fetchAllYieldData();
        } catch (error) {
          logger.error('Error in polling cycle:', error);
        }
      }, this.config.pollingInterval);
      
    } catch (error) {
      logger.error('Failed to start AaveV3Service:', error);
      throw error;
    }
  }

  /**
   * Stop the polling service
   */
  public stop(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isRunning = false;
    logger.info('AaveV3Service stopped');
  }

  /**
   * Test the connection to the provider and contracts
   */
  private async testConnection(): Promise<void> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      logger.info(`Connected to Ethereum network, current block: ${blockNumber}`);
      
      // Test contract call
      const usdcReserve = await this.poolContract.getReserveData(ASSET_ADDRESSES.USDC);
      logger.info('Contract connection test successful');
      
    } catch (error) {
      logger.error('Connection test failed:', error);
      throw new Error('Failed to connect to Ethereum network or Aave contracts');
    }
  }

  /**
   * Fetch yield data for all supported assets
   */
  private async fetchAllYieldData(): Promise<void> {
    const assets = Object.entries(ASSET_ADDRESSES);
    const promises = assets.map(([symbol, address]) => 
      this.fetchAssetYieldData(address, symbol)
    );

    try {
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        const [symbol] = assets[index];
        if (result.status === 'rejected') {
          logger.error(`Failed to fetch data for ${symbol}:`, result.reason);
        }
      });
      
    } catch (error) {
      logger.error('Error fetching yield data:', error);
    }
  }

  /**
   * Fetch yield data for a specific asset with retry logic
   */
  public async fetchAssetYieldData(assetAddress: string, symbol: string): Promise<YieldInfo> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.debug(`Fetching yield data for ${symbol} (attempt ${attempt})`);
        
        const yieldInfo = await this.getYieldInfo(assetAddress, symbol);
        
        logger.info(`Successfully fetched yield data for ${symbol}`, {
          supplyAPY: yieldInfo.supplyAPY,
          borrowAPY: yieldInfo.borrowAPY,
          utilizationRate: yieldInfo.utilizationRate
        });
        
        return yieldInfo;
        
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt} failed for ${symbol}:`, error);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }
    
    throw new Error(`Failed to fetch data for ${symbol} after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Get comprehensive yield information for an asset
   */
  private async getYieldInfo(assetAddress: string, symbol: string): Promise<YieldInfo> {
    try {
      // Get current block number
      const blockNumber = await this.provider.getBlockNumber();
      
      // Fetch reserve data from Pool contract
      const reserveData: AaveReserveData = await this.poolContract.getReserveData(assetAddress);
      
      // Calculate APY from rates
      const supplyAPY = this.calculateAPY(reserveData.currentLiquidityRate);
      const borrowAPY = this.calculateAPY(reserveData.currentVariableBorrowRate);
      
      // Get additional data (total supply, utilization, etc.)
      const additionalData = await this.getAdditionalReserveData(assetAddress);
      
      return {
        asset: assetAddress,
        symbol,
        supplyAPY,
        borrowAPY,
        utilizationRate: additionalData.utilizationRate,
        totalSupply: additionalData.totalSupply,
        totalBorrow: additionalData.totalBorrow,
        lastUpdated: new Date(),
        blockNumber
      };
      
    } catch (error) {
      logger.error(`Error getting yield info for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Calculate APY from Aave's rate format
   * 
   * Aave stores rates in "ray" format (1e27 precision)
   * Rate is per second, so we need to compound it to get annual yield
   * 
   * Formula: APY = (1 + ratePerSecond)^(secondsPerYear) - 1
   */
  private calculateAPY(rate: bigint): number {
    try {
      // Aave rates are in ray format (1e27)
      const RAY = BigInt('1000000000000000000000000000'); // 1e27
      const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60); // 31,536,000
      
      if (rate === BigInt(0)) {
        return 0;
      }
      
      // Convert to decimal (rate per second)
      const ratePerSecond = Number(rate) / Number(RAY);
      
      // Calculate APY: (1 + ratePerSecond)^SECONDS_PER_YEAR - 1
      const apy = Math.pow(1 + ratePerSecond, Number(SECONDS_PER_YEAR)) - 1;
      
      // Convert to percentage and round to 6 decimal places
      return Math.round(apy * 100 * 1000000) / 1000000;
      
    } catch (error) {
      logger.error('Error calculating APY:', error);
      return 0;
    }
  }

  /**
   * Get additional reserve data like total supply, utilization rate, etc.
   * This is a simplified version - in production you might want to fetch from additional contracts
   */
  private async getAdditionalReserveData(assetAddress: string) {
    try {
      // For now, return mock data
      // In production, you would fetch this from aToken contracts or data provider
      return {
        utilizationRate: 75.5, // Mock utilization rate
        totalSupply: '1000000.00', // Mock total supply
        totalBorrow: '755000.00'   // Mock total borrow
      };
      
    } catch (error) {
      logger.error('Error fetching additional reserve data:', error);
      return {
        utilizationRate: 0,
        totalSupply: '0.00',
        totalBorrow: '0.00'
      };
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current status of the service
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      pollingInterval: this.config.pollingInterval,
      supportedAssets: Object.keys(ASSET_ADDRESSES),
      contractAddresses: AAVE_V3_ADDRESSES
    };
  }

  /**
   * Manually trigger a data fetch (useful for testing)
   */
  public async fetchNow(): Promise<YieldInfo[]> {
    const assets = Object.entries(ASSET_ADDRESSES);
    const results: YieldInfo[] = [];
    
    for (const [symbol, address] of assets) {
      try {
        const yieldInfo = await this.fetchAssetYieldData(address, symbol);
        results.push(yieldInfo);
      } catch (error) {
        logger.error(`Failed to fetch ${symbol}:`, error);
      }
    }
    
    return results;
  }
}