// AnalysisResultCard — full result display shared by message and URL analyzers
import { CheckCircle, Shield, Lightbulb } from 'lucide-react';
import RiskBadge from './RiskBadge';
import ScoreRing from './ScoreRing';
import IndicatorList from './IndicatorList';
import type { AnalysisResponse } from '../../types';

interface Props {
  result: AnalysisResponse;
}

export default function AnalysisResultCard({ result }: Props) {
  const isMock = result.processing.model.toLowerCase().includes('mock');

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Mock banner */}
      {isMock && (
        <div className="demo-banner" style={{ alignSelf: 'flex-start' }}>
          ⚠️ DEMO MODE — MockModelProvider (rule-based, not a real AI model)
        </div>
      )}

      {/* Score header */}
      <div
        className="glass-card"
        style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}
      >
        <ScoreRing score={result.risk_score} level={result.risk_level} size={130} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <RiskBadge level={result.risk_level} size="lg" />
          <div
            style={{
              marginTop: 12,
              fontSize: 28,
              fontWeight: 800,
              color:
                result.risk_level === 'HIGH'
                  ? '#ef4444'
                  : result.risk_level === 'SUSPICIOUS'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          >
            {result.risk_level === 'HIGH'
              ? 'High-Risk Indicators Detected'
              : result.risk_level === 'SUSPICIOUS'
              ? 'Suspicious Patterns Found'
              : 'No Major Threats Detected'}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: 'var(--color-text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            ID: {result.analysis_id.slice(0, 8)}… &nbsp;|&nbsp; {result.processing.mode.toUpperCase()} &nbsp;|&nbsp;{' '}
            {result.processing.latency_ms.toFixed(0)} ms
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Shield size={16} color="#3b82f6" />
          Why is this suspicious?
        </h3>
        <IndicatorList indicators={result.indicators} />
      </div>

      {/* Explanation */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Lightbulb size={16} color="#f59e0b" />
          Explanation
        </h3>
        <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {result.explanation}
        </p>
      </div>

      {/* Recommendation */}
      <div
        className="glass-card"
        style={{
          padding: 24,
          borderColor:
            result.risk_level === 'HIGH'
              ? 'rgba(239,68,68,0.2)'
              : result.risk_level === 'SUSPICIOUS'
              ? 'rgba(245,158,11,0.2)'
              : 'rgba(16,185,129,0.2)',
        }}
      >
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle size={16} color="#10b981" />
          Recommended Action
        </h3>
        <p style={{ margin: 0, lineHeight: 1.7, fontSize: 14, color: 'var(--color-text-primary)' }}>
          {result.recommendation}
        </p>
      </div>

      {/* Processing info */}
      <div
        style={{
          padding: '10px 16px',
          borderRadius: 8,
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          fontSize: 12,
          color: 'var(--color-text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 20px',
        }}
      >
        <span>Provider: {result.processing.model.split('[')[0].trim()}</span>
        <span>Mode: {result.processing.mode}</span>
        <span>Latency: {result.processing.latency_ms.toFixed(1)} ms</span>
        <span>Type: {result.input_type}</span>
      </div>
    </div>
  );
}
