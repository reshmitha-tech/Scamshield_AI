// Privacy Center page
import { Lock, Shield, Cloud, HardDrive, Trash2, Eye, EyeOff, Cpu } from 'lucide-react';

export default function PrivacyCenter() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(16,185,129,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={20} color="#10b981" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Privacy Center</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Your data stays on your device. Always.
          </p>
        </div>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {[
          {
            icon: Cpu,
            label: 'AI Processing',
            status: 'Local',
            detail: 'MockModelProvider — rule-based, runs entirely on-device',
            color: '#10b981',
            ok: true,
          },
          {
            icon: Cloud,
            label: 'Cloud Processing',
            status: 'Inactive',
            detail: 'No cloud AI calls are made in the current configuration',
            color: '#10b981',
            ok: true,
          },
          {
            icon: HardDrive,
            label: 'Data Storage',
            status: 'Local SQLite',
            detail: 'All data is stored in scamshield.db on this machine only',
            color: '#3b82f6',
            ok: true,
          },
          {
            icon: Eye,
            label: 'Content Storage',
            status: 'Preview Only',
            detail: 'Only the first 80 characters of inputs are stored — never the full content',
            color: '#f59e0b',
            ok: true,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="glass-card"
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>{item.status}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy principles */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="#3b82f6" />
          Privacy Principles
        </h2>
        {[
          { icon: EyeOff,  color: '#10b981', text: 'Your messages and URLs are never sent to external APIs or servers.' },
          { icon: HardDrive, color: '#3b82f6', text: 'Uploaded screenshots are analyzed locally via OCR and not stored permanently.' },
          { icon: Lock,    color: '#8b5cf6', text: 'QR codes are decoded locally — the decoded URL is never automatically opened.' },
          { icon: Cpu,     color: '#f59e0b', text: 'AI inference runs on your device using MockModelProvider (or a local ONNX model when configured).' },
          { icon: Trash2,  color: '#ef4444', text: 'You can delete your analysis history at any time from the History page.' },
          { icon: Cloud,   color: '#94a3b8', text: 'If a cloud fallback is enabled in future versions, it will be clearly indicated with a 🟡 Cloud Fallback Active badge.' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < 5 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <Icon size={15} color={item.color} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {item.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Offline mode */}
      <div
        className="glass-card"
        style={{
          padding: 20,
          borderColor: 'rgba(16,185,129,0.2)',
          background: 'rgba(16,185,129,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="pulse-dot" style={{ backgroundColor: '#10b981', width: 9, height: 9 }} />
          <span style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>🟢 Offline Mode — Local AI Active</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          ScamShield AI is designed to operate fully offline. The MockModelProvider uses rule-based heuristics
          with no internet connection required. When a real local model is configured (Phase 7), the system
          will continue to operate without any cloud dependency.
        </p>
      </div>
    </div>
  );
}
