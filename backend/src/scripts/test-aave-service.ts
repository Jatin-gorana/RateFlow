#!/usr/bin/env ts-node

/**
 * Test script for Aave V3 Service
 * 
 * This script tests the Aave V3 service independently
 * Run with: npx ts-node src/scripts/test-aave-service.ts
 */

import dotenv from 'dotenv';
import { AaveV3Service } from '../services/aave-v3.service';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testAaveService() {
  console.log('🚀 Testing Aave V3 Service...\n');

  // Initialize service
  const aaveService = new AaveV3Service({
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    pollingInterval: 30000, // 30 seconds for testing
    maxRetries: 3,
    retryDelay: 2000
  });

  try {
    // Test 1: Get service status
    console.log('📊 Service Status:');
    const status = aaveService.getStatus();
    console.log(JSON.stringify(status, null, 2));
    console.log('');

    // Test 2: Fetch yield data manually
    console.log('📈 Fetching current yield data...');
    const yieldData = await aaveService.fetchNow();
    
    console.log('✅ Successfully fetched yield data:');
    yieldData.forEach(data => {
      console.log(`\n${data.symbol}:`);
      console.log(`  Supply APY: ${data.supplyAPY.toFixed(4)}%`);
      console.log(`  Borrow APY: ${data.borrowAPY.toFixed(4)}%`);
      console.log(`  Utilization: ${data.utilizationRate.toFixed(2)}%`);
      console.log(`  Block: ${data.blockNumber}`);
      console.log(`  Updated: ${data.lastUpdated.toISOString()}`);
    });

    // Test 3: Start polling service for a short time
    console.log('\n🔄 Testing polling service (30 seconds)...');
    await aaveService.start();
    
    // Wait for 30 seconds to see polling in action
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Stop the service
    aaveService.stop();
    console.log('⏹️  Polling service stopped');

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  testAaveService().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}