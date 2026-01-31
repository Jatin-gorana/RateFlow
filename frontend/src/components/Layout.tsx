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
    <div className="min-h-screen bg-zinc-950 font-ui">
      {/* Frosted Glass Navbar */}
      <header className="frosted-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-violet-500/25">
                  <span className="text-white font-bold text-lg font-mono">Y</span>
                </div>
                <div className="ml-3">
                  <span className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors">
                    Yield<span className="text-violet-500">Sense</span>
                  </span>
                  <div className="text-xs text-zinc-500 font-mono">
                    Institutional Grade
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/'
                    ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                Dashboard
              </Link>
              
              <div className="h-6 w-px bg-zinc-700"></div>
              
              <ConnectionStatus isConnected={isConnected} />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Consistent Background */}
      <main className="bg-zinc-950 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full live-dot"></div>
                <span className="text-zinc-400 text-sm font-ui">Real-time Intelligence</span>
              </div>
              <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
              <span className="text-zinc-500 text-sm font-ui">Powered by Aave V3</span>
            </div>
            
            <div className="flex items-center space-x-6 text-zinc-500 text-sm">
              <span className="font-ui">© 2026 RateFlow</span>
              <span className="font-mono">v2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;