export type StatId = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export type StatsTable = Record<StatId, number>;

export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy'
  | 'Stellar';

export type TeraType = PokemonType | 'Stellar';

export type PokemonSet = {
  species: string;
  forme?: string;
  nickname?: string;
  level: number;
  gender?: 'M' | 'F' | 'N';
  item?: string;
  ability?: string;
  nature?: string;
  evs: StatsTable;
  ivs: StatsTable;
  moves: string[];
  teraType?: TeraType;
  shiny?: boolean;
};

export type Team = {
  name: string;
  formatId: string;
  pokemon: PokemonSet[];
};

export const EMPTY_EVS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
export const DEFAULT_IVS: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

export const STAT_LABELS: Record<StatId, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
};

export const STAT_IDS: StatId[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

export function createEmptySet(species = ''): PokemonSet {
  return {
    species,
    level: 100,
    evs: { ...EMPTY_EVS },
    ivs: { ...DEFAULT_IVS },
    moves: ['', '', '', ''],
  };
}

export function createEmptyTeam(formatId = 'gen9ou'): Team {
  return {
    name: 'Untitled Team',
    formatId,
    pokemon: [],
  };
}
