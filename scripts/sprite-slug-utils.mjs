/** Shared slug helpers for download scripts. */

export const FORM_SLUG_ALIASES = {
  'tauros-paldea-combat': 'tauros-paldean',
  'tauros-paldea-blaze': 'tauros-paldean-fire',
  'tauros-paldea-aqua': 'tauros-paldean-water',
  ogerpon: 'ogerpon-teal-mask',
  'ogerpon-wellspring': 'ogerpon-wellspring-mask',
  'ogerpon-hearthflame': 'ogerpon-hearthflame-mask',
  'ogerpon-cornerstone': 'ogerpon-cornerstone-mask',
};

export function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[''.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function buildSlugCandidates(speciesName) {
  const slug = toSlug(speciesName);
  const candidates = [];

  if (FORM_SLUG_ALIASES[slug]) candidates.push(FORM_SLUG_ALIASES[slug]);

  if (slug.endsWith('-hisui')) candidates.push(slug.replace(/-hisui$/, '-hisuian'));
  if (slug.endsWith('-alola')) candidates.push(slug.replace(/-alola$/, '-alolan'));
  if (slug.endsWith('-galar')) candidates.push(slug.replace(/-galar$/, '-galarian'));

  candidates.push(slug);

  if (!slug.endsWith('-form') && !slug.endsWith('-forme')) {
    candidates.push(`${slug}-form`, `${slug}-forme`);
  }
  if (slug.endsWith('-form')) candidates.push(slug.replace(/-form$/, ''));
  if (slug.endsWith('-forme')) candidates.push(slug.replace(/-forme$/, ''));

  return [...new Set(candidates)];
}

export function tumblrSlugToFileSlug(slug) {
  if (!slug || slug === 'and-were-done') return null;

  let s = slug.replace(/^\d+-/, '');
  s = s.replace(/-order-of-gifs.*$/, '');

  if (!s || /^(hi-|hello-|sorry-|question|looking-for|would-|about-|small-update|so-as-it|your-posts|i-get-questions|i-dont-know|out-of-curiosity|i-wanted-to)/.test(s)) {
    return null;
  }

  return s;
}
