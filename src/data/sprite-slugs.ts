/** Shared slug normalization for local sprite manifests (gen-9 PNG, animated GIF). */

export const FORM_SLUG_ALIASES = {
  'tauros-paldea-combat': 'tauros-paldean',
  'tauros-paldea-blaze': 'tauros-paldean-fire',
  'tauros-paldea-aqua': 'tauros-paldean-water',
  ogerpon: 'ogerpon-teal-mask',
  'ogerpon-wellspring': 'ogerpon-wellspring-mask',
  'ogerpon-hearthflame': 'ogerpon-hearthflame-mask',
  'ogerpon-cornerstone': 'ogerpon-cornerstone-mask',
} as const;

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Candidate local file slugs (no extension) for a Showdown species name. */
export function buildSlugCandidates(speciesName: string): string[] {
  const slug = toSlug(speciesName);
  const candidates: string[] = [];

  const alias = FORM_SLUG_ALIASES[slug as keyof typeof FORM_SLUG_ALIASES];
  if (alias) candidates.push(alias);

  if (slug.endsWith('-hisui')) candidates.push(slug.replace(/-hisui$/, '-hisuian'));
  if (slug.endsWith('-alola')) candidates.push(slug.replace(/-alola$/, '-alolan'));
  if (slug.endsWith('-galar')) candidates.push(slug.replace(/-galar$/, '-galarian'));

  candidates.push(slug);

  if (!slug.endsWith('-form') && !slug.endsWith('-forme')) {
    candidates.push(`${slug}-form`, `${slug}-forme`);
  }
  if (slug.endsWith('-form')) {
    candidates.push(slug.replace(/-form$/, ''));
  }
  if (slug.endsWith('-forme')) {
    candidates.push(slug.replace(/-forme$/, ''));
  }

  return [...new Set(candidates)];
}

export function tumblrSlugToFileSlug(slug: string): string | null {
  if (!slug || slug === 'and-were-done') return null;

  let s = slug.replace(/^\d+-/, '');
  s = s.replace(/-order-of-gifs.*$/, '');

  if (!s || /^[a-z]{2,}-(hi-|hello-|sorry-|question|looking|would-|about-|small-update|so-as-it|your-posts|i-get|i-dont|out-of|i-wanted)/.test(s)) {
    return null;
  }

  return s;
}
