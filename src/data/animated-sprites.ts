import type { PokemonSet } from '../types/pokemon';
import { speciesKey } from './sprite-keys';
import { buildSlugCandidates } from './sprite-slugs';
import manifest from './animated-sprites.manifest.json';

const FILES = new Set(
  (manifest.files as string[]).map((f) => f.replace(/\.gif$/, '')),
);
const MANIFEST = manifest.manifest as Record<string, string>;
const ANIMATED_SPRITE_BASE = '/pokemon-sprites/animated';

function slugCandidatesForFile(
  baseSlug: string,
  gender?: PokemonSet['gender'],
): string[] {
  const out: string[] = [];

  if (gender === 'F') {
    out.push(`${baseSlug}-female`);
  }
  if (gender === 'M') {
    out.push(`${baseSlug}-male`);
  }

  out.push(baseSlug);

  for (const alt of buildSlugCandidates(baseSlug)) {
    if (gender === 'F') out.push(`${alt}-female`);
    if (gender === 'M') out.push(`${alt}-male`);
    out.push(alt);
  }

  return [...new Set(out)];
}

function firstAvailableSlug(candidates: string[]): string | null {
  for (const slug of candidates) {
    if (FILES.has(slug)) return slug;
  }
  return null;
}

/** SV idle GIF from scaviogifs — preferred over Showdown when present. */
export function getAnimatedSpriteUrl(
  species: string,
  forme?: string,
  gender?: PokemonSet['gender'],
): string | null {
  if (!species) return null;

  const baseSlug = MANIFEST[speciesKey(species, forme)];
  if (!baseSlug) return null;

  const slug = firstAvailableSlug(slugCandidatesForFile(baseSlug, gender));
  if (!slug) return null;

  return `${ANIMATED_SPRITE_BASE}/${slug}.gif`;
}

export const ANIMATED_SPRITE_CREDIT = manifest.credit as string;
