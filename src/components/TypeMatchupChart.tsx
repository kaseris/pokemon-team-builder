import type { PokemonSet, PokemonType } from '../types/pokemon';
import { ALL_TYPES, getTeamDefensiveSummary } from '../engine/type-matchups';
import { getTeamOffensiveCoverage } from '../engine/offensive-coverage';
import { getTypes } from '../data/dex';

type Props = {
  sets: PokemonSet[];
};

type Intensity = 'high-danger' | 'danger' | 'immune' | 'resist' | 'neutral' | 'high-success' | 'success' | 'partial' | 'gap';

const INTENSITY_CLASS: Record<Intensity, string> = {
  'high-danger': 'bg-danger/60 text-foreground',
  danger: 'bg-danger/30 text-foreground',
  immune: 'bg-success/40 text-foreground',
  resist: 'bg-success/20 text-muted',
  neutral: 'bg-surface-overlay text-muted',
  'high-success': 'bg-accent text-on-accent',
  success: 'bg-success/60 text-on-accent',
  partial: 'bg-success/25 text-success',
  gap: 'bg-surface-overlay text-muted opacity-60',
};

export function TypeMatchupChart({ sets }: Props) {
  const teamTypes = sets
    .filter((s) => s.species)
    .map((s) => getTypes(s.species, s.forme));

  const defSummary = getTeamDefensiveSummary(teamTypes);
  const offSummary = getTeamOffensiveCoverage(
    sets.filter((s) => s.species),
    getTypes,
  );

  const teamWeaknesses = ALL_TYPES.filter((t) => defSummary[t].weak >= 2);
  const defGaps = ALL_TYPES.filter((t) => defSummary[t].weak >= 3);
  const offGaps = ALL_TYPES.filter((t) => offSummary[t] === 0);

  const activeSets = sets.filter((s) => s.species && s.moves.some(Boolean));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="section-title">Team Coverage</h2>
        <p className="mt-0.5 text-[13px] text-muted">Defensive & offensive profiles</p>
      </div>

      {sets.length === 0 ? (
        <p className="text-sm text-muted">Add Pokémon to see type analysis.</p>
      ) : (
        <>
          <section>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Defense — team weak to
            </p>
            <TypeGrid
              types={ALL_TYPES}
              getIntensity={(type: PokemonType) => {
                const data = defSummary[type];
                if (data.weak >= 3) return 'high-danger';
                if (data.weak >= 2) return 'danger';
                if (data.immune >= 2) return 'immune';
                if (data.resist >= 3) return 'resist';
                return 'neutral';
              }}
              getTitle={(type: PokemonType) => {
                const data = defSummary[type];
                return `${data.weak} weak · ${data.resist} resist · ${data.immune} immune`;
              }}
            />
          </section>

          <section>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Offense — SE hit by N Pokémon
            </p>
            {activeSets.length === 0 ? (
              <p className="text-xs text-muted">Add moves to Pokémon for offensive coverage.</p>
            ) : (
              <TypeGrid
                types={ALL_TYPES}
                getIntensity={(type: PokemonType) => {
                  const count = offSummary[type];
                  if (count >= 3) return 'high-success';
                  if (count >= 2) return 'success';
                  if (count === 1) return 'partial';
                  return 'gap';
                }}
                getTitle={(type: PokemonType) => {
                  const count = offSummary[type];
                  return count === 0
                    ? 'No Pokémon hits this type for 2×+'
                    : `${count} Pokémon hit ${type} for 2×+`;
                }}
                showCount={(type: PokemonType) => offSummary[type] || undefined}
              />
            )}
          </section>

          {teamWeaknesses.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted">Shared defensive weaknesses</p>
              <div className="flex flex-wrap gap-1">
                {teamWeaknesses.map((t) => (
                  <span key={t} className="rounded bg-danger/20 px-2 py-0.5 text-xs text-danger">
                    {t} ({defSummary[t].weak})
                  </span>
                ))}
              </div>
            </div>
          )}

          {offGaps.length > 0 && activeSets.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted">Offensive gaps (no 2× hit)</p>
              <div className="flex flex-wrap gap-1">
                {offGaps.map((t) => (
                  <span key={t} className="rounded bg-warning/15 px-2 py-0.5 text-xs text-warning">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {defGaps.length > 0 && (
            <p className="text-xs text-warning">
              ⚠ {defGaps.length} type{defGaps.length !== 1 ? 's' : ''} hit 3+ team members defensively
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TypeGrid({
  types,
  getIntensity,
  getTitle,
  showCount,
}: {
  types: readonly PokemonType[];
  getIntensity: (type: PokemonType) => Intensity;
  getTitle: (type: PokemonType) => string;
  showCount?: (type: PokemonType) => number | undefined;
}) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {types.map((type) => {
        const count = showCount?.(type);
        return (
          <div
            key={type}
            title={getTitle(type)}
            className={`rounded px-0.5 py-1.5 text-center text-[11px] font-semibold uppercase leading-tight ${INTENSITY_CLASS[getIntensity(type)]}`}
          >
            <div>{type.slice(0, 3)}</div>
            {count !== undefined && count > 0 && (
              <div className="text-[10px] font-bold">{count}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
