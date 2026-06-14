import type { PokemonType } from '../types/pokemon';

const TYPE_ICON_SLUG: Partial<Record<PokemonType, string>> = {
  Normal: 'normal',
  Fire: 'fire',
  Water: 'water',
  Grass: 'grass',
  Electric: 'electric',
  Ice: 'ice',
  Fighting: 'fighting',
  Poison: 'poison',
  Ground: 'ground',
  Flying: 'flying',
  Psychic: 'psychic',
  Bug: 'bug',
  Rock: 'rock',
  Ghost: 'ghost',
  Dragon: 'dragon',
  Dark: 'dark',
  Steel: 'steel',
  Fairy: 'fairy',
};

/** Local Serebii SV type icons (64×64) served from /public/type-icons/ */
export function getTypeIconUrl(type: string): string | null {
  const slug = TYPE_ICON_SLUG[type as PokemonType];
  if (!slug) return null;
  return `/type-icons/${slug}.png`;
}

const SHOWDOWN_TYPE_SPRITES = 'https://play.pokemonshowdown.com/sprites/types';

/** Showdown Tera type badges (crystal-bordered) — public CDN. */
export function getTeraTypeIconUrl(type: string): string | null {
  if (type === 'Stellar') return `${SHOWDOWN_TYPE_SPRITES}/TeraStellar.png`;
  const slug = TYPE_ICON_SLUG[type as PokemonType];
  if (!slug) return null;
  return `${SHOWDOWN_TYPE_SPRITES}/Tera${type}.png`;
}

export const TYPE_ICON_SIZE = 64;
