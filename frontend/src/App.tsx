import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MessageAnalyzer from './pages/MessageAnalyzer';
import URLAnalyzer from './pages/URLAnalyzer';
import ScreenshotAnalyzer from './pages/ScreenshotAnalyzer';
import QRScanner from './pages/QRScanner';
import HistoryPage from './pages/HistoryPage';
import PrivacyCenter from './pages/PrivacyCenter';
import PerformancePage from './pages/PerformancePage';
import { getHealth } from './services/api';
import type { Page, HealthResponse } from './types';
import './index.css';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  // Pre-loaded message content (e.g. from demo button on Dashboard)
  const [demoMessageContent, setDemoMessageContent] = useState('');

  // Poll backend health every 15 seconds
  const checkHealth = useCallback(async () => {
    try {
      const h = await getHealth();
      setHealth(h);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleNavigate = (target: Page) => {
    setPage(target);
  };

  const handleLoadDemo = (content: string) => {
    setDemoMessageContent(content);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} health={health} onLoadDemo={handleLoadDemo} />;
      case 'message':
        return <MessageAnalyzer preloadedContent={demoMessageContent} />;
      case 'url':
        return <URLAnalyzer />;
      case 'screenshot':
        return <ScreenshotAnalyzer />;
      case 'qr':
        return <QRScanner />;
      case 'history':
        return <HistoryPage />;
      case 'privacy':
        return <PrivacyCenter />;
      case 'performance':
        return <PerformancePage />;
      default:
        return <Dashboard onNavigate={handleNavigate} health={health} onLoadDemo={handleLoadDemo} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        currentPage={page}
        onNavigate={handleNavigate}
        backendOnline={backendOnline}
      />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Top header bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'rgba(5, 11, 24, 0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--color-border)',
            padding: '12px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>ScamShield AI</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13, marginLeft: 10 }}>
              Private, Explainable Scam Detection
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Backend status in header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                color: backendOnline ? '#10b981' : '#ef4444',
                padding: '4px 10px',
                borderRadius: 20,
                background: backendOnline ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${backendOnline ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              <span
                className="pulse-dot"
                style={{
                  backgroundColor: backendOnline ? '#10b981' : '#ef4444',
                  width: 7,
                  height: 7,
                }}
              />
              {backendOnline ? '🟢 Local AI Active' : '🔴 Backend Offline'}
            </div>
            {health && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                v{health.version}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        {renderPage()}
      </main>
    </div>
  );
}
