// Dashboard page — main landing view with hero, stats, and quick actions
import { MessageSquare, Link2, Image, QrCode, TrendingUp, ShieldCheck, Cpu, Clock } from 'lucide-react';
import type { Page, HealthResponse, DemoExample } from '../types';
import { DEMO_EXAMPLES } from '../utils/demoData';

interface Props {
  onNavigate: (page: Page) => void;
  health: HealthResponse | null;
  onLoadDemo: (content: string) => void;
}

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  isDemo: boolean;
}

const STATS: StatCard[] = [
  {
    label: 'Threats Analyzed',
    value: '1,248',
    sub: 'Total analyses',
    icon: ShieldCheck,
    color: '#3b82f6',
    isDemo: true,
  },
  {
    label: 'High Risk Detected',
    value: '186',
    sub: '14.9% of all analyses',
    icon: TrendingUp,
    color: '#ef4444',
    isDemo: true,
  },
  {
    label: 'Local Analyses',
    value: '94%',
    sub: 'Privacy preserved',
    icon: Cpu,
    color: '#10b981',
    isDemo: true,
  },
  {
    label: 'Avg Analysis Time',
    value: '~420 ms',
    sub: 'Per analysis (mock)',
    icon: Clock,
    color: '#f59e0b',
    isDemo: true,
  },
];

const QUICK_ACTIONS = [
  { id: 'message' as Page,    label: 'Analyze Message', icon: MessageSquare, color: '#3b82f6', desc: 'SMS, email or chat' },
  { id: 'url' as Page,        label: 'Check URL',       icon: Link2,         color: '#8b5cf6', desc: 'Detect phishing links' },
  { id: 'screenshot' as Page, label: 'Upload Screenshot',icon: Image,        color: '#ec4899', desc: 'OCR + analysis' },
  { id: 'qr' as Page,         label: 'Scan QR Code',    icon: QrCode,        color: '#14b8a6', desc: 'Decode & analyze' },
];

export default function Dashboard({ onNavigate, health, onLoadDemo }: Props) {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-brand)',
              padding: '3px 10px',
              background: 'var(--color-brand-dim)',
              borderRadius: 20,
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            Snapdragon AI Lab — Build &amp; Present Challenge
          </span>
        </div>
        <h1
          className="gradient-text"
          style={{ fontSize: 40, fontWeight: 900, margin: '16px 0 8px', lineHeight: 1.1 }}
        >
          Check Before You Trust.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', margin: '0 0 24px', maxWidth: 560, lineHeight: 1.6 }}>
          Analyze suspicious messages, links, screenshots and QR codes with privacy-first AI.
          All processing happens locally — your data never leaves your device.
        </p>

        {/* Backend info */}
        {health && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: 12,
              color: '#10b981',
              fontWeight: 500,
            }}
          >
            <span className="pulse-dot" style={{ backgroundColor: '#10b981', width: 7, height: 7 }} />
            {health.model_provider.split('[')[0].trim()} — Uptime: {Math.floor((health.uptime_seconds ?? 0) / 60)}m
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              id={`quick-${action.id}`}
              onClick={() => onNavigate(action.id)}
              className="glass-card"
              style={{
                padding: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                border: `1px solid var(--color-border)`,
                transition: 'all 0.25s ease',
                background: 'none',
                color: 'inherit',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = action.color;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 30px ${action.color}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${action.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Icon size={22} color={action.color} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{action.label}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{action.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: 'var(--color-text-secondary)' }}>
          Platform Statistics
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${stat.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color={stat.color} />
                  </div>
                  {stat.isDemo && <span className="demo-banner">Demo</span>}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: 6 }}>
                  {stat.value}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{stat.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demo examples */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Demo Examples</h2>
          <span className="demo-banner">Synthetic — Not real threats</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEMO_EXAMPLES.map((ex: DemoExample) => (
            <button
              key={ex.id}
              id={`demo-${ex.id}`}
              onClick={() => {
                onLoadDemo(ex.content);
                onNavigate('message');
              }}
              className="glass-card"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                background: 'none',
                color: 'inherit',
                textAlign: 'left',
                transition: 'all 0.2s',
                border: '1px solid var(--color-border)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-bright)';
                (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-elevated)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.background = 'none';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{ex.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{ex.description}</div>
              </div>
              <span
                className={`risk-badge risk-badge-${ex.expectedRisk.toLowerCase() === 'high' ? 'high' : ex.expectedRisk.toLowerCase() === 'suspicious' ? 'suspicious' : 'low'}`}
                style={{ flexShrink: 0 }}
              >
                {ex.expectedRisk}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                Load Demo →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
