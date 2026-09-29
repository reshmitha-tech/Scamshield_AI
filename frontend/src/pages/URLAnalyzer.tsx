// URL Analyzer page
import { useState } from 'react';
import { Link2, Search, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { analyzeUrl } from '../services/api';
import AnalysisResultCard from '../components/shared/AnalysisResultCard';
import type { AnalysisResponse } from '../types';
import { DEMO_URLS } from '../utils/demoData';

export default function URLAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeUrl(url.trim());
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setResult(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(139,92,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Link2 size={20} color="#8b5cf6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>URL Analyzer</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              Check a URL for phishing indicators — no network requests made
            </p>
          </div>
        </div>
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.15)',
            fontSize: 12,
            color: '#a78bfa',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🚫 The URL is NEVER visited or fetched — analysis is entirely local and static
        </div>
      </div>

      {/* Demo URLs */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Try a demo URL <span className="demo-banner" style={{ verticalAlign: 'middle' }}>Synthetic</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DEMO_URLS.map((d) => (
            <button
              key={d.id}
              id={`load-url-${d.id}`}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => { setUrl(d.url); setResult(null); setError(null); }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <label
          htmlFor="url-input"
          style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}
        >
          URL to Analyze
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            id="url-input"
            className="scam-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com or paste a suspicious link"
            maxLength={2048}
          />
          {(url || result) && (
            <button className="btn-secondary" onClick={handleReset} id="btn-reset-url" style={{ flexShrink: 0 }}>
              <RotateCcw size={14} />
            </button>
          )}
          <button
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            id="btn-analyze-url"
            style={{ flexShrink: 0, opacity: !url.trim() ? 0.5 : 1 }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {loading ? 'Analyzing…' : 'Check URL'}
          </button>
        </div>

        {/* Safety notice */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Never paste a URL into a browser address bar before verifying it here.
            The analyzer checks domain structure, TLS, and patterns — without visiting the link.
          </span>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[100, 80].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            fontSize: 14,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && <AnalysisResultCard result={result} />}
    </div>
  );
}
