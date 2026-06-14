import type { PokemonSet, StatsTable, Team } from '../types/pokemon';
import { DEFAULT_IVS, EMPTY_EVS } from '../types/pokemon';
import { getFormat } from '../data/formats';

const EV_LINE = /^EVs:\s*(.+)$/i;
const EV_PART = /(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)/gi;
const MOVE_LINE = /^-\s*(.+)$/;
const ABILITY_LINE = /^Ability:\s*(.+)$/i;
const ITEM_LINE = /^(.+?)\s*@\s*(.+)$/;
const TERA_LINE = /^Tera Type:\s*(.+)$/i;
const NATURE_LINE = /^(\w+)\s+Nature$/i;
const LEVEL_LINE = /^Level:\s*(\d+)$/i;
const GENDER_LINE = /^(M|F)$/;

const STAT_MAP: Record<string, keyof StatsTable> = {
  HP: 'hp',
  Atk: 'atk',
  Def: 'def',
  SpA: 'spa',
  SpD: 'spd',
  Spe: 'spe',
};

function parseEvs(text: string): StatsTable {
  const evs = { ...EMPTY_EVS };
  let match: RegExpExecArray | null;
  const re = new RegExp(EV_PART.source, 'gi');
  while ((match = re.exec(text)) !== null) {
    const stat = STAT_MAP[match[2]];
    if (stat) evs[stat] = parseInt(match[1], 10);
  }
  return evs;
}

function parseSet(lines: string[]): PokemonSet | null {
  if (lines.length === 0) return null;

  const set: PokemonSet = {
    species: '',
    level: 100,
    evs: { ...EMPTY_EVS },
    ivs: { ...DEFAULT_IVS },
    moves: [],
  };

  let header = lines[0].trim();
  const itemMatch = header.match(ITEM_LINE);
  if (itemMatch) {
    set.species = itemMatch[1].trim();
    set.item = itemMatch[2].trim();
  } else {
    set.species = header;
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const abilityMatch = line.match(ABILITY_LINE);
    if (abilityMatch) {
      set.ability = abilityMatch[1].trim();
      continue;
    }

    const teraMatch = line.match(TERA_LINE);
    if (teraMatch) {
      set.teraType = teraMatch[1].trim() as PokemonSet['teraType'];
      continue;
    }

    const evMatch = line.match(EV_LINE);
    if (evMatch) {
      set.evs = parseEvs(evMatch[1]);
      continue;
    }

    const natureMatch = line.match(NATURE_LINE);
    if (natureMatch) {
      set.nature = natureMatch[1].trim();
      continue;
    }

    const levelMatch = line.match(LEVEL_LINE);
    if (levelMatch) {
      set.level = parseInt(levelMatch[1], 10);
      continue;
    }

    const moveMatch = line.match(MOVE_LINE);
    if (moveMatch) {
      set.moves.push(moveMatch[1].trim());
      continue;
    }

    if (GENDER_LINE.test(line)) {
      set.gender = line as PokemonSet['gender'];
    }
  }

  while (set.moves.length < 4) set.moves.push('');
  return set;
}

export function importShowdown(text: string, formatId?: string): Team {
  const blocks = text.trim().split(/\n\s*\n/);
  const pokemon: PokemonSet[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const set = parseSet(lines);
    if (set?.species) pokemon.push(set);
  }

  return {
    name: 'Imported Team',
    formatId: formatId ?? 'gen9ou',
    pokemon,
  };
}

export function exportShowdown(team: Team): string {
  const format = getFormat(team.formatId);
  const defaultLevel = format?.defaultLevel ?? 100;

  return team.pokemon
    .map((set) => {
      const lines: string[] = [];
      const header = set.item ? `${set.species} @ ${set.item}` : set.species;
      lines.push(set.nickname ? `${set.nickname} (${header})` : header);

      if (set.ability) lines.push(`Ability: ${set.ability}`);
      if (set.teraType) lines.push(`Tera Type: ${set.teraType}`);
      if (set.level !== defaultLevel) lines.push(`Level: ${set.level}`);

      const evParts = Object.entries(set.evs)
        .filter(([, v]) => v > 0)
        .map(([stat, value]) => {
          const label = Object.entries(STAT_MAP).find(([, s]) => s === stat)?.[0] ?? stat;
          return `${value} ${label}`;
        });
      if (evParts.length) lines.push(`EVs: ${evParts.join(' / ')}`);

      if (set.nature) lines.push(`${set.nature} Nature`);
      for (const move of set.moves.filter(Boolean)) {
        lines.push(`- ${move}`);
      }

      return lines.join('\n');
    })
    .join('\n\n');
}
