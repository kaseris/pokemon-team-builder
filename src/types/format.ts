export type BattleType = 'singles' | 'doubles';

export type Rule =
  | { type: 'ban_species'; species: string[] }
  | { type: 'ban_items'; items: string[] }
  | { type: 'ban_moves'; moves: string[] }
  | { type: 'ban_abilities'; abilities: string[] }
  | { type: 'species_clause' }
  | { type: 'item_clause' }
  | { type: 'sleep_clause' }
  | { type: 'restricted_count'; max: number; species: string[] }
  | { type: 'tera_allowed'; allowed: boolean };

export type GameRuleset = {
  id: 'sv' | 'champions' | 'custom';
  name: string;
  generation: number;
  mechanics: {
    tera: boolean;
    stellarTera: boolean;
    dynamax: boolean;
    megas: boolean;
    zMoves: boolean;
    hiddenPower: boolean;
    pursuit: boolean;
    transferMoves: boolean;
  };
};

export type BattleFormat = {
  id: string;
  name: string;
  gameRulesetId: GameRuleset['id'];
  generation: number;
  battleType: BattleType;
  defaultLevel: number;
  maxTeamSize: number;
  rules: Rule[];
};

export type ValidationIssue = {
  severity: 'error' | 'warning' | 'info';
  pokemonIndex?: number;
  field?: string;
  message: string;
  code: string;
};
