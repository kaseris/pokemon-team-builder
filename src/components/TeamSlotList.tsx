import { useRef } from 'react';
import type { PokemonSet } from '../types/pokemon';
import { getTypes } from '../data/dex';
import { PokemonSprite } from './PokemonSprite';
import { ItemSprite } from './ItemSprite';
import { PokemonName } from './PokemonName';
import { CloseButton } from './CloseButton';
import { focusRingClass, handleSlotKeyDown } from '../hooks/useListKeyboardNavigation';

type Props = {
  sets: PokemonSet[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onDeselect?: () => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const TYPE_COLORS: Record<string, string> = {
  Normal: 'var(--color-type-normal)',
  Fire: 'var(--color-type-fire)',
  Water: 'var(--color-type-water)',
  Grass: 'var(--color-type-grass)',
  Electric: 'var(--color-type-electric)',
  Ice: 'var(--color-type-ice)',
  Fighting: 'var(--color-type-fighting)',
  Poison: 'var(--color-type-poison)',
  Ground: 'var(--color-type-ground)',
  Flying: 'var(--color-type-flying)',
  Psychic: 'var(--color-type-psychic)',
  Bug: 'var(--color-type-bug)',
  Rock: 'var(--color-type-rock)',
  Ghost: 'var(--color-type-ghost)',
  Dragon: 'var(--color-type-dragon)',
  Dark: 'var(--color-type-dark)',
  Steel: 'var(--color-type-steel)',
  Fairy: 'var(--color-type-fairy)',
  Stellar: 'var(--color-type-stellar)',
};

function SlotCard({
  set,
  index,
  selected,
  onSelect,
  onRemove,
  onDeselect,
  slotRef,
  onSlotKeyDown,
}: {
  set: PokemonSet;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDeselect?: () => void;
  slotRef: (el: HTMLButtonElement | null) => void;
  onSlotKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const types = set.species ? getTypes(set.species, set.forme) : [];
  const primaryType = types[0] ?? 'Normal';

  return (
    <div className="group/slot relative overflow-visible py-1.5">
      <button
        ref={slotRef}
        type="button"
        onClick={onSelect}
        onKeyDown={onSlotKeyDown}
        className={`relative flex min-h-[5.25rem] w-full min-w-0 flex-col gap-2 overflow-visible rounded-xl border pb-3 pl-[5.25rem] pr-3 pt-4 transition-all ${focusRingClass} ${
          selected
            ? 'border-accent bg-surface-overlay shadow-[0_0_0_1px_var(--color-accent-dim)]'
            : 'border-border bg-surface-raised hover:border-accent-dim'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-1 rounded-t-xl"
          style={{ background: TYPE_COLORS[primaryType] ?? 'var(--color-muted)' }}
        />

        {set.species && (
          <div className="pointer-events-none absolute -left-3 bottom-0 z-10 flex h-[7.25rem] w-[7.25rem] items-end">
            <PokemonSprite
              species={set.species}
              forme={set.forme}
              gender={set.gender}
              shiny={set.shiny}
              size="party"
              style="gen9"
              className="origin-bottom-left transition-transform duration-200 group-hover/slot:scale-[1.04] group-focus-within/slot:scale-[1.04]"
            />
          </div>
        )}

        {set.species && set.item && (
          <div className="pointer-events-none absolute bottom-0 left-0 z-20 flex">
            <ItemSprite item={set.item} size="xl" variant="plain" className="flex" />
          </div>
        )}

        {set.species ? (
          <div className="relative z-10 ml-auto flex w-full min-w-0 flex-col items-end gap-2 pr-6 text-right">
            <div className="min-w-0 max-w-full">
              <PokemonName
                as="p"
                name={set.nickname || set.species}
                className="line-clamp-2 font-display text-[15px] font-bold leading-snug break-words"
              />
              <p className="truncate text-[13px] text-muted">Lv.{set.level}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {types.map((t) => (
                <span
                  key={t}
                  className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
                  style={{ background: TYPE_COLORS[t] }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="relative z-10 -ml-[5.25rem] text-center text-[13px] text-muted">
            Slot {index + 1} — click to configure
          </p>
        )}
      </button>

      <CloseButton
        onClick={onRemove}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onDeselect?.();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        className="absolute right-0 top-1.5 z-30 -translate-y-1/2 translate-x-1/2 opacity-0 shadow-sm group-hover/slot:opacity-100 group-focus-within/slot:opacity-100"
        aria-label="Remove Pokémon"
      />
    </div>
  );
}

export function TeamSlotList({ sets, selectedIndex, onSelect, onDeselect, onAdd, onRemove }: Props) {
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Team</h2>
        <span className="text-[13px] font-semibold text-muted">{sets.length}/6</span>
      </div>
      <div className="grid min-w-0 gap-y-3" role="listbox" aria-label="Team slots">
        {sets.map((set, i) => (
          <SlotCard
            key={i}
            set={set}
            index={i}
            selected={selectedIndex === i}
            onSelect={() => onSelect(i)}
            onRemove={() => onRemove(i)}
            onDeselect={onDeselect}
            slotRef={(el) => {
              slotRefs.current[i] = el;
            }}
            onSlotKeyDown={handleSlotKeyDown({
              index: i,
              count: sets.length,
              onMove: onSelect,
              onDismiss: onDeselect,
              getRef: (idx) => slotRefs.current[idx] ?? null,
            })}
          />
        ))}
      </div>
      {sets.length < 6 && (
        <button
          type="button"
          onClick={onAdd}
          className={`rounded-xl border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent-dim ${focusRingClass}`}
        >
          + Add Pokémon
        </button>
      )}
    </div>
  );
}
