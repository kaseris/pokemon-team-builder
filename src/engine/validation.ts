import type { BattleFormat, ValidationIssue } from '../types/format';
import type { PokemonSet, Team } from '../types/pokemon';
import { GAME_RULESETS } from '../data/game-rulesets';
import { getFormat } from '../data/formats';
import { getSpecies, toID } from '../data/dex';
import { totalEvs } from './stats';

function baseSpeciesName(set: PokemonSet): string {
  const name = set.forme ? `${set.species}-${set.forme}` : set.species;
  const species = getSpecies(name);
  return species?.baseSpecies ?? set.species;
}

function validateSet(
  set: PokemonSet,
  format: BattleFormat,
  index: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const game = GAME_RULESETS[format.gameRulesetId];
  const speciesName = set.forme ? `${set.species}-${set.forme}` : set.species;
  const species = getSpecies(speciesName);

  if (!set.species) {
    issues.push({
      severity: 'error',
      pokemonIndex: index,
      field: 'species',
      message: 'No Pokémon selected',
      code: 'missing_species',
    });
    return issues;
  }

  if (!species) {
    issues.push({
      severity: 'error',
      pokemonIndex: index,
      field: 'species',
      message: `Unknown species: ${set.species}`,
      code: 'unknown_species',
    });
    return issues;
  }

  const evTotal = totalEvs(set.evs);
  if (evTotal > 510) {
    issues.push({
      severity: 'error',
      pokemonIndex: index,
      field: 'evs',
      message: `EV total is ${evTotal} (max 510)`,
      code: 'ev_overflow',
    });
  }

  for (const [stat, value] of Object.entries(set.evs)) {
    if (value > 252) {
      issues.push({
        severity: 'error',
        pokemonIndex: index,
        field: 'evs',
        message: `${stat.toUpperCase()} EVs exceed 252`,
        code: 'ev_stat_overflow',
      });
    }
  }

  for (const [stat, value] of Object.entries(set.ivs)) {
    if (value < 0 || value > 31) {
      issues.push({
        severity: 'error',
        pokemonIndex: index,
        field: 'ivs',
        message: `${stat.toUpperCase()} IV must be 0–31`,
        code: 'iv_range',
      });
    }
  }

  const filledMoves = set.moves.filter(Boolean);
  if (filledMoves.length === 0) {
    issues.push({
      severity: 'warning',
      pokemonIndex: index,
      field: 'moves',
      message: 'No moves selected',
      code: 'missing_moves',
    });
  }

  const teraRule = format.rules.find((r) => r.type === 'tera_allowed');
  if (game.mechanics.tera && teraRule?.type === 'tera_allowed' && teraRule.allowed && !set.teraType) {
    issues.push({
      severity: 'warning',
      pokemonIndex: index,
      field: 'teraType',
      message: 'Tera Type not set',
      code: 'missing_tera',
    });
  }

  if (set.teraType === 'Stellar' && !game.mechanics.stellarTera) {
    issues.push({
      severity: 'error',
      pokemonIndex: index,
      field: 'teraType',
      message: 'Stellar Tera is not allowed in this ruleset',
      code: 'stellar_banned',
    });
  }

  for (const rule of format.rules) {
    if (rule.type === 'ban_species') {
      const banned = rule.species.map(toID);
      if (banned.includes(toID(baseSpeciesName(set)))) {
        issues.push({
          severity: 'error',
          pokemonIndex: index,
          field: 'species',
          message: `${set.species} is banned in ${format.name}`,
          code: 'species_banned',
        });
      }
    }
  }

  return issues;
}

export function validateTeam(team: Team): ValidationIssue[] {
  const format = getFormat(team.formatId);
  if (!format) {
    return [{
      severity: 'error',
      message: `Unknown format: ${team.formatId}`,
      code: 'unknown_format',
    }];
  }

  const issues: ValidationIssue[] = [];

  if (team.pokemon.length > format.maxTeamSize) {
    issues.push({
      severity: 'error',
      message: `Team has ${team.pokemon.length} Pokémon (max ${format.maxTeamSize})`,
      code: 'team_size',
    });
  }

  if (team.pokemon.length === 0) {
    issues.push({
      severity: 'info',
      message: 'Team is empty',
      code: 'empty_team',
    });
  }

  team.pokemon.forEach((set, index) => {
    issues.push(...validateSet(set, format, index));
  });

  for (const rule of format.rules) {
    if (rule.type === 'species_clause') {
      const seen = new Map<string, number>();
      team.pokemon.forEach((set, index) => {
        if (!set.species) return;
        const base = toID(baseSpeciesName(set));
        if (seen.has(base)) {
          issues.push({
            severity: 'error',
            pokemonIndex: index,
            field: 'species',
            message: `Species Clause: duplicate ${set.species}`,
            code: 'species_clause',
          });
        }
        seen.set(base, index);
      });
    }

    if (rule.type === 'item_clause') {
      const seen = new Map<string, number>();
      team.pokemon.forEach((set, index) => {
        if (!set.item) return;
        const id = toID(set.item);
        if (seen.has(id)) {
          issues.push({
            severity: 'error',
            pokemonIndex: index,
            field: 'item',
            message: `Item Clause: duplicate ${set.item}`,
            code: 'item_clause',
          });
        }
        seen.set(id, index);
      });
    }

    if (rule.type === 'restricted_count') {
      const restricted = rule.species.map(toID);
      const count = team.pokemon.filter((set) =>
        restricted.includes(toID(baseSpeciesName(set))),
      ).length;
      if (count > rule.max) {
        issues.push({
          severity: 'error',
          message: `Too many restricted Pokémon (${count}/${rule.max})`,
          code: 'restricted_count',
        });
      }
    }
  }

  return issues;
}
