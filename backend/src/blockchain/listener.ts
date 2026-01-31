import { ethers } from 'ethers';
import { AaveDataService } from '../services/aave-data.service';
import { logger } from '../utils/logger';

// Aave V3 Pool contract ABI (minimal for ReserveDataUpdated event)
const AAVE_POOL_ABI = [
  "event ReserveDataUpdated(address indexed reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)"
];

const AAVE_V3_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'; // Ethereum mainnet

export async function startBlockchainListener(aaveService: AaveDataService): Promise<void> {
  try {
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key'
    );

    // Create contract instance
    const aavePool = new ethers.Contract(AAVE_V3_POOL_ADDRESS, AAVE_POOL_ABI, provider);

    logger.info('Starting Aave event listener...');

    // Listen for ReserveDataUpdated events
    aavePool.on('ReserveDataUpdated', async (
      reserve: string,
      liquidityRate: bigint,
      stableBorrowRate: bigint,
      variableBorrowRate: bigint,
      liquidityIndex: bigint,
      variableBorrowIndex: bigint,
      event: any
    ) => {
      logger.info(`ReserveDataUpdated event for ${reserve}`);
      
      await aaveService.processReserveUpdate({
        reserve,
        liquidityRate,
        stableBorrowRate,
        variableBorrowRate,
        liquidityIndex,
        variableBorrowIndex
      }, event.blockNumber);
    });

    // Handle provider errors
    provider.on('error', (error) => {
      logger.error('Provider error:', error);
    });

    // Periodic health check
    setInterval(async () => {
      try {
        const blockNumber = await provider.getBlockNumber();
        logger.debug(`Current block: ${blockNumber}`);
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, 60000); // Every minute

    logger.info('Blockchain listener started successfully');
  } catch (error) {
    logger.error('Failed to start blockchain listener:', error);
    throw error;
  }
}