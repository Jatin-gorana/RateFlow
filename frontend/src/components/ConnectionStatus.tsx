import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center space-x-3">
      {isConnected ? (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-yield-500/10 rounded-lg border border-yield-500/20">
          <div className="w-2 h-2 rounded-full bg-yield-500 live-dot shadow-yield-glow"></div>
          <span className="text-sm text-yield-500 font-medium font-ui">Live</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-sm text-red-400 font-medium font-ui">Offline</span>
        </div>
      )}
      
      {/* WebSocket Status Indicator */}
      <div className="flex items-center space-x-1 text-surface-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        <span className="text-xs font-mono">WS</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;