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
  const labelRadius = size * (prominent ? 0.39 : 0.36);
  const totalBst = STAT_IDS.reduce((sum, stat) => sum + baseStats[stat], 0);
  const labelSize = prominent ? (size >= 300 ? 17 : size >= 260 ? 16 : 14) : 10;
  const valueSize = prominent ? (size >= 300 ? 26 : size >= 260 ? 24 : 18) : 12;
  const nameValueGap = prominent ? 3 : 2;

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
          fill="color-mix(in oklch, var(--color-accent-bright) 55%, var(--color-accent) 30%)"
          stroke="var(--color-accent-dim)"
          strokeWidth={prominent ? 3 : 2}
          strokeLinejoin="round"
          opacity={0.92}
        />

        {CHART_ORDER.map((stat, i) => {
          const angle = -Math.PI / 2 + i * (Math.PI / 3);
          const base = polarPoint(cx, cy, labelRadius, i);
          const outward = prominent ? 3 : 2;
          const anchor = {
            x: base.x + outward * Math.cos(angle),
            y: base.y + outward * Math.sin(angle),
          };
          const value = baseStats[stat];
          const isHigh = value >= 100;
          const nameDy = -(valueSize / 2 + nameValueGap / 2);

          return (
            <text
              key={stat}
              x={anchor.x}
              y={anchor.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              <tspan
                x={anchor.x}
                dy={nameDy}
                fill="var(--color-foreground)"
                fillOpacity={0.82}
                fontSize={labelSize}
                fontWeight={700}
                style={{ fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}
              >
                {STAT_LABELS[stat]}
              </tspan>
              <tspan
                x={anchor.x}
                dy={labelSize + nameValueGap}
                fill={isHigh ? 'var(--color-accent-dim)' : 'var(--color-foreground)'}
                fontSize={valueSize}
                fontWeight={800}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {value}
              </tspan>
            </text>
          );
        })}
      </svg>
      <p className={prominent ? 'text-sm font-semibold text-foreground/75' : 'text-xs font-semibold text-foreground/70'}>
        BST{' '}
        <span
          className={`font-display font-extrabold text-foreground ${prominent ? (size >= 300 ? 'text-3xl' : 'text-2xl') : ''}`}
        >
          {totalBst}
        </span>
      </p>
    </div>
  );
}
