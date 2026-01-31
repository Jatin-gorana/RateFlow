import { Router } from 'express';
import { SUPPORTED_ASSETS, APIResponse, Asset } from '../types';

export const assetsRouter = Router();

// GET /api/v1/assets - Get all supported assets
assetsRouter.get('/', (req, res) => {
  const assets: Asset[] = Object.values(SUPPORTED_ASSETS).map((asset, index) => ({
    id: index + 1,
    symbol: asset.symbol,
    address: asset.address,
    decimals: asset.decimals,
    name: asset.name,
    isActive: true
  }));

  const response: APIResponse<Asset[]> = {
    success: true,
    data: assets,
    timestamp: new Date()
  };

  res.json(response);
});

// GET /api/v1/assets/:symbol - Get specific asset info
assetsRouter.get('/:symbol', (req, res) => {
  const { symbol } = req.params;
  const asset = SUPPORTED_ASSETS[symbol.toUpperCase() as keyof typeof SUPPORTED_ASSETS];

  if (!asset) {
    return res.status(404).json({
      success: false,
      error: 'Asset not found',
      timestamp: new Date()
    });
  }

  const assetData: Asset = {
    id: 1, // Would be from database in real implementation
    symbol: asset.symbol,
    address: asset.address,
    decimals: asset.decimals,
    name: asset.name,
    isActive: true
  };

  const response: APIResponse<Asset> = {
    success: true,
    data: assetData,
    timestamp: new Date()
  };

  res.json(response);
});