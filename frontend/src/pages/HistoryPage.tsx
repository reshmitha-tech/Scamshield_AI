// History page
import { useState, useEffect } from 'react';
import { History, Trash2, RefreshCw, Loader2, Filter } from 'lucide-react';
import { getHistory, deleteHistoryRecord, clearHistory } from '../services/api';
import RiskBadge from '../components/shared/RiskBadge';
import type { HistoryItem as HistoryItemType } from '../types';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItemType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHistory(50, 0, filter || undefined);
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [filter]); // eslint-disable-line

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteHistoryRecord(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((t) => t - 1);
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all analysis history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await clearHistory();
      setItems([]);
      setTotal(0);
    } catch { /* ignore */ }
    setClearing(false);
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const TYPE_ICONS: Record<string, string> = {
    message: '💬',
    url: '🔗',
    image: '🖼️',
    qr: '📷',
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
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
            <History size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Analysis History</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              {total} records — only a short preview is stored, never the full content
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={fetchHistory} id="btn-refresh-history">
            <RefreshCw size={14} />
            Refresh
          </button>
          {items.length > 0 && (
            <button className="btn-danger" onClick={handleClearAll} disabled={clearing} id="btn-clear-history">
              {clearing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <Filter size={14} color="var(--color-text-muted)" />
        {['', 'message', 'url', 'image', 'qr'].map((f) => (
          <button
            key={f}
            className={`btn-secondary ${filter === f ? 'active' : ''}`}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              background: filter === f ? 'var(--color-brand-dim)' : undefined,
              borderColor: filter === f ? 'rgba(59,130,246,0.3)' : undefined,
              color: filter === f ? 'var(--color-brand)' : undefined,
            }}
            onClick={() => setFilter(f)}
          >
            {f === '' ? 'All' : TYPE_ICONS[f] + ' ' + f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[60, 60, 60].map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div
          style={{
            padding: '60px 40px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            border: '1px dashed var(--color-border)',
            borderRadius: 16,
          }}
        >
          <History size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No analyses yet</div>
          <div style={{ fontSize: 13 }}>Analyze a message or URL to see results here.</div>
        </div>
      )}

      {/* List */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{TYPE_ICONS[item.input_type] ?? '🔍'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {item.input_type} · {formatDate(item.timestamp)} · {item.latency_ms.toFixed(0)} ms
                  </span>
                </div>
                {item.content_preview && (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.content_preview}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                  {item.indicators.length} indicator{item.indicators.length !== 1 ? 's' : ''} detected
                </div>
              </div>
              <button
                className="btn-danger"
                style={{ padding: '5px 10px', fontSize: 12, flexShrink: 0 }}
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                id={`btn-delete-${item.id}`}
              >
                {deleting === item.id
                  ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
