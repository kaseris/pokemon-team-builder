import type { PokemonType } from '../types/pokemon';
import { gen9 } from './dex';

export const TYPE_NAMES: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

/** Gen 9 type chart: TYPE_CHART[attacking][defending] → multiplier (0, 0.5, 1, 2) */
export const TYPE_CHART: Record<PokemonType, Record<PokemonType, number>> = {} as Record<
  PokemonType,
  Record<PokemonType, number>
>;

for (const attacking of TYPE_NAMES) {
  const type = gen9.types.get(attacking);
  const row = {} as Record<PokemonType, number>;
  for (const defending of TYPE_NAMES) {
    row[defending] = type?.effectiveness[defending] ?? 1;
  }
  TYPE_CHART[attacking] = row;
}

export function getTypeMultiplier(attacking: PokemonType, defending: PokemonType[]): number {
  if (defending.length === 0) return 1;
  return defending.reduce(
    (total, defType) => total * (TYPE_CHART[attacking][defType] ?? 1),
    1,
  );
}

export function getDefendingTypesFromChart(
  attacking: PokemonType,
  defending: PokemonType[],
): number {
  return getTypeMultiplier(attacking, defending);
}
