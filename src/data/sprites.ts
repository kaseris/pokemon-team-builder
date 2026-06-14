import { Sprites, Icons } from '@pkmn/img';
import type { PokemonSet } from '../types/pokemon';

export type SpriteSize = 'icon' | 'sm' | 'lg' | 'xl';

export function speciesSpriteName(species: string, forme?: string): string {
  if (!species) return '';
  if (forme && !species.includes('-')) return `${species}-${forme}`;
  return species;
}

export type BattleSprite = NonNullable<ReturnType<typeof getBattleSprite>>;

export function getBattleSprite(
  species: string,
  forme?: string,
  options?: { gender?: PokemonSet['gender']; shiny?: boolean },
) {
  const name = speciesSpriteName(species, forme);
  if (!name) return null;

  return Sprites.getPokemon(name, {
    gen: 'ani',
    side: 'p2',
    gender: options?.gender,
    shiny: options?.shiny,
  });
}

/** True when Showdown serves a real animated GIF (not a Gen 5 static PNG fallback). */
export function isAnimatedBattleSprite(sprite: BattleSprite | null | undefined): boolean {
  return Boolean(sprite?.url && /\.gif(\?|$)/i.test(sprite.url));
}

export function getIconSprite(
  species: string,
  forme?: string,
  options?: { gender?: PokemonSet['gender']; fainted?: boolean },
) {
  const name = speciesSpriteName(species, forme);
  if (!name) return null;

  return Icons.getPokemon(name, {
    gender: options?.gender,
    fainted: options?.fainted,
  });
}

export const SPRITE_DISPLAY = {
  icon: { width: 40, height: 30 },
  sm: { width: 64, height: 64 },
  party: { width: 112, height: 112 },
  lg: { width: 128, height: 128 },
  xl: { width: 220, height: 220 },
  hero: { width: 300, height: 300 },
} as const;

export function getItemIcon(itemName: string) {
  if (!itemName) return null;
  try {
    return Icons.getItem(itemName);
  } catch {
    return null;
  }
}
