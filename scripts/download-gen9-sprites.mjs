/**
 * Downloads Gen 9 style sprites from remokon/gen-9-sprites and builds a lookup manifest.
 * @see https://github.com/remokon/gen-9-sprites
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';

const REPO = 'remokon/gen-9-sprites';
const BRANCH = 'main';
const STYLE = 'gen-9-style';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${STYLE}`;

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const outDir = join(root, 'public/pokemon-sprites/gen-9');
const manifestPath = join(root, 'src/data/gen9-sprites.manifest.json');

const FORM_SLUG_ALIASES = {
  'tauros-paldea-combat': 'tauros-paldean',
  'tauros-paldea-blaze': 'tauros-paldean-fire',
  'tauros-paldea-aqua': 'tauros-paldean-water',
};

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[''.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildSlugCandidates(speciesName) {
  const slug = toSlug(speciesName);
  const candidates = [];

  if (FORM_SLUG_ALIASES[slug]) candidates.push(FORM_SLUG_ALIASES[slug]);
  if (slug.endsWith('-hisui')) candidates.push(slug.replace(/-hisui$/, '-hisuian'));
  candidates.push(slug);

  const parts = slug.split('-');
  if (parts.length > 1) candidates.push(parts[0]);

  return [...new Set(candidates)];
}

function resolveSlug(candidates, available) {
  for (const slug of candidates) {
    if (available.has(`${slug}-v2`)) return `${slug}-v2`;
    if (available.has(slug)) return slug;
  }
  return null;
}

async function fetchFileList() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`,
  );
  if (!res.ok) throw new Error(`GitHub tree fetch failed: ${res.status}`);
  const data = await res.json();
  return data.tree
    .filter((entry) => entry.path.startsWith(`${STYLE}/`) && entry.path.endsWith('.png'))
    .map((entry) => entry.path.split('/').pop().replace(/\.png$/, ''));
}

async function downloadSprite(slug) {
  const url = `${RAW_BASE}/${slug}.png`;
  const dest = join(outDir, `${slug}.png`);
  try {
    await access(dest);
    return 'skipped';
  } catch {
    // not cached yet
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return 'downloaded';
}

async function main() {
  await mkdir(outDir, { recursive: true });

  console.log('Fetching sprite list…');
  const slugs = await fetchFileList();
  const available = new Set(slugs);
  console.log(`Found ${slugs.length} sprites`);

  let downloaded = 0;
  let skipped = 0;
  for (const slug of slugs) {
    const result = await downloadSprite(slug);
    if (result === 'downloaded') downloaded++;
    else skipped++;
    if ((downloaded + skipped) % 50 === 0) {
      process.stdout.write(`\r${downloaded + skipped}/${slugs.length}`);
    }
  }
  console.log(`\nDownloaded ${downloaded}, skipped ${skipped}`);

  const gen9 = new Generations(Dex).get(9);
  const manifest = {};
  const missing = [];

  for (const species of gen9.species) {
    if (!species.exists || species.isNonstandard) continue;
    const slug = resolveSlug(buildSlugCandidates(species.name), available);
    if (slug) manifest[toKey(species.name)] = slug;
    else missing.push(species.name);
  }

  await writeFile(manifestPath, `${JSON.stringify({ slugs, manifest }, null, 2)}\n`);

  console.log(`Manifest: ${Object.keys(manifest).length} species mapped`);
  if (missing.length) {
    console.log(`Missing sprites (${missing.length}): ${missing.slice(0, 15).join(', ')}${missing.length > 15 ? '…' : ''}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
