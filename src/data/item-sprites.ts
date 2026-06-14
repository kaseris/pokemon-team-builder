import { resolveItemSprite, type ItemSpriteTier } from './item-slugs';

const POKEAPI_ITEMS =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

const POKESPRITE_ITEMS =
  'https://raw.githubusercontent.com/msikma/pokesprite/master/items-outline';

const LOCAL_BASE = '/item-sprites';

const TIER_PATH: Record<ItemSpriteTier, (slug: string) => string> = {
  default: (slug) => `${slug}.png`,
  gen5: (slug) => `gen5/${slug}.png`,
  gen8: (slug) => `gen8/${slug}.png`,
  gen9: (slug) => `gen9/${slug}.png`,
  pokesprite: (slug) => `pokesprite/${slug}.png`,
};

const TIER_CDN: Record<ItemSpriteTier, (slug: string) => string> = {
  default: (slug) => `${POKEAPI_ITEMS}/${slug}.png`,
  gen5: (slug) => `${POKEAPI_ITEMS}/gen5/${slug}.png`,
  gen8: (slug) => `${POKEAPI_ITEMS}/gen8/${slug}.png`,
  gen9: (slug) => `${POKEAPI_ITEMS}/gen9/${slug}.png`,
  pokesprite: (slug) => `${POKESPRITE_ITEMS}/${slug}.png`,
};

function buildPaths(slug: string, tier: ItemSpriteTier) {
  const relative = TIER_PATH[tier](slug);
  return {
    local: `${LOCAL_BASE}/${relative}`,
    cdn: TIER_CDN[tier](slug),
    tier,
  };
}

export { isHighResItemTier } from './item-slugs';

/** Item sprite paths: PokeAPI gen9/gen8 high-res, then PokeSprite Sw/Sh art. */
export function getItemSpriteSources(itemName: string): {
  local: string;
  cdn: string;
  tier: ItemSpriteTier;
} | null {
  const resolved = resolveItemSprite(itemName);
  if (!resolved) return null;
  return buildPaths(resolved.slug, resolved.tier);
}

/** Prefer locally downloaded sprites; fall back to CDN in the component. */
export function getItemSpriteUrl(itemName: string): string | null {
  return getItemSpriteSources(itemName)?.local ?? null;
}
