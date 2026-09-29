// Sidebar navigation component
import {
  LayoutDashboard,
  MessageSquare,
  Link2,
  Image,
  QrCode,
  History,
  Lock,
  BarChart2,
  Shield,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import type { Page } from '../../types';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  backendOnline: boolean;
}

interface NavGroup {
  label: string;
  items: { id: Page; label: string; icon: React.ComponentType<{ size?: number }>; badge?: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Analysis',
    items: [
      { id: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
      { id: 'message',     label: 'Analyze Message',  icon: MessageSquare },
      { id: 'url',         label: 'Check URL',        icon: Link2 },
      { id: 'screenshot',  label: 'Screenshot OCR',   icon: Image,   badge: 'Phase 4' },
      { id: 'qr',          label: 'Scan QR Code',     icon: QrCode,  badge: 'Phase 5' },
    ],
  },
  {
    label: 'Data & Privacy',
    items: [
      { id: 'history',     label: 'Analysis History', icon: History },
      { id: 'privacy',     label: 'Privacy Center',   icon: Lock },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'performance', label: 'Performance',      icon: BarChart2 },
    ],
  },
];

export default function Sidebar({ currentPage, onNavigate, backendOnline }: Props) {
  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 12px 24px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 4px 20px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.3)',
            }}
          >
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text-primary)' }}>
              ScamShield
            </div>
            <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--color-brand)' }}>
              AI
            </div>
          </div>
        </div>

        {/* Backend status */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
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
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: backendOnline ? '#10b981' : '#ef4444',
            }}
          >
            {backendOnline ? 'Local AI Active' : 'Backend Offline'}
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                padding: '0 8px',
                marginBottom: 6,
              }}
            >
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: active ? undefined : '1px solid transparent' }}
                    id={`nav-${item.id}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: 4,
                          background: 'rgba(59,130,246,0.15)',
                          color: '#60a5fa',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 8px 0',
          borderTop: '1px solid var(--color-border)',
          marginTop: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          <Cpu size={12} />
          Snapdragon AI Lab Build
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
          v0.1.0 — Phase 1
        </div>
      </div>
    </aside>
  );
}
