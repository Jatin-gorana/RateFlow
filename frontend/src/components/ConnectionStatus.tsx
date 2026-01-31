import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <>
          <CheckCircleIcon className="w-4 h-4 text-success-500" />
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <span className="text-sm text-success-600 font-medium">Live</span>
        </>
      ) : (
        <>
          <ExclamationTriangleIcon className="w-4 h-4 text-error-500" />
          <div className="w-2 h-2 rounded-full bg-error-500" />
          <span className="text-sm text-error-600 font-medium">Disconnected</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;