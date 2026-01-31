import { Router } from 'express';
import { yieldsRouter, setYieldManagerService } from './yields';
import { assetsRouter } from './assets';
import apiV1Router from './api-v1';

export const apiRoutes = Router();
export { setYieldManagerService };

// Mount API v1 routes
apiRoutes.use('/v1', apiV1Router);