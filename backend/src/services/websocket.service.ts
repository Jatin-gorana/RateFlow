import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { WebSocketMessage, YieldData } from '../types';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Handle asset subscription
      socket.on('subscribe_asset', (assetSymbol: string) => {
        socket.join(`asset:${assetSymbol}`);
        logger.info(`Client ${socket.id} subscribed to ${assetSymbol}`);
      });

      // Handle asset unsubscription
      socket.on('unsubscribe_asset', (assetSymbol: string) => {
        socket.leave(`asset:${assetSymbol}`);
        logger.info(`Client ${socket.id} unsubscribed from ${assetSymbol}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public broadcastYieldUpdate(yieldData: YieldData): void {
    const message: WebSocketMessage = {
      type: 'YIELD_UPDATE',
      data: yieldData,
      timestamp: new Date()
    };

    // Broadcast to all clients subscribed to this asset
    this.io.to(`asset:${yieldData.symbol}`).emit('yield_update', message);
    
    // Also broadcast to general yield updates room
    this.io.emit('yield_update', message);
    
    logger.info(`Broadcasted yield update for ${yieldData.symbol}`);
  }

  public broadcastError(error: string): void {
    const message: WebSocketMessage = {
      type: 'ERROR',
      data: { error },
      timestamp: new Date()
    };

    this.io.emit('error', message);
  }

  public broadcastYieldAlert(alertMessage: any): void {
    this.io.emit('yield_alert', alertMessage);
    logger.info(`Broadcasted yield alert for ${alertMessage.data.asset}`);
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}