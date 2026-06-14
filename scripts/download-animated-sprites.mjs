import { buildSlugCandidates, tumblrSlugToFileSlug } from './sprite-slug-utils.mjs';
import { mkdir, writeFile, access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const outDir = join(root, 'public/pokemon-sprites/animated');
const manifestPath = join(root, 'src/data/animated-sprites.manifest.json');
const cachePath = join(root, 'src/data/animated-sprites.sources.json');

const TUMBLR = 'https://scaviogifs.tumblr.com';
const CREDIT =
  'SV idle GIF renders via scaviogifs (https://www.tumblr.com/scaviogifs)';

const EXTRA_MANIFEST = {
  ogerpontealtera: 'ogerpon',
  ogerponwellspringtera: 'ogerpon-wellspring',
  ogerponhearthflametera: 'ogerpon-hearthflame',
  ogerponcornerstonetera: 'ogerpon-cornerstone',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function toKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchAllPosts() {
  const posts = [];
  let start = 0;

  while (true) {
    const res = await fetch(`${TUMBLR}/api/read/json?num=50&start=${start}`);
    if (!res.ok) throw new Error(`Tumblr API ${res.status}`);
    const raw = await res.text();
    const json = JSON.parse(raw.match(/var tumblr_api_read = (.+);/s)[1]);
    const batch = json.posts ?? [];
    if (!batch.length) break;
    posts.push(...batch);
    start += batch.length;
    if (start >= (json['posts-total'] ?? start)) break;
    await delay(150);
  }

  return posts;
}

async function gifUrlFromPost(postUrl) {
  const res = await fetch(postUrl);
  if (!res.ok) throw new Error(`Post fetch ${res.status}: ${postUrl}`);
  const html = await res.text();
  const match = html.match(/property="og:image" content="([^"]+\.gif)"/i);
  if (!match) return null;
  return match[1];
}

async function downloadFile(filename, url) {
  const dest = join(outDir, filename);
  try {
    await access(dest);
    return 'skipped';
  } catch {
    // not cached
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return 'downloaded';
}

function resolveFileSlug(speciesName, available) {
  for (const candidate of buildSlugCandidates(speciesName)) {
    if (available.has(candidate)) return candidate;
    if (available.has(`${candidate}-male`)) return `${candidate}-male`;
    if (available.has(`${candidate}-female`)) return `${candidate}-female`;
  }
  return null;
}

async function main() {
  const limit = process.argv.includes('--limit')
    ? Number(process.argv[process.argv.indexOf('--limit') + 1])
    : Infinity;

  await mkdir(outDir, { recursive: true });

  let sources = {};
  try {
    sources = JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    // no cache yet
  }

  console.log('Fetching scaviogifs post list…');
  const posts = await fetchAllPosts();
  console.log(`Found ${posts.length} posts`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let processed = 0;

  for (const post of posts) {
    if (processed >= limit) break;

    const fileSlug = tumblrSlugToFileSlug(post.slug ?? '');
    if (!fileSlug) continue;

    const filename = `${fileSlug}.gif`;
    processed++;

    let url = sources[fileSlug];
    if (!url) {
      try {
        url = await gifUrlFromPost(post.url);
        if (!url) {
          console.warn(`No GIF: ${post.slug}`);
          failed++;
          continue;
        }
        sources[fileSlug] = url;
        await delay(200);
      } catch (err) {
        console.warn(`Scrape failed ${post.slug}:`, err.message);
        failed++;
        continue;
      }
    }

    try {
      const result = await downloadFile(filename, url);
      if (result === 'downloaded') downloaded++;
      else skipped++;
      if ((downloaded + skipped) % 25 === 0) {
        process.stdout.write(`\r${downloaded + skipped}/${processed} files`);
      }
    } catch (err) {
      console.warn(`Download failed ${filename}:`, err.message);
      failed++;
    }
  }

  console.log(`\nDownloaded ${downloaded}, skipped ${skipped}, failed ${failed}`);

  await writeFile(cachePath, `${JSON.stringify(sources, null, 2)}\n`);

  const files = (await readdir(outDir)).filter((f) => f.endsWith('.gif'));
  const available = new Set(files.map((f) => f.replace(/\.gif$/, '')));

  const gen9 = new Generations(Dex).get(9);
  const manifest = {};

  for (const species of gen9.species) {
    if (!species.exists || species.isNonstandard) continue;
    const slug = resolveFileSlug(species.name, available);
    if (slug) manifest[toKey(species.name)] = slug;
  }

  Object.assign(manifest, EXTRA_MANIFEST);

  await writeFile(
    manifestPath,
    `${JSON.stringify({ files, manifest, credit: CREDIT }, null, 2)}\n`,
  );

  console.log(`Manifest: ${Object.keys(manifest).length} species, ${files.length} GIF files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
