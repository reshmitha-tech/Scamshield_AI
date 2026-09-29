// Message Analyzer page
import { useState, useRef } from 'react';
import { MessageSquare, Send, Loader2, RotateCcw, Play } from 'lucide-react';
import { analyzeMessage } from '../services/api';
import AnalysisResultCard from '../components/shared/AnalysisResultCard';
import type { AnalysisResponse } from '../types';
import { DEMO_EXAMPLES } from '../utils/demoData';

interface Props {
  preloadedContent?: string;
}

export default function MessageAnalyzer({ preloadedContent = '' }: Props) {
  const [content, setContent] = useState(preloadedContent);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeMessage(content.trim());
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setResult(null);
    setError(null);
    textareaRef.current?.focus();
  };

  const loadDemo = (text: string) => {
    setContent(text);
    setResult(null);
    setError(null);
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
              background: 'rgba(59,130,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Message Analyzer</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              Paste a suspicious SMS, email or chat message to analyze
            </p>
          </div>
        </div>
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
            fontSize: 12,
            color: '#10b981',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🔒 Analysis runs locally — your message is never sent to external servers
        </div>
      </div>

      {/* Demo quick-load */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Demo Examples <span className="demo-banner" style={{ verticalAlign: 'middle' }}>Synthetic</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DEMO_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              id={`load-${ex.id}`}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => loadDemo(ex.content)}
            >
              <Play size={11} />
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <label
          htmlFor="message-input"
          style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}
        >
          Message Content
        </label>
        <textarea
          id="message-input"
          ref={textareaRef}
          className="scam-textarea"
          rows={7}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste a suspicious SMS, email or message here...&#10;&#10;Example: Your bank account will be blocked today. Verify your account immediately by clicking this link and entering your OTP."
          maxLength={10000}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {content.length} / 10,000 characters
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {(content || result) && (
              <button className="btn-secondary" onClick={handleReset} id="btn-reset-message">
                <RotateCcw size={14} />
                Reset
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={loading || !content.trim()}
              id="btn-analyze-message"
              style={{ opacity: !content.trim() ? 0.5 : 1 }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {loading ? 'Analyzing…' : 'Analyze Message'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[140, 100, 80].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h }} />
          ))}
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            Analyzing with {' '}
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>MockModelProvider</span>…
          </p>
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
