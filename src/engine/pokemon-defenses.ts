import type { PokemonSet, PokemonType } from '../types/pokemon';
import { getTypes } from '../data/dex';
import { getTypeMultiplier, TYPE_NAMES } from '../data/type-chart';

export type Effectiveness = 0 | 0.5 | 1 | 2 | 4;

export type DefenseMode = 'default' | 'tera';

export type PokemonDefenseAnalysis = {
  mode: DefenseMode;
  defendingTypes: string[];
  profile: Record<PokemonType, Effectiveness>;
  weak4x: PokemonType[];
  weak2x: PokemonType[];
  resist: PokemonType[];
  immune: PokemonType[];
  abilityNotes: string[];
};

function toEffectiveness(value: number): Effectiveness {
  if (value === 0) return 0;
  if (value <= 0.5) return 0.5;
  if (value <= 1) return 1;
  if (value <= 2) return 2;
  return 4;
}

function scaleEffectiveness(eff: Effectiveness, multiplier: number): Effectiveness {
  return toEffectiveness(eff * multiplier);
}

function getDefendingTypes(
  set: PokemonSet,
  mode: DefenseMode,
): string[] {
  if (mode === 'tera' && set.teraType && set.teraType !== 'Stellar') {
    return [set.teraType];
  }
  return getTypes(set.species, set.forme);
}

function buildProfile(defendingTypes: string[]): Record<PokemonType, Effectiveness> {
  const profile = {} as Record<PokemonType, Effectiveness>;
  for (const attacking of TYPE_NAMES) {
    profile[attacking] = toEffectiveness(getTypeMultiplier(attacking, defendingTypes as PokemonType[]));
  }
  return profile;
}

function applyAbilityModifiers(
  profile: Record<PokemonType, Effectiveness>,
  ability?: string,
): { profile: Record<PokemonType, Effectiveness>; notes: string[] } {
  if (!ability) return { profile, notes: [] };

  const next = { ...profile };
  const notes: string[] = [];

  const setImmune = (type: PokemonType, note: string) => {
    next[type] = 0;
    notes.push(note);
  };

  const halve = (type: PokemonType, note: string) => {
    next[type] = scaleEffectiveness(next[type], 0.5);
    notes.push(note);
  };

  const double = (type: PokemonType, note: string) => {
    next[type] = scaleEffectiveness(next[type], 2);
    notes.push(note);
  };

  switch (ability) {
    case 'Levitate':
      setImmune('Ground', 'Levitate — Ground immune');
      break;
    case 'Flash Fire':
      setImmune('Fire', 'Flash Fire — Fire immune');
      break;
    case 'Water Absorb':
    case 'Storm Drain':
      setImmune('Water', `${ability} — Water immune`);
      break;
    case 'Volt Absorb':
    case 'Lightning Rod':
    case 'Motor Drive':
      setImmune('Electric', `${ability} — Electric immune`);
      break;
    case 'Sap Sipper':
      setImmune('Grass', 'Sap Sipper — Grass immune');
      break;
    case 'Earth Eater':
      setImmune('Ground', 'Earth Eater — Ground immune');
      break;
    case 'Well-Baked Body':
      setImmune('Fire', 'Well-Baked Body — Fire immune');
      break;
    case 'Dry Skin':
      setImmune('Water', 'Dry Skin — Water immune');
      if (next.Fire <= 1) {
        next.Fire = toEffectiveness(next.Fire === 0 ? 0 : Math.max(next.Fire, 1) * 1.25);
        notes.push('Dry Skin — increased Fire damage');
      }
      break;
    case 'Heatproof':
      halve('Fire', 'Heatproof — Fire damage halved');
      break;
    case 'Thick Fat':
      halve('Fire', 'Thick Fat — Fire damage halved');
      halve('Ice', 'Thick Fat — Ice damage halved');
      break;
    case 'Water Bubble':
      halve('Fire', 'Water Bubble — Fire damage halved');
      break;
    case 'Fluffy':
      double('Fire', 'Fluffy — double Fire damage');
      halve('Ice', 'Fluffy — Ice damage halved');
      break;
    case 'Purifying Salt':
      next.Ghost = scaleEffectiveness(next.Ghost, 0.5);
      notes.push('Purifying Salt — Ghost damage halved');
      break;
    default:
      break;
  }

  return { profile: next, notes };
}

function summarizeProfile(profile: Record<PokemonType, Effectiveness>) {
  const weak4x: PokemonType[] = [];
  const weak2x: PokemonType[] = [];
  const resist: PokemonType[] = [];
  const immune: PokemonType[] = [];

  for (const [type, eff] of Object.entries(profile) as [PokemonType, Effectiveness][]) {
    if (eff === 0) immune.push(type);
    else if (eff === 4) weak4x.push(type);
    else if (eff === 2) weak2x.push(type);
    else if (eff <= 0.5) resist.push(type);
  }

  return { weak4x, weak2x, resist, immune };
}

export function analyzePokemonDefenses(
  set: PokemonSet,
  mode: DefenseMode = 'default',
): PokemonDefenseAnalysis | null {
  if (!set.species) return null;

  const defendingTypes = getDefendingTypes(set, mode);
  if (defendingTypes.length === 0) return null;

  const baseProfile = buildProfile(defendingTypes);
  const { profile, notes } =
    mode === 'default'
      ? applyAbilityModifiers(baseProfile, set.ability)
      : { profile: baseProfile, notes: [] as string[] };

  const { weak4x, weak2x, resist, immune } = summarizeProfile(profile);

  return {
    mode,
    defendingTypes,
    profile,
    weak4x,
    weak2x,
    resist,
    immune,
    abilityNotes: notes,
  };
}

export { TYPE_NAMES as ALL_TYPES };
