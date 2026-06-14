import type { CSSProperties } from 'react';
import type { LearnableMove } from '../types/moves';
import {
  formatMoveAccuracy,
  formatMovePower,
  getMoveDisplayData,
  moveTypeSurfaceStyle,
  type MoveCategory,
  type MoveDisplayData,
} from '../data/move-display';
import { TypeBadge } from './TypeBadge';

const CATEGORY_META: Record<
  MoveCategory,
  { label: string; short: string; color: string; bg: string }
> = {
  Physical: {
    label: 'Physical',
    short: 'Phy',
    color: '#c45c1a',
    bg: 'color-mix(in oklch, #c45c1a 28%, var(--color-surface-raised))',
  },
  Special: {
    label: 'Special',
    short: 'SpA',
    color: '#3d6fd4',
    bg: 'color-mix(in oklch, #3d6fd4 28%, var(--color-surface-raised))',
  },
  Status: {
    label: 'Status',
    short: 'Sta',
    color: '#7a6b8f',
    bg: 'color-mix(in oklch, #7a6b8f 28%, var(--color-surface-raised))',
  },
};

function resolveMoveData(move: LearnableMove | string): MoveDisplayData | null {
  if (typeof move === 'string') return getMoveDisplayData(move);

  return {
    name: move.name,
    type: move.type ?? 'Normal',
    category: (move.category as MoveCategory) ?? 'Status',
    power: move.power ?? null,
    accuracy: move.accuracy ?? null,
  };
}

export function MoveCategoryIcon({
  category,
  size = 'md',
  className = '',
}: {
  category: MoveCategory;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  const px = size === 'sm' ? 22 : 26;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-border/50 shadow-sm ${className}`}
      style={{ width: px, height: px, background: meta.bg, color: meta.color }}
      title={meta.label}
      aria-label={`${meta.label} move`}
    >
      <svg
        viewBox="0 0 16 16"
        width={size === 'sm' ? 13 : 15}
        height={size === 'sm' ? 13 : 15}
        aria-hidden
        className="block"
      >
        {category === 'Physical' && (
          <>
            <rect x="1.5" y="7" width="8.5" height="6" rx="1.2" fill="currentColor" opacity="0.55" transform="rotate(-28 5.5 10)" />
            <rect x="5" y="2.5" width="8.5" height="6" rx="1.2" fill="currentColor" />
          </>
        )}
        {category === 'Special' && (
          <>
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="8" cy="8" r="2.2" fill="currentColor" />
          </>
        )}
        {category === 'Status' && (
          <>
            <path
              d="M8 2.2 9.1 6.2 13.2 6.2 9.9 8.6 11 12.6 8 10.2 5 12.6 6.1 8.6 2.8 6.2 6.9 6.2Z"
              fill="currentColor"
            />
          </>
        )}
      </svg>
    </span>
  );
}

function MoveStats({ data }: { data: MoveDisplayData }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5 text-xs tabular-nums">
      <span title="Base power" className="font-semibold text-foreground">
        <span className="font-bold text-muted">PWR</span>{' '}
        {formatMovePower(data.power, data.category)}
      </span>
      <span title="Accuracy" className="font-semibold text-foreground">
        <span className="font-bold text-muted">ACC</span>{' '}
        {formatMoveAccuracy(data.accuracy)}
      </span>
    </span>
  );
}

type MoveDisplayProps = {
  move: LearnableMove | string;
  variant?: 'slot' | 'picker';
  suffix?: React.ReactNode;
  className?: string;
};

export function MoveDisplay({
  move,
  variant = 'slot',
  suffix,
  className = '',
}: MoveDisplayProps) {
  const data = resolveMoveData(move);
  if (!data) return null;

  if (variant === 'picker') {
    return (
      <span className={`flex min-w-0 flex-1 items-center gap-2.5 ${className}`}>
        <TypeBadge type={data.type} size="sm" className="saturate-150" />
        <MoveCategoryIcon category={data.category} size="sm" />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight text-foreground">
          {data.name}
        </span>
        <MoveStats data={data} />
        {suffix}
      </span>
    );
  }

  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <TypeBadge type={data.type} size="sm" className="saturate-150" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight text-foreground">
          {data.name}
        </span>
        <MoveStats data={data} />
      </span>
      <MoveCategoryIcon category={data.category} size="md" />
    </span>
  );
}

export function moveSlotStyle(type: string, focused: boolean): CSSProperties | undefined {
  if (focused) return undefined;
  return moveTypeSurfaceStyle(type);
}
