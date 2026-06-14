import { getAllRawItems, getRawItem, toID } from '../data/dex';
import { itemToSlug } from '../data/item-slugs';
import type { GameItem } from '../types/items';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

type PokeApiList = {
  count: number;
  next: string | null;
  results: { name: string; url: string }[];
};

let cache: { items: GameItem[]; source: 'pokeapi' | 'dex' } | null = null;

function isIncludedItem(item: ReturnType<typeof getRawItem>): boolean {
  if (!item?.exists) return false;
  if (!item.isNonstandard) return true;
  // Mega stones marked Past or Future (Champions) are omitted from PokeAPI but kept in the dex.
  return Boolean(item.megaStone);
}

function itemToGameItem(item: NonNullable<ReturnType<typeof getRawItem>>): GameItem | null {
  if (!isIncludedItem(item)) return null;

  let category: string | undefined;
  if (item.megaStone) category = 'Mega Stone';
  else if (item.isBerry) category = 'Berry';
  else if (item.isGem) category = 'Gem';
  else if (item.onPlate) category = 'Plate';
  else if (item.zMove) category = 'Z-Crystal';
  else if (item.naturalGift) category = 'Natural Gift';
  else if (item.isChoice) category = 'Choice';

  const searchTerms: string[] = [];
  if (item.itemUser) {
    for (const user of item.itemUser) searchTerms.push(user.toLowerCase());
  }
  if (item.megaStone) {
    for (const species of Object.keys(item.megaStone)) searchTerms.push(species.toLowerCase());
  }

  return {
    name: item.name,
    category,
    searchTerms: searchTerms.length > 0 ? [...new Set(searchTerms)] : undefined,
  };
}

function toGameItem(name: string): GameItem | null {
  const item = getRawItem(name);
  return item ? itemToGameItem(item) : null;
}

function resolveItemName(pokeApiName: string): string | null {
  const candidates = [
    toID(pokeApiName),
    toID(pokeApiName.replace(/-/g, '')),
    toID(pokeApiName.replace(/-/g, ' ')),
  ];

  for (const id of candidates) {
    const item = getRawItem(id);
    if (item && isIncludedItem(item)) return item.name;
  }

  return null;
}

function mergeItems(entries: GameItem[]): GameItem[] {
  const map = new Map<string, GameItem>();
  for (const entry of entries) {
    if (!map.has(entry.name)) map.set(entry.name, entry);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchFromPokeApi(): Promise<GameItem[]> {
  const parsed: GameItem[] = [];
  let url: string | null = `${POKEAPI_BASE}/item?limit=100`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PokeAPI error (${res.status}) fetching items`);

    const data = (await res.json()) as PokeApiList;
    for (const entry of data.results) {
      const showdownName = resolveItemName(entry.name);
      if (!showdownName) continue;
      const gameItem = toGameItem(showdownName);
      if (gameItem) parsed.push(gameItem);
    }

    url = data.next;
  }

  return mergeItems(parsed);
}

function fetchFromDex(): GameItem[] {
  return mergeItems(
    getAllRawItems()
      .map((item) => itemToGameItem(item))
      .filter((item): item is GameItem => item !== null),
  );
}

export async function fetchItems(): Promise<{ items: GameItem[]; source: 'pokeapi' | 'dex' }> {
  if (cache) return cache;

  const dexItems = fetchFromDex();

  try {
    const pokeApiItems = await fetchFromPokeApi();
    if (pokeApiItems.length > 0) {
      // Merge dex-only entries (e.g. Champions Future mega stones like Excadrite).
      cache = { items: mergeItems([...pokeApiItems, ...dexItems]), source: 'pokeapi' };
      return cache;
    }
  } catch {
    // fall through to dex
  }

  cache = { items: dexItems, source: 'dex' };
  return cache;
}

export function clearItemsCache() {
  cache = null;
}

type PokeApiItemDetail = {
  effect_entries?: {
    effect: string;
    short_effect: string;
    language: { name: string };
  }[];
  flavor_text_entries?: {
    text: string;
    language: { name: string };
  }[];
};

const effectCache = new Map<string, string | null>();

// PokeAPI wraps flavor text with hard line breaks and form-feed characters.
function normalizeEffectText(text: string): string {
  return text.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function dexFallbackEffect(itemName: string): string | null {
  const item = getRawItem(itemName);
  const desc = item?.desc || item?.shortDesc;
  return desc ? normalizeEffectText(desc) : null;
}

/**
 * Fetch a human-readable description of an item's in-battle effect, preferring
 * PokeAPI's English effect text and falling back to the Showdown dex blurb.
 * Results (including failures) are cached per item name for the session.
 */
export async function fetchItemEffect(itemName: string): Promise<string | null> {
  if (effectCache.has(itemName)) return effectCache.get(itemName) ?? null;

  let effect: string | null = null;

  try {
    const res = await fetch(`${POKEAPI_BASE}/item/${itemToSlug(itemName)}`);
    if (res.ok) {
      const data = (await res.json()) as PokeApiItemDetail;
      const english = data.effect_entries?.find((e) => e.language.name === 'en');
      const flavor = data.flavor_text_entries?.find((e) => e.language.name === 'en');
      const raw = english?.short_effect || english?.effect || flavor?.text;
      if (raw) effect = normalizeEffectText(raw);
    }
  } catch {
    // fall through to dex blurb
  }

  if (!effect) effect = dexFallbackEffect(itemName);

  effectCache.set(itemName, effect);
  return effect;
}
