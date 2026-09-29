// IndicatorList — renders detected risk indicators with severity icons
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Indicator } from '../../types';

interface Props {
  indicators: Indicator[];
}

const SEVERITY_CONFIG = {
  high:   { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
  medium: { icon: AlertCircle,   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  low:    { icon: Info,          color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)' },
};

const TYPE_LABELS: Record<string, string> = {
  urgency:               '⚡ Urgent Language',
  account_threat:        '🔒 Account Threat',
  credential_request:    '🔑 Credential Request',
  suspicious_link:       '🔗 Suspicious Link',
  payment_request:       '💳 Payment Request',
  impersonation:         '🎭 Impersonation',
  no_https:              '🔓 No HTTPS',
  ip_address_url:        '🌐 IP Address URL',
  url_shortener:         '✂️ URL Shortener',
  suspicious_tld:        '⚠️ Suspicious Domain',
  lookalike_domain:      '👁️ Lookalike Domain',
  excessive_subdomains:  '🔍 Excessive Subdomains',
  suspicious_path:       '📁 Suspicious Path',
  suspicious_query_params:'🔎 Suspicious Parameters',
  obfuscated_url:        '🙈 Obfuscated URL',
};

export default function IndicatorList({ indicators }: Props) {
  if (indicators.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
        }}
      >
        No suspicious indicators detected.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {indicators.map((ind, i) => {
        const cfg = SEVERITY_CONFIG[ind.severity] ?? SEVERITY_CONFIG.low;
        const Icon = cfg.icon;
        const label = TYPE_LABELS[ind.type] ?? ind.type;

        return (
          <div
            key={i}
            className="indicator-item animate-slide-up"
            style={{
              background: cfg.bg,
              borderColor: cfg.border,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <Icon size={18} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: cfg.color, fontSize: 13 }}>{label}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: cfg.color,
                    opacity: 0.7,
                  }}
                >
                  {ind.severity}
                </span>
              </div>
              {ind.description && (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {ind.description}
                </p>
              )}
              {ind.evidence && (
                <div
                  style={{
                    marginTop: 6,
                    padding: '4px 8px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 6,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  "{ind.evidence}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
