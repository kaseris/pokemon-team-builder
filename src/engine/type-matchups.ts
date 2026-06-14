import type { PokemonType } from '../types/pokemon';
import { gen9 } from '../data/dex';
import { getTypeMultiplier, TYPE_NAMES } from '../data/type-chart';

export type Effectiveness = 0 | 0.5 | 1 | 2 | 4;

const ALL_TYPES: PokemonType[] = TYPE_NAMES;

export function getEffectiveness(attacking: string, defending: string[]): number {
  if (defending.length === 0) return 1;
  return getTypeMultiplier(attacking as PokemonType, defending as PokemonType[]);
}

export function getDefensiveProfile(types: string[]): Record<PokemonType, Effectiveness> {
  const profile = {} as Record<PokemonType, Effectiveness>;

  for (const type of ALL_TYPES) {
    const eff = getEffectiveness(type, types);
    profile[type] = eff as Effectiveness;
  }

  return profile;
}

export function summarizeDefenses(profile: Record<PokemonType, Effectiveness>) {
  const weak: PokemonType[] = [];
  const resist: PokemonType[] = [];
  const immune: PokemonType[] = [];

  for (const [type, eff] of Object.entries(profile) as [PokemonType, Effectiveness][]) {
    if (eff >= 2) weak.push(type);
    else if (eff === 0) immune.push(type);
    else if (eff <= 0.5) resist.push(type);
  }

  return { weak, resist, immune };
}

export function getTeamDefensiveSummary(teamTypes: string[][]) {
  const combined = {} as Record<PokemonType, { weak: number; resist: number; immune: number }>;

  for (const type of ALL_TYPES) {
    combined[type] = { weak: 0, resist: 0, immune: 0 };
  }

  for (const types of teamTypes) {
    const profile = getDefensiveProfile(types);
    for (const [type, eff] of Object.entries(profile) as [PokemonType, Effectiveness][]) {
      if (eff >= 2) combined[type].weak++;
      else if (eff === 0) combined[type].immune++;
      else if (eff <= 0.5) combined[type].resist++;
    }
  }

  return combined;
}

export function getOffensiveCoverage(moves: string[]): Record<PokemonType, boolean> {
  const coverage = {} as Record<PokemonType, boolean>;
  for (const type of ALL_TYPES) coverage[type] = false;

  for (const moveName of moves) {
    const move = gen9.moves.get(moveName);
    if (move && move.category !== 'Status') {
      coverage[move.type as PokemonType] = true;
    }
  }

  return coverage;
}

export { ALL_TYPES };
