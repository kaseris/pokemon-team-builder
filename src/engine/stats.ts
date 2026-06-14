import type { StatId, StatsTable } from '../types/pokemon';
import { getNature, getSpecies } from '../data/dex';

const OTHER_STATS: StatId[] = ['atk', 'def', 'spa', 'spd', 'spe'];

export function calcStat(
  stat: StatId,
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureMod = 1,
): number {
  if (stat === 'hp') {
    if (base === 1) return 1;
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }

  return Math.floor(
    (Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * natureMod,
  );
}

export function calcAllStats(
  speciesName: string,
  level: number,
  evs: StatsTable,
  ivs: StatsTable,
  natureName?: string,
  forme?: string,
): StatsTable | null {
  const name = forme ? `${speciesName}-${forme}` : speciesName;
  const species = getSpecies(name);
  if (!species) return null;

  const nature = natureName ? getNature(natureName) : undefined;
  const result = {} as StatsTable;

  for (const stat of ['hp', ...OTHER_STATS] as StatId[]) {
    const base = species.baseStats[stat];
    let mod = 1;
    if (nature && stat !== 'hp') {
      if (nature.plus === stat) mod = 1.1;
      if (nature.minus === stat) mod = 0.9;
    }
    result[stat] = calcStat(stat, base, ivs[stat], evs[stat], level, mod);
  }

  return result;
}

export function totalEvs(evs: StatsTable): number {
  return Object.values(evs).reduce((sum, v) => sum + v, 0);
}

export const ZERO_EVS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

const STAT_ORDER: StatId[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

export function evsMatch(a: StatsTable, b: StatsTable): boolean {
  return STAT_ORDER.every((stat) => a[stat] === b[stat]);
}

export type EvPreset = {
  label: string;
  description: string;
  evs: StatsTable;
};

export const EV_PRESETS: EvPreset[] = [
  {
    label: 'Physical',
    description: '252 Atk / 252 Spe / 4 SpD',
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
  },
  {
    label: 'Special',
    description: '252 SpA / 252 Spe / 4 SpD',
    evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
  },
  {
    label: 'Mixed',
    description: '252 Atk / 252 SpA / 4 Spe',
    evs: { hp: 0, atk: 252, def: 0, spa: 252, spd: 0, spe: 4 },
  },
  {
    label: 'Bulky Atk',
    description: '252 HP / 252 Atk / 4 Def',
    evs: { hp: 252, atk: 252, def: 4, spa: 0, spd: 0, spe: 0 },
  },
  {
    label: 'Bulky P.',
    description: '252 HP / 252 Def / 4 SpD',
    evs: { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 },
  },
  {
    label: 'Bulky S.',
    description: '252 HP / 252 SpD / 4 Def',
    evs: { hp: 252, atk: 0, def: 4, spa: 0, spd: 252, spe: 0 },
  },
  {
    label: 'Fast Bulky',
    description: '252 HP / 252 Spe / 4 SpD',
    evs: { hp: 252, atk: 0, def: 0, spa: 0, spd: 4, spe: 252 },
  },
  {
    label: 'Defensive',
    description: '248 HP / 252 Def / 8 SpD',
    evs: { hp: 248, atk: 0, def: 252, spa: 0, spd: 8, spe: 0 },
  },
  {
    label: 'Sp. Defensive',
    description: '248 HP / 252 SpD / 8 Def',
    evs: { hp: 248, atk: 0, def: 8, spa: 0, spd: 252, spe: 0 },
  },
  {
    label: 'Max Speed',
    description: '252 Spe',
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 252 },
  },
  {
    label: 'Trick Room',
    description: '252 HP / 252 Atk / 4 Def (min Speed)',
    evs: { hp: 252, atk: 252, def: 4, spa: 0, spd: 0, spe: 0 },
  },
  {
    label: 'HP + Spe',
    description: '252 HP / 252 Spe / 4',
    evs: { hp: 252, atk: 0, def: 0, spa: 0, spd: 4, spe: 252 },
  },
];

export function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Math.round(level) || 1));
}

export function clampEvs(evs: StatsTable): StatsTable {
  const clamped = { ...evs };
  let total = totalEvs(clamped);

  for (const stat of Object.keys(clamped) as StatId[]) {
    clamped[stat] = Math.min(252, Math.max(0, clamped[stat]));
  }

  total = totalEvs(clamped);
  if (total > 510) {
    const overflow = total - 510;
    const stats = (Object.keys(clamped) as StatId[]).sort((a, b) => clamped[b] - clamped[a]);
    let remaining = overflow;
    for (const stat of stats) {
      const reducible = clamped[stat] % 4 || clamped[stat];
      const reduce = Math.min(remaining, reducible);
      clamped[stat] -= reduce;
      remaining -= reduce;
      if (remaining <= 0) break;
    }
  }

  return clamped;
}
