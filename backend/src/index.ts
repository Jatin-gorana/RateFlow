import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { YieldManagerService } from './services/yield-manager.service';
import { RealAaveService } from './services/real-aave.service';
import { YieldRecommendationService } from './services/yield-recommendation.service';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize services
const yieldManager = new YieldManagerService();
const aaveService = new RealAaveService();
const recommendationService = new YieldRecommendationService();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Real-time data cache
let currentYieldData: any[] = [];
let currentRecommendation: any = null;

// Fetch real Aave data
async function updateRealData() {
  try {
    console.log('Fetching real Aave data...');
    const data = await aaveService.getAllAssetData();
    currentYieldData = data;
    yieldManager.setCurrentData(data);
    
    // Generate recommendation
    currentRecommendation = recommendationService.analyzeYields(data);
    
    // Broadcast to WebSocket clients
    io.emit('yield_update', {
      type: 'YIELD_UPDATE',
      data: data[0], // USDC data
      timestamp: new Date().toISOString()
    });
    
    // Broadcast recommendation update
    io.emit('recommendation_update', {
      type: 'RECOMMENDATION_UPDATE',
      data: currentRecommendation,
      timestamp: new Date().toISOString()
    });
    
    console.log('Real Aave data updated:', data.map(d => `${d.symbol}: ${d.supplyAPY}%`));
    console.log('Recommendation:', currentRecommendation.bestYield.symbol, 'at', currentRecommendation.bestYield.supplyAPY.toFixed(3) + '%');
  } catch (error) {
    console.error('Error fetching real Aave data:', error);
  }
}

// API Routes with real data
app.get('/api/v1/recommendation', async (req, res) => {
  try {
    if (!currentRecommendation) {
      // Generate recommendation if not available
      if (currentYieldData.length === 0) {
        await updateRealData();
      } else {
        currentRecommendation = recommendationService.analyzeYields(currentYieldData);
      }
    }
    
    res.json({
      success: true,
      data: currentRecommendation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/v1/recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendation',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/yields', async (req, res) => {
  try {
    if (currentYieldData.length === 0) {
      await updateRealData();
    }
    
    res.json({
      success: true,
      data: currentYieldData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/v1/yields:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch yield data',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/yields/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (currentYieldData.length === 0) {
      await updateRealData();
    }
    
    const data = currentYieldData.find(d => d.symbol.toLowerCase() === symbol.toLowerCase());
    
    if (data) {
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Asset not found',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error(`Error in /api/v1/yields/${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset data',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/yields/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '24h' } = req.query;
    
    let hours = 24;
    switch (timeframe) {
      case '1h': hours = 1; break;
      case '24h': hours = 24; break;
      case '7d': hours = 168; break;
      case '30d': hours = 720; break;
    }
    
    const historyData = await aaveService.getHistoricalData(symbol.toUpperCase(), hours);
    
    res.json({
      success: true,
      data: historyData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error in /api/v1/yields/${req.params.symbol}/history:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical data',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/assets', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        symbol: 'USDC',
        address: '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505',
        decimals: 6,
        name: 'USD Coin',
        isActive: true
      },
      {
        id: 2,
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        name: 'Tether USD',
        isActive: true
      }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    aaveConnected: true,
    lastUpdate: currentYieldData.length > 0 ? currentYieldData[0].lastUpdated : null
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current data immediately
  if (currentYieldData.length > 0) {
    socket.emit('yield_update', {
      type: 'YIELD_UPDATE',
      data: currentYieldData[0],
      timestamp: new Date().toISOString()
    });
  }

  // Send current recommendation immediately
  if (currentRecommendation) {
    socket.emit('recommendation_update', {
      type: 'RECOMMENDATION_UPDATE',
      data: currentRecommendation,
      timestamp: new Date().toISOString()
    });
  }

  socket.on('subscribe_asset', (assetSymbol) => {
    socket.join(`asset:${assetSymbol}`);
    console.log(`Client ${socket.id} subscribed to ${assetSymbol}`);
  });

  socket.on('subscribe_recommendations', () => {
    socket.join('recommendations');
    console.log(`Client ${socket.id} subscribed to recommendations`);
  });

  socket.on('unsubscribe_asset', (assetSymbol) => {
    socket.leave(`asset:${assetSymbol}`);
    console.log(`Client ${socket.id} unsubscribed from ${assetSymbol}`);
  });

  socket.on('unsubscribe_recommendations', () => {
    socket.leave('recommendations');
    console.log(`Client ${socket.id} unsubscribed from recommendations`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

async function startServer() {
  try {
    await yieldManager.start();
    
    // Initial data fetch
    await updateRealData();
    
    // Update real data every 45 seconds
    setInterval(updateRealData, 45000);
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Using Alchemy RPC: ${process.env.ETHEREUM_RPC_URL?.substring(0, 50)}...`);
      console.log('🔗 WebSocket server ready');
      console.log('📈 Real-time Aave data enabled');
      console.log('Service status:', yieldManager.getStatus());
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();