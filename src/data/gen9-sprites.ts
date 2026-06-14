import type { PokemonSet } from '../types/pokemon';
import manifest from './gen9-sprites.manifest.json';
import { speciesKey } from './sprite-keys';

const SLUGS = new Set(manifest.slugs as string[]);
const MANIFEST = manifest.manifest as Record<string, string>;
const GEN9_SPRITE_BASE = '/pokemon-sprites/gen-9';

function slugCandidates(
  baseSlug: string,
  gender?: PokemonSet['gender'],
): string[] {
  const out: string[] = [];

  if (gender === 'F') {
    out.push(`${baseSlug}-female-v2`, `${baseSlug}-female`);
  }
  if (gender === 'M') {
    out.push(`${baseSlug}-male-v2`, `${baseSlug}-male`);
  }

  out.push(`${baseSlug}-v2`, baseSlug);
  return out;
}

function firstAvailableSlug(candidates: string[]): string | null {
  for (const slug of candidates) {
    if (SLUGS.has(slug)) return slug;
  }
  return null;
}

/** Gen 9 style sprite from remokon/gen-9-sprites. */
export function getGen9SpriteUrl(
  species: string,
  forme?: string,
  gender?: PokemonSet['gender'],
): string | null {
  if (!species) return null;

  const baseSlug = MANIFEST[speciesKey(species, forme)];
  if (!baseSlug) return null;

  const slug = firstAvailableSlug(slugCandidates(baseSlug, gender));
  if (!slug) return null;

  return `${GEN9_SPRITE_BASE}/${slug}.png`;
}
