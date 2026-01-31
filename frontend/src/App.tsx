import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AssetDetail from './pages/AssetDetail';

function App() {
  return (
    <WebSocketProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/asset/:symbol" element={<AssetDetail />} />
        </Routes>
      </Layout>
    </WebSocketProvider>
  );
}

export default App;