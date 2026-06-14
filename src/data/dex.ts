import { Dex, toID } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import type { StatsTable } from '../types/pokemon';

export const dex = Dex;
export const generations = new Generations(Dex);
export const gen9 = generations.get(9);
/** Unfiltered Gen 9 dex — includes Past items like mega stones. */
export const gen9Dex = Dex.forGen(9);

export { toID };

export function getRawItem(name: string) {
  return gen9Dex.items.get(toID(name));
}

export function getAllRawItems() {
  return Object.keys(gen9Dex.data.Items)
    .map((id) => gen9Dex.items.get(id))
    .filter((item): item is NonNullable<typeof item> => item != null);
}

function isIncludedSpecies(species: NonNullable<ReturnType<typeof gen9Dex.species.get>>): boolean {
  if (!species.exists) return false;
  if (!species.isNonstandard) return true;

  // Past species with Mega Evolution (Champions / natdex megas).
  if (species.otherFormes?.some((forme) => forme.includes('Mega'))) return true;
  if (species.forme === 'Mega' && species.baseSpecies) {
    const base = gen9Dex.species.get(toID(species.baseSpecies));
    return Boolean(base?.otherFormes?.some((forme) => forme.includes('Mega')));
  }

  // New Champions species and megas not yet in SV.
  if (species.isNonstandard === 'Future') return true;

  return false;
}

export function getRawSpecies(name: string) {
  return gen9Dex.species.get(toID(name));
}

export function getAllIncludedSpecies() {
  return Object.keys(gen9Dex.data.Species)
    .map((id) => gen9Dex.species.get(id))
    .filter(
      (species): species is NonNullable<typeof species> =>
        species != null && isIncludedSpecies(species),
    );
}

export function displayName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

export function getSpeciesList() {
  return getAllIncludedSpecies().sort((a, b) => a.name.localeCompare(b.name));
}

export function getSpecies(name: string) {
  const species = getRawSpecies(name);
  return species && isIncludedSpecies(species) ? species : undefined;
}

export function getMove(name: string) {
  return gen9.moves.get(toID(name));
}

export function getItem(name: string) {
  return gen9.items.get(toID(name));
}

export function getAbility(name: string) {
  return gen9.abilities.get(toID(name));
}

export function getNature(name: string) {
  return gen9.natures.get(toID(name));
}

export async function canLearn(species: string, move: string, forme?: string) {
  const fullName = forme ? `${species}-${forme}` : species;
  return gen9.learnsets.canLearn(fullName, move);
}

export function getLegalAbilities(speciesName: string, forme?: string): string[] {
  const name = forme ? `${speciesName}-${forme}` : speciesName;
  const species = getSpecies(name);
  if (!species) return [];

  const abilities: string[] = [];
  if (species.abilities[0]) abilities.push(species.abilities[0]);
  if (species.abilities[1]) abilities.push(species.abilities[1]);
  if (species.abilities.H) abilities.push(species.abilities.H);
  return [...new Set(abilities)];
}

export function getTypes(speciesName: string, forme?: string): string[] {
  const name = forme ? `${speciesName}-${forme}` : speciesName;
  const species = getSpecies(name);
  return species ? [...species.types] : [];
}

export function getBaseStats(speciesName: string, forme?: string): StatsTable | null {
  const name = forme ? `${speciesName}-${forme}` : speciesName;
  const species = getSpecies(name);
  if (!species) return null;
  return { ...species.baseStats };
}
