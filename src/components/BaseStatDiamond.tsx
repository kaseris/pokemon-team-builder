import type { StatId, StatsTable } from '../types/pokemon';
import { STAT_IDS, STAT_LABELS } from '../types/pokemon';

const CHART_ORDER: StatId[] = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'];
const MAX_BASE = 255;
const GRID_LEVELS = [85, 170, 255];

type Props = {
  baseStats: StatsTable;
  className?: string;
  size?: number;
  prominent?: boolean;
  showTitle?: boolean;
};

function polarPoint(cx: number, cy: number, radius: number, index: number) {
  const angle = -Math.PI / 2 + index * (Math.PI / 3);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function statRadius(value: number, maxRadius: number) {
  return (Math.min(value, MAX_BASE) / MAX_BASE) * maxRadius;
}

function polygonPoints(cx: number, cy: number, maxRadius: number, stats: StatsTable) {
  return CHART_ORDER.map((stat, i) => {
    const r = statRadius(stats[stat], maxRadius);
    const { x, y } = polarPoint(cx, cy, r, i);
    return `${x},${y}`;
  }).join(' ');
}

export function BaseStatDiamond({
  baseStats,
  className = '',
  size = 200,
  prominent = false,
  showTitle = true,
}: Props) {
  const pad = size * (prominent ? 0.18 : 0.14);
  const total = size + pad * 2;
  const cx = pad + size / 2;
  const cy = pad + size / 2;
  const maxRadius = size * (prominent ? 0.3 : 0.28);
  const labelRadius = size * (prominent ? 0.42 : 0.4);
  const totalBst = STAT_IDS.reduce((sum, stat) => sum + baseStats[stat], 0);
  const labelSize = prominent ? (size >= 300 ? 14 : size >= 260 ? 13 : 11) : 9;
  const valueSize = prominent ? (size >= 300 ? 20 : size >= 260 ? 18 : 14) : 11;
  const labelOffset = prominent ? (size >= 300 ? 12 : size >= 260 ? 10 : 8) : 6;
  const valueOffset = prominent ? (size >= 300 ? 16 : size >= 260 ? 14 : 11) : 8;

  return (
    <div className={`flex flex-col items-center ${prominent ? 'gap-3' : 'gap-1'} ${className}`}>
      {!prominent && (
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Base Stats</span>
      )}
      {prominent && showTitle && (
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-muted">
          Base Stats
        </span>
      )}
      <svg
        viewBox={`0 0 ${total} ${total}`}
        role="img"
        aria-label={`Base stat chart, BST ${totalBst}`}
        className="h-auto w-full max-w-[330px] shrink-0 drop-shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent)_22%,transparent)]"
        preserveAspectRatio="xMidYMid meet"
      >
        {GRID_LEVELS.map((level) => (
          <polygon
            key={level}
            points={CHART_ORDER.map((_, i) => {
              const { x, y } = polarPoint(cx, cy, statRadius(level, maxRadius), i);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={level === 255 ? (prominent ? 2 : 1.5) : 1}
            opacity={level === 255 ? 0.9 : 0.45}
          />
        ))}

        {CHART_ORDER.map((_, i) => {
          const outer = polarPoint(cx, cy, maxRadius, i);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--color-border)"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        <polygon
          points={polygonPoints(cx, cy, maxRadius, baseStats)}
          fill="color-mix(in oklch, var(--color-accent) 40%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth={prominent ? 2.5 : 2}
          strokeLinejoin="round"
        />

        {CHART_ORDER.map((stat, i) => {
          const label = polarPoint(cx, cy, labelRadius, i);
          const value = baseStats[stat];
          const isHigh = value >= 100;
          const isLow = value <= 50;

          return (
            <g key={stat}>
              <text
                x={label.x}
                y={label.y - labelOffset}
                textAnchor="middle"
                dominantBaseline="auto"
                fill="var(--color-muted)"
                fontSize={labelSize}
                fontWeight={600}
                style={{ fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}
              >
                {STAT_LABELS[stat]}
              </text>
              <text
                x={label.x}
                y={label.y + valueOffset}
                textAnchor="middle"
                dominantBaseline="hanging"
                fill={
                  isHigh
                    ? 'var(--color-accent-dim)'
                    : isLow
                      ? 'var(--color-muted)'
                      : 'var(--color-foreground)'
                }
                fontSize={valueSize}
                fontWeight={700}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={prominent ? 'text-base text-muted' : 'text-[11px] text-muted'}>
        BST{' '}
        <span
          className={`font-display font-bold text-foreground ${prominent ? (size >= 300 ? 'text-3xl' : 'text-2xl') : ''}`}
        >
          {totalBst}
        </span>
      </p>
    </div>
  );
}
