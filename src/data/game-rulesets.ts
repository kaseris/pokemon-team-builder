import type { GameRuleset } from '../types/format';

export const GAME_RULESETS: Record<GameRuleset['id'], GameRuleset> = {
  sv: {
    id: 'sv',
    name: 'Pokémon Scarlet/Violet',
    generation: 9,
    mechanics: {
      tera: true,
      stellarTera: true,
      dynamax: false,
      megas: false,
      zMoves: false,
      hiddenPower: false,
      pursuit: false,
      transferMoves: true,
    },
  },
  champions: {
    id: 'champions',
    name: 'Pokémon Champions',
    generation: 9,
    mechanics: {
      tera: false,
      stellarTera: false,
      dynamax: false,
      megas: false,
      zMoves: false,
      hiddenPower: false,
      pursuit: false,
      transferMoves: false,
    },
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    generation: 9,
    mechanics: {
      tera: true,
      stellarTera: true,
      dynamax: false,
      megas: false,
      zMoves: false,
      hiddenPower: false,
      pursuit: false,
      transferMoves: true,
    },
  },
};
