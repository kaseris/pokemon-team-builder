import { useMemo } from 'react';
import type { PokemonSet } from '../types/pokemon';
import { getTypes } from '../data/dex';
import { TYPE_COLORS } from '../constants/type-colors';
import {
  analyzeOffensiveCoverage,
  type CoverageTier,
} from '../engine/offensive-coverage';
import { ALL_TYPES } from '../engine/type-matchups';

type Props = {
  set: PokemonSet;
};

function tierStyle(tier: CoverageTier, hasMoves: boolean): string {
  if (!hasMoves) return 'bg-surface-overlay text-muted';
  if (tier >= 4) return 'bg-accent text-on-accent ring-1 ring-accent/50';
  if (tier >= 3) return 'bg-accent/80 text-on-accent';
  if (tier >= 2) return 'bg-success/70 text-on-accent';
  if (tier === 1) return 'bg-surface-overlay text-muted';
  if (tier === 0.5) return 'bg-warning/25 text-warning';
  return 'bg-danger/30 text-danger line-through';
}

function tierLabel(tier: CoverageTier): string {
  if (tier === 0) return '0×';
  if (tier === 0.5) return '½×';
  if (tier === 1) return '1×';
  if (tier === 3) return '3×';
  if (tier === 4) return '4×';
  return '2×';
}

export function OffensiveCoveragePanel({ set }: Props) {
  const attackerTypes = set.species ? getTypes(set.species, set.forme) : [];
  const filledMoves = set.moves.filter(Boolean);

  const analysis = useMemo(
    () =>
      set.species
        ? analyzeOffensiveCoverage(set.moves, attackerTypes, set.teraType)
        : null,
    [set.moves, set.species, set.forme, set.teraType, attackerTypes],
  );

  if (!analysis) return null;

  const entryMap = Object.fromEntries(analysis.entries.map((e) => [e.defendingType, e]));

  const movesWithTargets = analysis.entries
    .flatMap((e) =>
      e.bestMoves.map((m) => ({
        move: m.move,
        defendingType: e.defendingType,
        effectiveness: m.effectiveness,
        stab: m.stab,
      })),
    )
    .reduce(
      (acc, row) => {
        if (!acc[row.move]) acc[row.move] = [];
        if (row.effectiveness >= 2) {
          acc[row.move].push({ type: row.defendingType, stab: row.stab });
        }
        return acc;
      },
      {} as Record<string, { type: string; stab: boolean }[]>,
    );

  const moveRows = Object.entries(movesWithTargets).filter(([, hits]) => hits.length > 0);

  return (
    <div className="panel p-4">
      <div className="mb-3">
        <h2 className="section-title">
          Offensive Coverage
        </h2>
        <p className="mt-0.5 text-[13px] text-muted">
          Best damage vs each type · {filledMoves.length} move{filledMoves.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {filledMoves.length === 0 ? (
        <p className="text-sm text-muted">Select moves to see type coverage.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-6 gap-1">
            {ALL_TYPES.map((type) => {
              const entry = entryMap[type];
              const tier = entry?.bestEffectiveness ?? 1;
              const title = entry?.bestMoves.length
                ? entry.bestMoves
                    .map((m) => `${m.move} (${tierLabel(m.effectiveness)}${m.stab ? ', STAB' : ''})`)
                    .join('\n')
                : 'No damaging moves';

              return (
                <div
                  key={type}
                  title={title}
                  className={`rounded px-0.5 py-1.5 text-center text-[11px] font-bold leading-tight ${tierStyle(tier, true)}`}
                >
                  <div className="truncate uppercase opacity-80">{type.slice(0, 3)}</div>
                  <div className="text-xs">{tierLabel(tier)}</div>
                </div>
              );
            })}
          </div>

          {analysis.moveTypes.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                Move types
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.moveTypes.map((t) => (
                  <span
                    key={t}
                    className="rounded px-2 py-0.5 text-[11px] font-semibold uppercase text-white"
                    style={{ background: TYPE_COLORS[t] }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.superEffective.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                Super-effective hits
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.superEffective.map((t) => (
                  <span key={t} className="rounded bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.gaps.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                Neutral only (no 2× hit)
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.gaps.map((t) => (
                  <span key={t} className="rounded bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {moveRows.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">By move</p>
              <ul className="flex flex-col gap-1.5">
                {moveRows.map(([move, hits]) => (
                  <li
                    key={move}
                    className="rounded-lg border border-border/60 bg-surface-overlay/40 px-2.5 py-1.5 text-[13px]"
                  >
                    <span className="font-medium">{move}</span>
                    <span className="text-muted"> → </span>
                    <span className="text-muted">
                      {hits
                        .slice(0, 6)
                        .map((h) => `${h.type}${h.stab ? '*' : ''}`)
                        .join(', ')}
                      {hits.length > 6 ? ` +${hits.length - 6}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-muted">* STAB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
