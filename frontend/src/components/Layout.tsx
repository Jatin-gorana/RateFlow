import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import ConnectionStatus from './ConnectionStatus';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-surface-950 font-ui">
      {/* Header */}
      <header className="glass border-b border-surface-800 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-yield-500 rounded-xl flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all duration-300">
                  <span className="text-white font-bold text-lg font-mono">Y</span>
                </div>
                <div className="ml-3">
                  <span className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                    Yield<span className="text-brand-500">Sense</span>
                  </span>
                  <div className="text-xs text-surface-400 font-mono">
                    v2.0 • Institutional
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/'
                    ? 'text-brand-400 bg-brand-500/10 border border-brand-500/20'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                }`}
              >
                Dashboard
              </Link>
              
              <div className="h-6 w-px bg-surface-700"></div>
              
              <ConnectionStatus isConnected={isConnected} />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yield-500 rounded-full live-dot"></div>
                <span className="text-surface-400 text-sm font-ui">Real-time Intelligence</span>
              </div>
              <div className="w-1 h-1 bg-surface-600 rounded-full"></div>
              <span className="text-surface-500 text-sm font-ui">Powered by Aave V3</span>
            </div>
            
            <div className="flex items-center space-x-6 text-surface-500 text-sm">
              <span className="font-ui">© 2024 YieldSense</span>
              <span className="font-mono">Institutional Grade</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;