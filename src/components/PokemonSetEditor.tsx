import { useEffect, useState } from 'react';
import type { PokemonSet, StatId, TeraType } from '../types/pokemon';
import { STAT_IDS, STAT_LABELS } from '../types/pokemon';
import { getAbility, getLegalAbilities, getNature, getTypes } from '../data/dex';
import { calcAllStats, clampEvs, clampLevel } from '../engine/stats';
import { EvPresetPicker } from './EvPresetPicker';
import { PokemonSprite } from './PokemonSprite';
import { MoveSelector } from './MoveSelector';
import { ItemSelector } from './ItemSelector';
import { SpeciesSearch, type SearchSpecies } from './SpeciesSearch';
import { TypeBadge } from './TypeBadge';
import { PokemonName } from './PokemonName';
import { Dropdown } from './Dropdown';

const TERA_TYPES: TeraType[] = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy', 'Stellar',
];

/** '' is the "None" option for the tera-type dropdown. */
const TERA_OPTIONS: string[] = ['', ...TERA_TYPES];

type NatureInfo = { name: string; plus?: StatId; minus?: StatId };

const NATURE_NAMES = [
  'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile', 'Gentle',
  'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild', 'Modest',
  'Naive', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious',
  'Timid',
];

// Resolve each nature's boosted (+10%) and hindered (-10%) stat once. Neutral
// natures report no effect (plus === minus in the dex), so they stay undefined.
const NATURE_OPTIONS: NatureInfo[] = NATURE_NAMES.map((name) => {
  const nature = getNature(name);
  const plus = nature?.plus as StatId | undefined;
  const minus = nature?.minus as StatId | undefined;
  if (!plus || !minus || plus === minus) return { name };
  return { name, plus, minus };
});

const NATURE_BY_NAME = new Map(NATURE_OPTIONS.map((info) => [info.name, info]));

/** +boosted / −hindered stat hint, or a neutral marker. */
function NatureHint({ info }: { info: NatureInfo }) {
  if (!info.plus || !info.minus) {
    return <span className="text-[11px] font-medium text-muted">Neutral</span>;
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold">
      <span className="text-success">+{STAT_LABELS[info.plus]}</span>
      <span className="text-danger">−{STAT_LABELS[info.minus]}</span>
    </span>
  );
}

const LEVEL_PRESETS = [50, 100] as const;
type LevelPreset = (typeof LEVEL_PRESETS)[number] | 'custom';

function levelPreset(level: number): LevelPreset {
  if (level === 50) return 50;
  if (level === 100) return 100;
  return 'custom';
}

type Props = {
  set: PokemonSet;
  defaultLevel: number;
  onChange: (patch: Partial<PokemonSet>) => void;
};

function fieldLabel(text: string) {
  return (
    <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">{text}</span>
  );
}

function LevelSelector({
  level,
  onChange,
  layout = 'stack',
}: {
  level: number;
  onChange: (level: number) => void;
  layout?: 'stack' | 'row';
}) {
  const [mode, setMode] = useState<LevelPreset>(() => levelPreset(level));

  useEffect(() => {
    setMode(levelPreset(level));
  }, [level]);

  const presetClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-accent text-on-accent shadow-[0_0_0_1px_var(--color-accent-dim)]'
        : 'border border-border bg-surface-raised text-muted hover:border-accent-dim hover:text-foreground'
    }`;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      {LEVEL_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className={presetClass(mode === preset)}
          onClick={() => {
            setMode(preset);
            onChange(preset);
          }}
        >
          Lv {preset}
        </button>
      ))}
      <button
        type="button"
        className={presetClass(mode === 'custom')}
        onClick={() => setMode('custom')}
      >
        Custom
      </button>
      {mode === 'custom' && (
        <input
          type="number"
          min={1}
          max={100}
          value={level}
          onChange={(e) => onChange(clampLevel(parseInt(e.target.value, 10)))}
          className="w-20 rounded-lg border border-border bg-surface-raised px-2 py-1.5 text-sm outline-none focus:border-accent"
          aria-label="Custom level"
        />
      )}
    </div>
  );

  if (layout === 'row') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {fieldLabel('Level')}
        {controls}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {fieldLabel('Level')}
      {controls}
    </div>
  );
}

export function PokemonSetEditor({ set, defaultLevel, onChange }: Props) {
  const [search, setSearch] = useState('');

  const abilities = set.species ? getLegalAbilities(set.species, set.forme) : [];
  const types = set.species ? getTypes(set.species, set.forme) : [];
  const stats = set.species
    ? calcAllStats(set.species, set.level, set.evs, set.ivs, set.nature, set.forme)
    : null;

  const updateEv = (stat: StatId, raw: string) => {
    const value = Math.min(252, Math.max(0, parseInt(raw, 10) || 0));
    onChange({ evs: clampEvs({ ...set.evs, [stat]: value }) });
  };

  const pickSpecies = (species: SearchSpecies) => {
    onChange({
      species: species.name,
      forme: undefined,
      ability: species.abilities[0] ?? undefined,
      level: set.species ? set.level : defaultLevel,
    });
    setSearch('');
  };

  const inputClass =
    'rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent';

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section className="min-w-0">
        {!set.species ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="font-display text-2xl font-bold">Choose a Pokémon</p>
            <p className="max-w-md text-sm text-muted">
              Search below to add a species — sprite and base stats will appear here.
            </p>
            <div className="mt-2 w-full max-w-md">
              <SpeciesSearch
                value={search}
                onChange={setSearch}
                onSelect={(s) =>
                  onChange({
                    species: s.name,
                    forme: undefined,
                    ability: s.abilities[0] ?? undefined,
                    level: defaultLevel,
                  })
                }
                autoFocus
                placeholder="Search Pokémon..."
                inputClassName={`${inputClass} w-full`}
                listClassName="mt-2 max-h-56"
              />
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto_auto] items-start gap-x-8 gap-y-4">
            <div className="col-span-2 min-w-0">
              <PokemonName
                as="h2"
                name={set.nickname || set.species}
                className="font-display text-3xl font-extrabold leading-normal tracking-tight break-words"
              />
              {set.nickname && (
                <PokemonName
                  as="p"
                  name={set.species}
                  className="mt-1 text-sm leading-normal text-muted"
                />
              )}
            </div>

            <div className="row-span-2 row-start-2 min-w-0 self-end overflow-visible">
              <PokemonSprite
                species={set.species}
                forme={set.forme}
                gender={set.gender}
                shiny={set.shiny}
                item={set.item}
                size="hero"
              />
            </div>

            <div className="col-start-2 row-start-2 flex min-w-0 flex-wrap items-center gap-x-8 gap-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {types.map((t) => (
                  <TypeBadge key={t} type={t} size="md" showTooltip />
                ))}
                {set.teraType && (
                  <TypeBadge type={set.teraType} variant="tera" size="md" showTooltip />
                )}
              </div>
              <LevelSelector
                level={set.level}
                onChange={(level) => onChange({ level })}
                layout="row"
              />
            </div>

            <div className="col-start-2 row-start-3 flex max-w-xs flex-col gap-1.5">
              {fieldLabel('Change Species')}
              <SpeciesSearch
                value={search}
                onChange={setSearch}
                onSelect={pickSpecies}
                placeholder={set.species}
                inputClassName={`${inputClass} w-full`}
                listClassName="max-h-40"
              />
            </div>
          </div>
        )}
      </section>

      {set.species && (
        <div className="grid min-w-0 grid-cols-2 gap-5">
          <div className="panel flex min-w-0 flex-col gap-4 p-5">
            <h3 className="section-title">Build</h3>

            <ItemSelector value={set.item} onChange={onChange} />

            <div className="flex min-w-0 flex-col gap-1.5">
              {fieldLabel('Ability')}
              <Dropdown
                ariaLabel="Ability"
                options={abilities}
                getKey={(a) => a}
                isSelected={(a) => a === set.ability}
                onSelect={(a) => onChange({ ability: a })}
                listClassName="max-h-72"
                renderTrigger={
                  set.ability ? (
                    <span className="truncate font-medium">{set.ability}</span>
                  ) : (
                    <span className="text-muted">Select ability</span>
                  )
                }
                renderOption={(a, selected) => {
                  const desc = getAbility(a)?.shortDesc;
                  return (
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-medium ${selected ? 'text-accent-dim' : ''}`}>
                        {a}
                      </span>
                      {desc && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted">{desc}</span>
                      )}
                    </span>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                {fieldLabel('Tera Type')}
                <Dropdown
                  ariaLabel="Tera Type"
                  options={TERA_OPTIONS}
                  getKey={(t) => t || 'none'}
                  isSelected={(t) => t === (set.teraType ?? '')}
                  onSelect={(t) => onChange({ teraType: (t || undefined) as TeraType | undefined })}
                  renderTrigger={
                    set.teraType ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <TypeBadge type={set.teraType} variant="tera" size="sm" />
                        <span className="truncate">{set.teraType}</span>
                      </span>
                    ) : (
                      <span className="text-muted">None</span>
                    )
                  }
                  renderOption={(t) =>
                    t ? (
                      <>
                        <TypeBadge type={t} variant="tera" size="sm" />
                        <span className="min-w-0 flex-1 truncate font-medium">{t}</span>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1 text-muted">None</span>
                    )
                  }
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                {fieldLabel('Nature')}
                <Dropdown
                  ariaLabel="Nature"
                  options={NATURE_OPTIONS}
                  getKey={(n) => n.name}
                  isSelected={(n) => n.name === set.nature}
                  onSelect={(n) => onChange({ nature: n.name })}
                  listClassName="max-h-72"
                  renderTrigger={
                    set.nature ? (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate font-medium">{set.nature}</span>
                        {NATURE_BY_NAME.has(set.nature) && (
                          <NatureHint info={NATURE_BY_NAME.get(set.nature)!} />
                        )}
                      </span>
                    ) : (
                      <span className="text-muted">Select nature</span>
                    )
                  }
                  renderOption={(n, selected) => (
                    <>
                      <span className={`min-w-0 flex-1 truncate font-medium ${selected ? 'text-accent-dim' : ''}`}>
                        {n.name}
                      </span>
                      <NatureHint info={n} />
                    </>
                  )}
                />
              </div>
            </div>

            <MoveSelector set={set} onChange={onChange} />
          </div>

          <div className="panel flex min-w-0 flex-col gap-4 p-5">
            <h3 className="section-title">Stats</h3>

            <EvPresetPicker evs={set.evs} onChange={(evs) => onChange({ evs })} />

            <div className="grid grid-cols-3 gap-2">
              {STAT_IDS.map((stat) => (
                <label key={stat} className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase text-muted">{STAT_LABELS[stat]}</span>
                  <input
                    type="number"
                    min={0}
                    max={252}
                    step={4}
                    value={set.evs[stat]}
                    onChange={(e) => updateEv(stat, e.target.value)}
                    className="w-full min-w-0 rounded border border-border bg-surface-raised px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                </label>
              ))}
            </div>

            {stats && (
              <div className="min-w-0">
                {fieldLabel(`Final Stats · Lv ${set.level}`)}
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {STAT_IDS.map((stat) => (
                    <div
                      key={stat}
                      className="min-w-0 rounded-lg bg-surface-overlay px-2 py-2 text-center"
                    >
                      <p className="text-[11px] font-medium uppercase text-muted">{STAT_LABELS[stat]}</p>
                      <p className="font-display text-xl font-bold tabular-nums">
                        {stats[stat]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
