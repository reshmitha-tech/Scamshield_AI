// Performance Dashboard page
import { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, Cpu, Clock, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { getPerformance } from '../services/api';
import type { PerformanceSummary } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const CUSTOM_TOOLTIP_STYLE = {
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'var(--color-text-primary)',
  fontSize: 12,
};

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getPerformance());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const breakdownData = data
    ? Object.entries(data.breakdown_by_type).map(([name, count]) => ({ name, count }))
    : [];

  const localCloudData = data
    ? [
        { name: 'Local', value: data.local_analyses, color: '#10b981' },
        { name: 'Cloud', value: data.cloud_analyses, color: '#f59e0b' },
      ]
    : [];

  // Demo values when no real data exists
  const DEMO_LATENCY = [
    { label: 'Total', ms: 420 },
    { label: 'Model', ms: 280 },
    { label: 'OCR', ms: null },
    { label: 'QR Decode', ms: null },
  ];

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(59,130,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart2 size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Performance Dashboard</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              Latency, throughput, and local vs cloud metrics
            </p>
          </div>
        </div>
        <button className="btn-secondary" onClick={fetch} id="btn-refresh-perf">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[80, 200, 140].map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {data && !loading && (
        <>
          {data.is_demo_data && (
            <div className="demo-banner" style={{ marginBottom: 20, display: 'inline-flex' }}>
              ⚠️ Demo values — run analyses to see real metrics
            </div>
          )}

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Analyses', value: data.total_analyses || '—', icon: Activity, color: '#3b82f6' },
              { label: 'Local', value: data.local_percentage ? `${data.local_percentage}%` : '—', icon: Cpu, color: '#10b981' },
              { label: 'Avg Latency', value: data.avg_latency_ms ? `${data.avg_latency_ms} ms` : '~420 ms', icon: Clock, color: '#f59e0b' },
              { label: 'Model Latency', value: data.avg_model_latency_ms ? `${data.avg_model_latency_ms} ms` : '~280 ms', icon: Cpu, color: '#8b5cf6' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="stat-card">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${stat.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Icon size={16} color={stat.color} />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{stat.label}</div>
                  {data.is_demo_data && <span className="demo-banner" style={{ marginTop: 6 }}>Demo</span>}
                </div>
              );
            })}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            {/* Breakdown by type bar chart */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Analyses by Type</h3>
              {breakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={breakdownData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {breakdownData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No data yet — run some analyses
                </div>
              )}
            </div>

            {/* Local vs cloud pie chart */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Local vs Cloud</h3>
              {data.total_analyses > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={localCloudData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                    >
                      {localCloudData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                    <Legend formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>100%</div>
                  <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Local</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No cloud calls made</div>
                </div>
              )}
            </div>
          </div>

          {/* Latency breakdown table */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color="#f59e0b" />
              Latency Breakdown
              {data.is_demo_data && <span className="demo-banner">Demo values</span>}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEMO_LATENCY.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {item.label}
                  </div>
                  <div style={{ flex: 1, height: 6, background: 'var(--color-bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    {item.ms && (
                      <div
                        style={{
                          height: '100%',
                          width: `${(item.ms / 500) * 100}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                          borderRadius: 3,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      width: 80,
                      textAlign: 'right',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13,
                      color: item.ms ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {item.ms ? `~${item.ms} ms` : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              {data.note}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
