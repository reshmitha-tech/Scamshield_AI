// ScoreRing — animated SVG circular risk score indicator
import type { RiskLevel } from '../../types';

interface Props {
  score: number;
  level: RiskLevel;
  size?: number;
}

const COLORS: Record<RiskLevel, string> = {
  HIGH:       '#ef4444',
  SUSPICIOUS: '#f59e0b',
  LOW:        '#10b981',
};

export default function ScoreRing({ score, level, size = 140 }: Props) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const color = COLORS[level] ?? '#10b981';

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth={10}
        />
        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{
            filter: `drop-shadow(0 0 8px ${color}88)`,
            transition: 'stroke-dasharray 0.6s ease',
          }}
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: size * 0.1, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          /100
        </span>
      </div>
    </div>
  );
}
