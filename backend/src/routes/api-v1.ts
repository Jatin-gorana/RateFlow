import { Router } from 'express';
import { yieldsRouter } from './yields';
import { assetsRouter } from './assets';
import { logger } from '../utils/logger';

export const apiV1Router = Router();

// Mount sub-routers
apiV1Router.use('/yields', yieldsRouter);
apiV1Router.use('/assets', assetsRouter);

// API root endpoint - provides API information
apiV1Router.get('/', (req, res) => {
  res.json({
    name: 'Web3 Yield Tracker API',
    version: '1.0.0',
    description: 'Real-time yield tracking for Aave protocol assets',
    documentation: '/api/v1/docs',
    endpoints: {
      assets: {
        list: 'GET /api/v1/assets',
        detail: 'GET /api/v1/assets/:symbol'
      },
      yields: {
        current: 'GET /api/v1/yields',
        asset: 'GET /api/v1/yields/:symbol',
        history: 'GET /api/v1/yields/:symbol/history',
        fetchNow: 'POST /api/v1/yields/fetch-now',
        status: 'GET /api/v1/yields/status'
      },
      websocket: {
        endpoint: '/socket.io',
        events: ['yield_update', 'yield_alert', 'error']
      }
    },
    supportedAssets: ['USDC', 'USDT'],
    protocols: ['Aave V3'],
    rateLimit: {
      requests: 100,
      window: '15 minutes'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
apiV1Router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint (serves the markdown as JSON)
apiV1Router.get('/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    documentation: {
      format: 'markdown',
      location: '/backend/API_DOCUMENTATION.md',
      online: 'https://github.com/your-repo/yield-tracker/blob/main/backend/API_DOCUMENTATION.md'
    },
    postmanCollection: '/api/v1/postman',
    openApiSpec: '/api/v1/openapi.json'
  });
});

// Postman collection endpoint
apiV1Router.get('/postman', (req, res) => {
  const postmanCollection = {
    info: {
      name: 'Web3 Yield Tracker API',
      description: 'Real-time yield tracking for Aave protocol',
      version: '1.0.0',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [
      {
        name: 'Assets',
        item: [
          {
            name: 'Get All Assets',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: '{{baseUrl}}/api/v1/assets',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'assets']
              }
            }
          },
          {
            name: 'Get Asset by Symbol',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: '{{baseUrl}}/api/v1/assets/USDC',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'assets', 'USDC']
              }
            }
          }
        ]
      },
      {
        name: 'Yields',
        item: [
          {
            name: 'Get Current Yields',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: '{{baseUrl}}/api/v1/yields',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'yields']
              }
            }
          },
          {
            name: 'Get Asset Yield',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: '{{baseUrl}}/api/v1/yields/USDC',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'yields', 'USDC']
              }
            }
          },
          {
            name: 'Get Yield History',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: '{{baseUrl}}/api/v1/yields/USDC/history?timeframe=24h&limit=100',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'yields', 'USDC', 'history'],
                query: [
                  { key: 'timeframe', value: '24h' },
                  { key: 'limit', value: '100' }
                ]
              }
            }
          },
          {
            name: 'Fetch Now',
            request: {
              method: 'POST',
              header: [],
              url: {
                raw: '{{baseUrl}}/api/v1/yields/fetch-now',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'yields', 'fetch-now']
              }
            }
          },
          {
            name: 'Get Service Status',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: '{{baseUrl}}/api/v1/yields/status',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'yields', 'status']
              }
            }
          }
        ]
      }
    ],
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3001',
        type: 'string'
      }
    ]
  };

  res.json(postmanCollection);
});

// OpenAPI specification endpoint
apiV1Router.get('/openapi.json', (req, res) => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Web3 Yield Tracker API',
      description: 'Real-time yield tracking for Aave protocol assets',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@yieldtracker.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server'
      }
    ],
    paths: {
      '/assets': {
        get: {
          summary: 'Get all supported assets',
          tags: ['Assets'],
          responses: {
            '200': {
              description: 'List of supported assets',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Asset' }
                      },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/assets/{symbol}': {
        get: {
          summary: 'Get asset by symbol',
          tags: ['Assets'],
          parameters: [
            {
              name: 'symbol',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'USDC'
            }
          ],
          responses: {
            '200': {
              description: 'Asset information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Asset' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Asset not found'
            }
          }
        }
      },
      '/yields': {
        get: {
          summary: 'Get current yields for all assets',
          tags: ['Yields'],
          responses: {
            '200': {
              description: 'Current yield data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/YieldData' }
                      },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/yields/{symbol}': {
        get: {
          summary: 'Get yield data for specific asset',
          tags: ['Yields'],
          parameters: [
            {
              name: 'symbol',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'USDC'
            }
          ],
          responses: {
            '200': {
              description: 'Asset yield data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/YieldData' },
                      timestamp: { type: 'string', format: 'date-time' },
                      cached: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'Asset not found'
            }
          }
        }
      },
      '/yields/{symbol}/history': {
        get: {
          summary: 'Get historical yield data',
          tags: ['Yields'],
          parameters: [
            {
              name: 'symbol',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'USDC'
            },
            {
              name: 'timeframe',
              in: 'query',
              schema: { 
                type: 'string',
                enum: ['1h', '24h', '7d', '30d'],
                default: '24h'
              }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { 
                type: 'integer',
                minimum: 1,
                maximum: 1000,
                default: 100
              }
            },
            {
              name: 'offset',
              in: 'query',
              schema: { 
                type: 'integer',
                minimum: 0,
                default: 0
              }
            }
          ],
          responses: {
            '200': {
              description: 'Historical yield data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/HistoricalYield' }
                      },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            symbol: { type: 'string' },
            address: { type: 'string' },
            decimals: { type: 'integer' },
            name: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        YieldData: {
          type: 'object',
          properties: {
            assetId: { type: 'integer' },
            symbol: { type: 'string' },
            supplyAPY: { type: 'string' },
            borrowAPY: { type: 'string' },
            utilizationRate: { type: 'string' },
            totalSupply: { type: 'string' },
            totalBorrow: { type: 'string' },
            lastUpdated: { type: 'string', format: 'date-time' },
            blockNumber: { type: 'integer' }
          }
        },
        HistoricalYield: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            assetId: { type: 'integer' },
            supplyAPY: { type: 'string' },
            borrowAPY: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            blockNumber: { type: 'integer' }
          }
        }
      }
    }
  };

  res.json(openApiSpec);
});

// Catch-all for undefined API routes
apiV1Router.use('*', (req, res) => {
  logger.warn(`API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    availableEndpoints: '/api/v1/',
    documentation: '/api/v1/docs',
    timestamp: new Date().toISOString()
  });
});

export default apiV1Router;