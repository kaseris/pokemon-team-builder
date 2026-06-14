import { gen9, toID } from '../data/dex';
import type { PokemonType, TeraType } from '../types/pokemon';
import { getTypeMultiplier, TYPE_NAMES } from '../data/type-chart';

export type CoverageTier = 0 | 0.5 | 1 | 2 | 3 | 4;

export type MoveCoverage = {
  move: string;
  moveType: PokemonType;
  effectiveness: CoverageTier;
  stab: boolean;
};

export type TypeCoverageEntry = {
  defendingType: PokemonType;
  bestEffectiveness: CoverageTier;
  bestMoves: MoveCoverage[];
};

export type OffensiveCoverageAnalysis = {
  entries: TypeCoverageEntry[];
  /** Defending types hit for ≥2× (before STAB) */
  superEffective: PokemonType[];
  /** Defending types with no ≥2× hit */
  gaps: PokemonType[];
  /** Defending types only hit for ≤0.5× or immune */
  poor: PokemonType[];
  /** Move types represented (non-status) */
  moveTypes: PokemonType[];
};

function resolveMoveType(
  moveName: string,
  teraType?: TeraType,
): { type: PokemonType; category: string } | null {
  const id = toID(moveName);
  if (id === 'terablast' && teraType && teraType !== 'Stellar') {
    return { type: teraType as PokemonType, category: 'Special' };
  }

  const move = gen9.moves.get(id);
  if (!move) return null;
  return { type: move.type as PokemonType, category: move.category };
}

function hasStab(moveType: PokemonType, attackerTypes: string[], teraType?: TeraType): boolean {
  if (teraType && teraType !== 'Stellar' && moveType === teraType) return true;
  return attackerTypes.includes(moveType);
}

function toTier(value: number): CoverageTier {
  if (value === 0) return 0;
  if (value <= 0.5) return 0.5;
  if (value <= 1) return 1;
  if (value <= 2) return 2;
  if (value <= 3) return 3;
  return 4;
}

export function analyzeOffensiveCoverage(
  moves: string[],
  attackerTypes: string[],
  teraType?: TeraType,
): OffensiveCoverageAnalysis {
  const filledMoves = moves.filter(Boolean);
  const moveTypes = new Set<PokemonType>();
  const entries: TypeCoverageEntry[] = [];

  for (const defendingType of TYPE_NAMES) {
    let bestEff = 0;
    let bestMoves: MoveCoverage[] = [];

    for (const moveName of filledMoves) {
      const resolved = resolveMoveType(moveName, teraType);
      if (!resolved || resolved.category === 'Status') continue;

      moveTypes.add(resolved.type);

      const typeEff = getTypeMultiplier(resolved.type, [defendingType]);
      const stab = hasStab(resolved.type, attackerTypes, teraType);
      const totalEff = typeEff * (stab ? 1.5 : 1);
      const tier = toTier(totalEff);

      const entry: MoveCoverage = {
        move: moveName,
        moveType: resolved.type,
        effectiveness: tier,
        stab,
      };

      if (totalEff > bestEff) {
        bestEff = totalEff;
        bestMoves = [entry];
      } else if (totalEff === bestEff && bestEff > 0) {
        bestMoves.push(entry);
      }
    }

    entries.push({
      defendingType,
      bestEffectiveness: toTier(bestEff),
      bestMoves,
    });
  }

  const superEffective = entries
    .filter((e) => e.bestEffectiveness >= 2)
    .map((e) => e.defendingType);

  const gaps = entries
    .filter((e) => e.bestEffectiveness < 2 && e.bestEffectiveness > 0)
    .map((e) => e.defendingType);

  const poor = entries
    .filter((e) => e.bestEffectiveness === 0 || e.bestEffectiveness <= 0.5)
    .map((e) => e.defendingType);

  return {
    entries,
    superEffective,
    gaps,
    poor,
    moveTypes: [...moveTypes],
  };
}

export function getTeamOffensiveCoverage(
  sets: { moves: string[]; species: string; forme?: string; teraType?: TeraType }[],
  getTypes: (species: string, forme?: string) => string[],
): Record<PokemonType, number> {
  const combined = {} as Record<PokemonType, number>;
  for (const type of TYPE_NAMES) combined[type] = 0;

  for (const set of sets) {
    if (!set.species) continue;
    const types = getTypes(set.species, set.forme);
    const analysis = analyzeOffensiveCoverage(set.moves, types, set.teraType);
    for (const type of analysis.superEffective) {
      combined[type]++;
    }
  }

  return combined;
}
