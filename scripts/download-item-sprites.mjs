/**
 * Downloads item sprites and builds a lookup manifest.
 * Priority: PokeAPI gen9 → PokeAPI gen8 → PokeSprite (Sw/Sh) → PokeAPI default fallback.
 * @see https://github.com/PokeAPI/sprites/tree/master/sprites/items
 * @see https://github.com/msikma/pokesprite/tree/master/items-outline
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/dex';
import { toSlug } from './sprite-slug-utils.mjs';

const gen9Dex = Dex.forGen(9);

const POKEAPI_REPO = 'PokeAPI/sprites';
const POKEAPI_BRANCH = 'master';
const POKEAPI_RAW = `https://raw.githubusercontent.com/${POKEAPI_REPO}/${POKEAPI_BRANCH}`;

const POKESPRITE_REPO = 'msikma/pokesprite';
const POKESPRITE_BRANCH = 'master';
const POKESPRITE_RAW = `https://raw.githubusercontent.com/${POKESPRITE_REPO}/${POKESPRITE_BRANCH}`;

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const outDir = join(root, 'public/item-sprites');
const gen9OutDir = join(outDir, 'gen9');
const gen8OutDir = join(outDir, 'gen8');
const pokespriteOutDir = join(outDir, 'pokesprite');
const manifestPath = join(root, 'src/data/item-sprites.manifest.json');

const ITEM_SLUG_ALIASES = {
  'up-grade': 'upgrade',
};

function toKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildSlugCandidates(itemName) {
  const slug = toSlug(itemName);
  const candidates = [];

  if (ITEM_SLUG_ALIASES[slug]) candidates.push(ITEM_SLUG_ALIASES[slug]);
  candidates.push(slug);

  return [...new Set(candidates)];
}

function pokespriteKey(num) {
  return `item_${String(num).padStart(4, '0')}`;
}

function resolveItem(item, { gen9Slugs, gen8Slugs, itemMap, defaultSlugs, gen5Slugs }) {
  const candidates = buildSlugCandidates(item.name);

  for (const slug of candidates) {
    if (gen9Slugs.has(slug)) return { slug, tier: 'gen9' };
  }
  for (const slug of candidates) {
    if (gen8Slugs.has(slug)) return { slug, tier: 'gen8' };
  }

  if (item.num != null) {
    const path = itemMap[pokespriteKey(item.num)];
    if (path) return { slug: path, tier: 'pokesprite' };
  }

  for (const slug of candidates) {
    if (defaultSlugs.has(slug)) return { slug, tier: 'default' };
  }
  for (const slug of candidates) {
    if (gen5Slugs.has(slug)) return { slug, tier: 'gen5' };
  }

  return null;
}

async function fetchPokeApiFileLists() {
  const res = await fetch(
    `https://api.github.com/repos/${POKEAPI_REPO}/git/trees/${POKEAPI_BRANCH}?recursive=1`,
  );
  if (!res.ok) throw new Error(`GitHub tree fetch failed: ${res.status}`);
  const data = await res.json();

  const defaultSlugs = new Set();
  const gen5Slugs = new Set();
  const gen8Slugs = new Set();
  const gen9Slugs = new Set();

  for (const entry of data.tree) {
    if (!entry.path.endsWith('.png')) continue;
    if (entry.path.startsWith('sprites/items/gen9/')) {
      gen9Slugs.add(entry.path.split('/').pop().replace(/\.png$/, ''));
    } else if (entry.path.startsWith('sprites/items/gen8/')) {
      gen8Slugs.add(entry.path.split('/').pop().replace(/\.png$/, ''));
    } else if (entry.path.startsWith('sprites/items/gen5/')) {
      gen5Slugs.add(entry.path.split('/').pop().replace(/\.png$/, ''));
    } else if (/^sprites\/items\/[^/]+\.png$/.test(entry.path)) {
      defaultSlugs.add(entry.path.split('/').pop().replace(/\.png$/, ''));
    }
  }

  return { defaultSlugs, gen5Slugs, gen8Slugs, gen9Slugs };
}

async function fetchPokespritePaths() {
  const res = await fetch(
    `https://api.github.com/repos/${POKESPRITE_REPO}/git/trees/${POKESPRITE_BRANCH}?recursive=1`,
  );
  if (!res.ok) throw new Error(`PokeSprite tree fetch failed: ${res.status}`);
  const data = await res.json();

  return data.tree
    .filter((entry) => entry.path.startsWith('items-outline/') && entry.path.endsWith('.png'))
    .map((entry) => entry.path.replace(/^items-outline\//, '').replace(/\.png$/, ''));
}

async function fetchPokespriteItemMap() {
  const res = await fetch(`${POKESPRITE_RAW}/data/item-map.json`);
  if (!res.ok) throw new Error(`PokeSprite item-map fetch failed: ${res.status}`);
  return res.json();
}

async function downloadFile(url, dest) {
  try {
    await access(dest);
    return 'skipped';
  } catch {
    // not cached yet
  }

  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return 'downloaded';
}

async function downloadPokeApiTier(slugs, tier) {
  const dir =
    tier === 'gen9' ? gen9OutDir : tier === 'gen8' ? gen8OutDir : outDir;
  await mkdir(dir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  const list = [...slugs].sort();

  for (let i = 0; i < list.length; i += 10) {
    const batch = list.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(async (slug) => {
        const relativePath =
          tier === 'gen9'
            ? `sprites/items/gen9/${slug}.png`
            : tier === 'gen8'
              ? `sprites/items/gen8/${slug}.png`
              : `sprites/items/${slug}.png`;
        const dest = join(dir, `${slug}.png`);
        return downloadFile(`${POKEAPI_RAW}/${relativePath}`, dest);
      }),
    );
    for (const result of results) {
      if (result === 'downloaded') downloaded++;
      else skipped++;
    }
    process.stdout.write(`\rpokeapi ${tier}: ${Math.min(i + 10, list.length)}/${list.length}`);
  }
  console.log(`\npokeapi ${tier}: downloaded ${downloaded}, skipped ${skipped}`);
}

async function downloadPokesprite(paths) {
  await mkdir(pokespriteOutDir, { recursive: true });

  let downloaded = 0;
  let skipped = 0;

  for (let i = 0; i < paths.length; i += 10) {
    const batch = paths.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(async (relativePath) => {
        const dest = join(pokespriteOutDir, `${relativePath}.png`);
        return downloadFile(`${POKESPRITE_RAW}/items-outline/${relativePath}.png`, dest);
      }),
    );
    for (const result of results) {
      if (result === 'downloaded') downloaded++;
      else skipped++;
    }
    process.stdout.write(`\rpokesprite: ${Math.min(i + 10, paths.length)}/${paths.length}`);
  }
  console.log(`\npokesprite: downloaded ${downloaded}, skipped ${skipped}`);
}

function isIncludedItem(item) {
  if (!item.exists) return false;
  if (!item.isNonstandard) return true;
  return Boolean(item.megaStone);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await mkdir(gen9OutDir, { recursive: true });
  await mkdir(gen8OutDir, { recursive: true });
  await mkdir(pokespriteOutDir, { recursive: true });

  console.log('Fetching PokeAPI sprite list…');
  const { defaultSlugs, gen5Slugs, gen8Slugs, gen9Slugs } = await fetchPokeApiFileLists();
  console.log(
    `PokeAPI: ${defaultSlugs.size} default, ${gen5Slugs.size} gen5, ${gen8Slugs.size} gen8, ${gen9Slugs.size} gen9`,
  );

  console.log('Fetching PokeSprite item map…');
  const itemMap = await fetchPokespriteItemMap();
  const pokespritePaths = await fetchPokespritePaths();
  const pokespritePathSet = new Set(pokespritePaths);
  console.log(`PokeSprite: ${pokespritePaths.length} sprites, ${Object.keys(itemMap).length} item-map entries`);

  await downloadPokeApiTier(gen8Slugs, 'gen8');
  await downloadPokeApiTier(gen9Slugs, 'gen9');
  await downloadPokesprite(pokespritePaths);

  const manifest = {};
  const tierCounts = { gen9: 0, gen8: 0, pokesprite: 0, default: 0, gen5: 0 };
  const missing = [];

  for (const id of Object.keys(gen9Dex.data.Items)) {
    const item = gen9Dex.items.get(id);
    if (!isIncludedItem(item)) continue;
    const resolved = resolveItem(item, {
      gen9Slugs,
      gen8Slugs,
      itemMap,
      defaultSlugs,
      gen5Slugs,
    });
    if (resolved) {
      if (resolved.tier === 'pokesprite' && !pokespritePathSet.has(resolved.slug)) {
        missing.push(item.name);
        continue;
      }
      manifest[toKey(item.name)] = resolved;
      tierCounts[resolved.tier]++;
    } else {
      missing.push(item.name);
    }
  }

  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        defaultSlugs: [...defaultSlugs].sort(),
        gen5Slugs: [...gen5Slugs].sort(),
        gen8Slugs: [...gen8Slugs].sort(),
        gen9Slugs: [...gen9Slugs].sort(),
        pokespritePaths: [...pokespritePaths].sort(),
        manifest,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Manifest: ${Object.keys(manifest).length} items mapped`);
  console.log(
    `  gen9: ${tierCounts.gen9}, gen8: ${tierCounts.gen8}, pokesprite: ${tierCounts.pokesprite}, default: ${tierCounts.default}, gen5: ${tierCounts.gen5}`,
  );
  if (missing.length) {
    console.log(
      `Missing sprites (${missing.length}): ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '…' : ''}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
