import { AaveV3Service, ASSET_ADDRESSES, AAVE_V3_ADDRESSES } from '../services/aave-v3.service';
import { ethers } from 'ethers';

// Mock ethers.js
jest.mock('ethers');

describe('AaveV3Service', () => {
  let aaveService: AaveV3Service;
  let mockProvider: jest.Mocked<ethers.JsonRpcProvider>;
  let mockContract: jest.Mocked<ethers.Contract>;

  beforeEach(() => {
    // Mock provider
    mockProvider = {
      getBlockNumber: jest.fn(),
    } as any;

    // Mock contract
    mockContract = {
      getReserveData: jest.fn(),
    } as any;

    // Mock ethers constructors
    (ethers.JsonRpcProvider as jest.Mock).mockReturnValue(mockProvider);
    (ethers.Contract as jest.Mock).mockReturnValue(mockContract);

    aaveService = new AaveV3Service({
      rpcUrl: 'https://test-rpc-url',
      pollingInterval: 30000,
      maxRetries: 3,
      retryDelay: 1000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    aaveService.stop();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      const status = aaveService.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.pollingInterval).toBe(30000);
      expect(status.supportedAssets).toEqual(['USDC', 'USDT']);
      expect(status.contractAddresses).toEqual(AAVE_V3_ADDRESSES);
    });

    it('should create provider and contracts with correct parameters', () => {
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://test-rpc-url');
      expect(ethers.Contract).toHaveBeenCalledTimes(2); // Pool and DataProvider contracts
    });
  });

  describe('APY calculation', () => {
    it('should calculate APY correctly from ray format', async () => {
      // Mock reserve data with known values
      const mockReserveData = {
        currentLiquidityRate: BigInt('39420077107309470000000000'), // ~4% APY in ray format
        currentVariableBorrowRate: BigInt('52560102809745960000000000'), // ~5.4% APY in ray format
        liquidityIndex: BigInt('1000000000000000000000000000'),
        variableBorrowIndex: BigInt('1000000000000000000000000000'),
        lastUpdateTimestamp: BigInt(Date.now() / 1000),
        id: 1,
        aTokenAddress: '0x123',
        stableDebtTokenAddress: '0x456',
        variableDebtTokenAddress: '0x789',
        interestRateStrategyAddress: '0xabc',
        accruedToTreasury: BigInt(0),
        unbacked: BigInt(0),
        isolationModeTotalDebt: BigInt(0),
        configuration: { data: BigInt(0) }
      };

      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData.mockResolvedValue(mockReserveData);

      const yieldInfo = await aaveService.fetchAssetYieldData(ASSET_ADDRESSES.USDC, 'USDC');

      expect(yieldInfo.symbol).toBe('USDC');
      expect(yieldInfo.supplyAPY).toBeCloseTo(4.0, 0); // Should be around 4%
      expect(yieldInfo.borrowAPY).toBeCloseTo(5.4, 0); // Should be around 5.4%
      expect(yieldInfo.blockNumber).toBe(19234567);
    });

    it('should handle zero rates correctly', async () => {
      const mockReserveData = {
        currentLiquidityRate: BigInt(0),
        currentVariableBorrowRate: BigInt(0),
        liquidityIndex: BigInt('1000000000000000000000000000'),
        variableBorrowIndex: BigInt('1000000000000000000000000000'),
        lastUpdateTimestamp: BigInt(Date.now() / 1000),
        id: 1,
        aTokenAddress: '0x123',
        stableDebtTokenAddress: '0x456',
        variableDebtTokenAddress: '0x789',
        interestRateStrategyAddress: '0xabc',
        accruedToTreasury: BigInt(0),
        unbacked: BigInt(0),
        isolationModeTotalDebt: BigInt(0),
        configuration: { data: BigInt(0) }
      };

      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData.mockResolvedValue(mockReserveData);

      const yieldInfo = await aaveService.fetchAssetYieldData(ASSET_ADDRESSES.USDC, 'USDC');

      expect(yieldInfo.supplyAPY).toBe(0);
      expect(yieldInfo.borrowAPY).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should retry on network errors', async () => {
      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          currentLiquidityRate: BigInt('39420077107309470000000000'),
          currentVariableBorrowRate: BigInt('52560102809745960000000000'),
          liquidityIndex: BigInt('1000000000000000000000000000'),
          variableBorrowIndex: BigInt('1000000000000000000000000000'),
          lastUpdateTimestamp: BigInt(Date.now() / 1000),
          id: 1,
          aTokenAddress: '0x123',
          stableDebtTokenAddress: '0x456',
          variableDebtTokenAddress: '0x789',
          interestRateStrategyAddress: '0xabc',
          accruedToTreasury: BigInt(0),
          unbacked: BigInt(0),
          isolationModeTotalDebt: BigInt(0),
          configuration: { data: BigInt(0) }
        });

      const yieldInfo = await aaveService.fetchAssetYieldData(ASSET_ADDRESSES.USDC, 'USDC');

      expect(mockContract.getReserveData).toHaveBeenCalledTimes(3);
      expect(yieldInfo.symbol).toBe('USDC');
    });

    it('should throw error after max retries', async () => {
      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData.mockRejectedValue(new Error('Persistent network error'));

      await expect(
        aaveService.fetchAssetYieldData(ASSET_ADDRESSES.USDC, 'USDC')
      ).rejects.toThrow('Failed to fetch data for USDC after 3 attempts');

      expect(mockContract.getReserveData).toHaveBeenCalledTimes(3);
    });

    it('should handle connection test failures', async () => {
      mockProvider.getBlockNumber.mockRejectedValue(new Error('Connection failed'));

      await expect(aaveService.start()).rejects.toThrow('Failed to connect to Ethereum network or Aave contracts');
    });
  });

  describe('service lifecycle', () => {
    it('should start and stop correctly', async () => {
      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData.mockResolvedValue({
        currentLiquidityRate: BigInt('39420077107309470000000000'),
        currentVariableBorrowRate: BigInt('52560102809745960000000000'),
        liquidityIndex: BigInt('1000000000000000000000000000'),
        variableBorrowIndex: BigInt('1000000000000000000000000000'),
        lastUpdateTimestamp: BigInt(Date.now() / 1000),
        id: 1,
        aTokenAddress: '0x123',
        stableDebtTokenAddress: '0x456',
        variableDebtTokenAddress: '0x789',
        interestRateStrategyAddress: '0xabc',
        accruedToTreasury: BigInt(0),
        unbacked: BigInt(0),
        isolationModeTotalDebt: BigInt(0),
        configuration: { data: BigInt(0) }
      });

      await aaveService.start();
      expect(aaveService.getStatus().isRunning).toBe(true);

      aaveService.stop();
      expect(aaveService.getStatus().isRunning).toBe(false);
    });

    it('should not start if already running', async () => {
      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData.mockResolvedValue({
        currentLiquidityRate: BigInt('39420077107309470000000000'),
        currentVariableBorrowRate: BigInt('52560102809745960000000000'),
        liquidityIndex: BigInt('1000000000000000000000000000'),
        variableBorrowIndex: BigInt('1000000000000000000000000000'),
        lastUpdateTimestamp: BigInt(Date.now() / 1000),
        id: 1,
        aTokenAddress: '0x123',
        stableDebtTokenAddress: '0x456',
        variableDebtTokenAddress: '0x789',
        interestRateStrategyAddress: '0xabc',
        accruedToTreasury: BigInt(0),
        unbacked: BigInt(0),
        isolationModeTotalDebt: BigInt(0),
        configuration: { data: BigInt(0) }
      });

      await aaveService.start();
      
      // Should not throw or cause issues
      await aaveService.start();
      
      expect(aaveService.getStatus().isRunning).toBe(true);
    });
  });

  describe('manual fetch', () => {
    it('should fetch data for all supported assets', async () => {
      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData.mockResolvedValue({
        currentLiquidityRate: BigInt('39420077107309470000000000'),
        currentVariableBorrowRate: BigInt('52560102809745960000000000'),
        liquidityIndex: BigInt('1000000000000000000000000000'),
        variableBorrowIndex: BigInt('1000000000000000000000000000'),
        lastUpdateTimestamp: BigInt(Date.now() / 1000),
        id: 1,
        aTokenAddress: '0x123',
        stableDebtTokenAddress: '0x456',
        variableDebtTokenAddress: '0x789',
        interestRateStrategyAddress: '0xabc',
        accruedToTreasury: BigInt(0),
        unbacked: BigInt(0),
        isolationModeTotalDebt: BigInt(0),
        configuration: { data: BigInt(0) }
      });

      const results = await aaveService.fetchNow();

      expect(results).toHaveLength(2); // USDC and USDT
      expect(results[0].symbol).toBe('USDC');
      expect(results[1].symbol).toBe('USDT');
      expect(mockContract.getReserveData).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      mockProvider.getBlockNumber.mockResolvedValue(19234567);
      mockContract.getReserveData
        .mockResolvedValueOnce({
          currentLiquidityRate: BigInt('39420077107309470000000000'),
          currentVariableBorrowRate: BigInt('52560102809745960000000000'),
          liquidityIndex: BigInt('1000000000000000000000000000'),
          variableBorrowIndex: BigInt('1000000000000000000000000000'),
          lastUpdateTimestamp: BigInt(Date.now() / 1000),
          id: 1,
          aTokenAddress: '0x123',
          stableDebtTokenAddress: '0x456',
          variableDebtTokenAddress: '0x789',
          interestRateStrategyAddress: '0xabc',
          accruedToTreasury: BigInt(0),
          unbacked: BigInt(0),
          isolationModeTotalDebt: BigInt(0),
          configuration: { data: BigInt(0) }
        })
        .mockRejectedValue(new Error('Failed to fetch USDT'));

      const results = await aaveService.fetchNow();

      expect(results).toHaveLength(1); // Only USDC succeeded
      expect(results[0].symbol).toBe('USDC');
    });
  });
});