import manifest from './item-sprites.manifest.json';

const GEN9_SLUGS = new Set(manifest.gen9Slugs as string[]);
const GEN8_SLUGS = new Set(manifest.gen8Slugs as string[]);
const DEFAULT_SLUGS = new Set(manifest.defaultSlugs as string[]);
const GEN5_SLUGS = new Set(manifest.gen5Slugs as string[]);
const POKESPRITE_PATHS = new Set(manifest.pokespritePaths as string[]);
const MANIFEST = manifest.manifest as Record<
  string,
  { slug: string; tier: ItemSpriteTier }
>;

const ITEM_SLUG_ALIASES: Record<string, string> = {
  'up-grade': 'upgrade',
};

export function itemToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function itemToKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildSlugCandidates(itemName: string): string[] {
  const slug = itemToSlug(itemName);
  const candidates: string[] = [];

  if (ITEM_SLUG_ALIASES[slug]) candidates.push(ITEM_SLUG_ALIASES[slug]);
  candidates.push(slug);

  return [...new Set(candidates)];
}

export type ItemSpriteTier = 'default' | 'gen5' | 'gen8' | 'gen9' | 'pokesprite';

/** PokeAPI gen8/gen9 folders use large PNGs; PokeSprite uses crisp 32×32 Sw/Sh art. */
export function isHighResItemTier(tier: ItemSpriteTier): boolean {
  return tier === 'gen8' || tier === 'gen9' || tier === 'pokesprite';
}

export function resolveItemSprite(
  itemName: string,
): { slug: string; tier: ItemSpriteTier } | null {
  if (!itemName) return null;

  const manifestHit = MANIFEST[itemToKey(itemName)];
  if (manifestHit) return manifestHit;

  for (const slug of buildSlugCandidates(itemName)) {
    if (GEN9_SLUGS.has(slug)) return { slug, tier: 'gen9' };
    if (GEN8_SLUGS.has(slug)) return { slug, tier: 'gen8' };
  }

  for (const slug of buildSlugCandidates(itemName)) {
    for (const path of POKESPRITE_PATHS) {
      if (path.endsWith(`/${slug}`) || path === slug) {
        return { slug: path, tier: 'pokesprite' };
      }
    }
  }

  for (const slug of buildSlugCandidates(itemName)) {
    if (DEFAULT_SLUGS.has(slug)) return { slug, tier: 'default' };
    if (GEN5_SLUGS.has(slug)) return { slug, tier: 'gen5' };
  }

  return null;
}
