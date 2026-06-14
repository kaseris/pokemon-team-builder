import { useEffect, useMemo, useState } from 'react';
import type { PokemonSet } from '../types/pokemon';
import { analyzePokemonDefenses, type DefenseMode } from '../engine/pokemon-defenses';

const TYPE_COLORS: Record<string, string> = {
  Normal: 'var(--color-type-normal)',
  Fire: 'var(--color-type-fire)',
  Water: 'var(--color-type-water)',
  Grass: 'var(--color-type-grass)',
  Electric: 'var(--color-type-electric)',
  Ice: 'var(--color-type-ice)',
  Fighting: 'var(--color-type-fighting)',
  Poison: 'var(--color-type-poison)',
  Ground: 'var(--color-type-ground)',
  Flying: 'var(--color-type-flying)',
  Psychic: 'var(--color-type-psychic)',
  Bug: 'var(--color-type-bug)',
  Rock: 'var(--color-type-rock)',
  Ghost: 'var(--color-type-ghost)',
  Dragon: 'var(--color-type-dragon)',
  Dark: 'var(--color-type-dark)',
  Steel: 'var(--color-type-steel)',
  Fairy: 'var(--color-type-fairy)',
};

type Props = {
  set: PokemonSet;
};

function TypeBadge({ type, variant }: { type: string; variant: 'weak4' | 'weak2' | 'immune' | 'resist' }) {
  const styles = {
    weak4: 'ring-2 ring-danger/60',
    weak2: '',
    immune: 'opacity-80',
    resist: 'opacity-90',
  };

  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white ${styles[variant]}`}
      style={{ background: TYPE_COLORS[type] ?? 'var(--color-muted)' }}
    >
      {type}
    </span>
  );
}

function TypeSection({
  label,
  types,
  variant,
  emptyText,
}: {
  label: string;
  types: string[];
  variant: 'weak4' | 'weak2' | 'immune' | 'resist';
  emptyText?: string;
}) {
  if (types.length === 0 && !emptyText) return null;

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      {types.length === 0 ? (
        <p className="text-[13px] text-muted">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {types.map((t) => (
            <TypeBadge key={t} type={t} variant={variant} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PokemonWeaknessPanel({ set }: Props) {
  const hasTera = Boolean(set.teraType && set.teraType !== 'Stellar');
  const [mode, setMode] = useState<DefenseMode>('default');

  useEffect(() => {
    setMode('default');
  }, [set.species, set.forme]);

  const analysis = useMemo(
    () => analyzePokemonDefenses(set, mode),
    [set, mode],
  );

  if (!analysis) return null;

  const modeButton = (value: DefenseMode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        mode === value
          ? 'bg-accent text-on-accent'
          : 'bg-surface-overlay text-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="section-title">Weaknesses</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            {analysis.defendingTypes.join(' / ')} typing
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {modeButton('default', 'Default')}
          {hasTera && set.teraType && modeButton('tera', `Tera ${set.teraType}`)}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <TypeSection label="4× Weak to" types={analysis.weak4x} variant="weak4" />
        <TypeSection
          label="2× Weak to"
          types={analysis.weak2x}
          variant="weak2"
          emptyText={analysis.weak4x.length === 0 ? 'No super-effective weaknesses' : undefined}
        />
        <TypeSection label="Immune to" types={analysis.immune} variant="immune" />
        <TypeSection label="Resists" types={analysis.resist} variant="resist" />

        {analysis.abilityNotes.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-surface-overlay/50 px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Ability</p>
            <ul className="flex flex-col gap-0.5 text-[13px] text-muted">
              {analysis.abilityNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
