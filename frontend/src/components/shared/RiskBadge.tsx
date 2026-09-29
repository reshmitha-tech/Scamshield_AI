// RiskBadge — shows risk level with color-coded pill
import type { RiskLevel } from '../../types';

interface Props {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG: Record<RiskLevel, { label: string; cls: string; dot: string }> = {
  HIGH:       { label: 'High Risk',    cls: 'risk-badge risk-badge-high',        dot: '#ef4444' },
  SUSPICIOUS: { label: 'Suspicious',   cls: 'risk-badge risk-badge-suspicious',  dot: '#f59e0b' },
  LOW:        { label: 'Low Risk',     cls: 'risk-badge risk-badge-low',          dot: '#10b981' },
};

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  const { label, cls, dot } = CONFIG[level] ?? CONFIG.LOW;
  const padding = size === 'lg' ? 'px-4 py-2 text-sm' : size === 'sm' ? 'px-2 py-1 text-[10px]' : '';

  return (
    <span className={`${cls} ${padding}`}>
      <span
        className="pulse-dot"
        style={{ backgroundColor: dot, width: size === 'lg' ? 10 : 8, height: size === 'lg' ? 10 : 8 }}
      />
      {label}
      {score !== undefined && (
        <span style={{ marginLeft: 6, opacity: 0.8 }}>{score}/100</span>
      )}
    </span>
  );
}
