import { getMove } from './dex';
import { TYPE_COLORS } from '../constants/type-colors';

export type MoveCategory = 'Physical' | 'Special' | 'Status';

export type MoveDisplayData = {
  name: string;
  type: string;
  category: MoveCategory;
  power: number | null;
  accuracy: number | true | null;
};

export function getMoveDisplayData(name: string): MoveDisplayData | null {
  if (!name) return null;

  const move = getMove(name);
  if (!move) {
    return {
      name,
      type: 'Normal',
      category: 'Status',
      power: null,
      accuracy: null,
    };
  }

  return {
    name: move.name,
    type: move.type,
    category: move.category as MoveCategory,
    power: move.basePower ?? null,
    accuracy: move.accuracy ?? null,
  };
}

export function formatMovePower(power: number | null, category: MoveCategory): string {
  if (category === 'Status') return '—';
  if (!power) return '—';
  return String(power);
}

export function formatMoveAccuracy(accuracy: number | true | null): string {
  if (accuracy === true) return '—';
  if (accuracy == null) return '—';
  return `${accuracy}%`;
}

export function getMoveEffect(name: string): string | null {
  const move = getMove(name);
  if (!move) return null;
  const text = move.shortDesc || move.desc;
  return text?.trim() || null;
}

export function moveTypeSurfaceStyle(type: string): {
  background: string;
  borderColor: string;
} {
  const typeColor = TYPE_COLORS[type] ?? 'var(--color-muted)';
  return {
    background: `color-mix(in oklch, ${typeColor} 16%, var(--color-surface-raised))`,
    borderColor: `color-mix(in oklch, ${typeColor} 42%, var(--color-border))`,
  };
}

export function moveTypeAccentColor(type: string): string {
  const typeColor = TYPE_COLORS[type] ?? 'var(--color-muted)';
  return `color-mix(in oklch, ${typeColor} 72%, var(--color-border))`;
}
