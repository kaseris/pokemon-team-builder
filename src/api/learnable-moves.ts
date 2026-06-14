import { gen9, toID } from '../data/dex';
import type { LearnableMove, LearnMethod } from '../types/moves';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const SV_VERSION_GROUP = 'scarlet-violet';

type PokeApiMoveEntry = {
  move: { name: string; url: string };
  version_group_details: {
    level_learned_at: number;
    move_learn_method: { name: string };
    version_group: { name: string };
  }[];
};

type PokeApiPokemon = {
  name: string;
  moves: PokeApiMoveEntry[];
};

const cache = new Map<string, { moves: LearnableMove[]; source: 'pokeapi' | 'dex' }>();

export function speciesToPokeApiSlug(species: string, forme?: string): string {
  const full =
    forme && !species.toLowerCase().includes('-')
      ? `${species}-${forme}`
      : species;

  return full
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseLearnMethod(raw: string): LearnMethod {
  switch (raw) {
    case 'level-up':
      return 'level-up';
    case 'machine':
      return 'machine';
    case 'egg':
      return 'egg';
    case 'tutor':
      return 'tutor';
    default:
      return 'other';
  }
}

function resolveMoveName(pokeApiName: string): string | null {
  const id = pokeApiName.replace(/-/g, '');
  const move = gen9.moves.get(toID(id));
  return move?.name ?? null;
}

function enrichMove(move: LearnableMove): LearnableMove {
  const data = gen9.moves.get(toID(move.name));
  if (!data) return move;
  return {
    ...move,
    type: data.type,
    category: data.category,
    power: data.basePower,
    accuracy: data.accuracy,
  };
}

function mergeMoves(entries: LearnableMove[]): LearnableMove[] {
  const map = new Map<string, LearnableMove>();

  for (const entry of entries) {
    const existing = map.get(entry.name);
    if (!existing) {
      map.set(entry.name, entry);
      continue;
    }
    const methods = [...new Set([...existing.methods, ...entry.methods])];
    const minLevel =
      existing.minLevel !== undefined && entry.minLevel !== undefined
        ? Math.min(existing.minLevel, entry.minLevel)
        : existing.minLevel ?? entry.minLevel;
    map.set(entry.name, { ...existing, methods, minLevel });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function parsePokeApiMoves(data: PokeApiPokemon): LearnableMove[] {
  const parsed: LearnableMove[] = [];

  for (const entry of data.moves) {
    const showdownName = resolveMoveName(entry.move.name);
    if (!showdownName) continue;

    for (const detail of entry.version_group_details) {
      if (detail.version_group.name !== SV_VERSION_GROUP) continue;

      parsed.push({
        name: showdownName,
        methods: [parseLearnMethod(detail.move_learn_method.name)],
        minLevel:
          detail.move_learn_method.name === 'level-up' && detail.level_learned_at > 0
            ? detail.level_learned_at
            : undefined,
      });
    }
  }

  return mergeMoves(parsed).map(enrichMove);
}

async function fetchPokemon(slug: string): Promise<PokeApiPokemon | null> {
  const res = await fetch(`${POKEAPI_BASE}/pokemon/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`PokeAPI error (${res.status}) for ${slug}`);
  }
  return res.json() as Promise<PokeApiPokemon>;
}

async function fetchFromDex(species: string, forme?: string): Promise<LearnableMove[]> {
  const fullName = forme ? `${species}-${forme}` : species;
  const learnset = await gen9.learnsets.get(fullName);
  if (!learnset?.learnset) return [];

  const moves: LearnableMove[] = [];

  for (const [moveId, sources] of Object.entries(learnset.learnset)) {
    const move = gen9.moves.get(toID(moveId));
    if (!move) continue;

    const methods = new Set<LearnMethod>();
    let minLevel: number | undefined;

    for (const src of sources) {
      if (src.includes('L')) {
        methods.add('level-up');
        const match = src.match(/L(\d+)/);
        if (match) {
          const lv = parseInt(match[1], 10);
          minLevel = minLevel === undefined ? lv : Math.min(minLevel, lv);
        }
      } else if (src.includes('M')) {
        methods.add('machine');
      } else if (src.includes('E')) {
        methods.add('egg');
      } else if (src.includes('T')) {
        methods.add('tutor');
      } else {
        methods.add('other');
      }
    }

    moves.push(
      enrichMove({
        name: move.name,
        methods: [...methods],
        minLevel,
      }),
    );
  }

  return mergeMoves(moves);
}

async function fetchFromPokeApi(species: string, forme?: string): Promise<LearnableMove[]> {
  const slugs = [
    speciesToPokeApiSlug(species, forme),
    speciesToPokeApiSlug(species),
  ];

  for (const slug of [...new Set(slugs)]) {
    const data = await fetchPokemon(slug);
    if (data) return parsePokeApiMoves(data);
  }

  return [];
}

export async function fetchLearnableMoves(
  species: string,
  forme?: string,
): Promise<{ moves: LearnableMove[]; source: 'pokeapi' | 'dex' }> {
  const cacheKey = speciesToPokeApiSlug(species, forme);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let moves = await fetchFromPokeApi(species, forme);
  let source: 'pokeapi' | 'dex' = 'pokeapi';

  if (moves.length === 0) {
    moves = await fetchFromDex(species, forme);
    source = 'dex';
  }

  cache.set(cacheKey, { moves, source });
  return { moves, source };
}

export function clearLearnableMovesCache() {
  cache.clear();
}
