import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, YieldData, YieldRecommendation } from '../types';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestYieldData: YieldData | null;
  latestRecommendation: YieldRecommendation | null;
  subscribeToAsset: (symbol: string) => void;
  unsubscribeFromAsset: (symbol: string) => void;
  subscribeToRecommendations: () => void;
  unsubscribeFromRecommendations: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestYieldData, setLatestYieldData] = useState<YieldData | null>(null);
  const [latestRecommendation, setLatestRecommendation] = useState<YieldRecommendation | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('yield_update', (message: WebSocketMessage) => {
      console.log('Received yield update:', message);
      if (message.type === 'YIELD_UPDATE') {
        setLatestYieldData(message.data);
      }
    });

    newSocket.on('recommendation_update', (message: WebSocketMessage) => {
      console.log('Received recommendation update:', message);
      if (message.type === 'RECOMMENDATION_UPDATE') {
        setLatestRecommendation(message.data);
      }
    });

    newSocket.on('error', (message: WebSocketMessage) => {
      console.error('WebSocket error:', message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribeToAsset = (symbol: string) => {
    if (socket) {
      socket.emit('subscribe_asset', symbol);
      console.log(`Subscribed to ${symbol}`);
    }
  };

  const unsubscribeFromAsset = (symbol: string) => {
    if (socket) {
      socket.emit('unsubscribe_asset', symbol);
      console.log(`Unsubscribed from ${symbol}`);
    }
  };

  const subscribeToRecommendations = () => {
    if (socket) {
      socket.emit('subscribe_recommendations');
      console.log('Subscribed to recommendations');
    }
  };

  const unsubscribeFromRecommendations = () => {
    if (socket) {
      socket.emit('unsubscribe_recommendations');
      console.log('Unsubscribed from recommendations');
    }
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    latestYieldData,
    latestRecommendation,
    subscribeToAsset,
    unsubscribeFromAsset,
    subscribeToRecommendations,
    unsubscribeFromRecommendations,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};