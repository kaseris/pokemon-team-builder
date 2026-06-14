import type { LearnableMove } from '../types/moves';
import { moveTypeAccentColor, moveTypeEffectSurface } from '../data/move-display';

type Props = {
  move: LearnableMove;
  effect: string | null;
  /** When floating above the picker, use a stronger opaque surface. */
  floating?: boolean;
};

export function MoveEffectPreview({ move, effect, floating = false }: Props) {
  const type = move.type ?? 'Normal';
  const surface = moveTypeEffectSurface(type);
  const typeColor = moveTypeAccentColor(type);

  return (
    <div
      className={`shrink-0 rounded-lg border border-l-[4px] px-3.5 py-2.5 ${
        floating ? 'shadow-xl ring-1 ring-border/50' : 'shadow-sm'
      }`}
      style={{
        background: floating
          ? `color-mix(in oklch, ${typeColor} 42%, var(--color-surface-raised))`
          : surface.background,
        borderColor: surface.borderColor,
        borderLeftColor: typeColor,
      }}
      aria-live="polite"
    >
      <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
        {move.name}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">
        {effect ?? 'No effect description available.'}
      </p>
    </div>
  );
}
