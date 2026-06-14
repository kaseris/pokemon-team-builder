import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { PokemonSet } from '../types/pokemon';
import type { LearnableMove, LearnMethod } from '../types/moves';
import { LEARN_METHOD_LABELS } from '../types/moves';
import { useLearnableMoves } from '../hooks/useLearnableMoves';
import {
  focusRingClass,
  handleSlotKeyDown,
  useListKeyboardNavigation,
} from '../hooks/useListKeyboardNavigation';
import { useDismissOnOutside } from '../hooks/useDismissOnOutside';
import { useOverlayPlacement } from '../hooks/useOverlayPlacement';
import { useFloatingPanel } from '../hooks/useFloatingPanel';
import { getMoveDisplayData, getMoveEffect, moveTypeAccentColor } from '../data/move-display';
import { MoveDisplay, moveSlotStyle } from './MoveDisplay';
import { MoveEffectPreview } from './MoveEffectPreview';
import { FloatingMoveEffect } from './FloatingMoveEffect';
import { CloseButton } from './CloseButton';

type Props = {
  set: PokemonSet;
  onChange: (patch: Partial<PokemonSet>) => void;
};

const METHOD_FILTERS: (LearnMethod | 'all')[] = ['all', 'level-up', 'machine', 'egg', 'tutor'];

function methodTags(methods: LearnMethod[]) {
  const order: LearnMethod[] = ['level-up', 'machine', 'egg', 'tutor', 'other'];
  return order.filter((m) => methods.includes(m));
}

export function MoveSelector({ set, onChange }: Props) {
  const { moves, loading, error, source } = useLearnableMoves(set.species, set.forme);
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<LearnMethod | 'all'>('all');
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const slotContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pickerPortalRef = useRef<HTMLDivElement>(null);
  const movesGroupRef = useRef<HTMLDivElement>(null);
  const [focusedSlot, setFocusedSlot] = useState(0);

  useEffect(() => {
    setOpenSlot(null);
    setSearch('');
    setMethodFilter('all');
    setFocusedSlot(0);
  }, [set.species, set.forme]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return moves.filter((move) => {
      if (methodFilter !== 'all' && !move.methods.includes(methodFilter)) return false;
      if (!q) return true;
      return move.name.toLowerCase().includes(q);
    });
  }, [moves, search, methodFilter]);

  const selected = new Set(set.moves.filter(Boolean));

  const updateMove = (index: number, moveName: string) => {
    const movesList = [...set.moves];
    movesList[index] = moveName;
    onChange({ moves: movesList });
    setOpenSlot(null);
    setSearch('');
  };

  const clearMove = (index: number) => {
    const movesList = [...set.moves];
    movesList[index] = '';
    onChange({ moves: movesList });
  };

  const closePicker = () => {
    setOpenSlot(null);
    setSearch('');
    if (openSlot !== null) {
      slotRefs.current[openSlot]?.focus();
    }
  };

  // Close the open move picker (without refocusing) when the user clicks or
  // tabs outside the moves group.
  useDismissOnOutside([movesGroupRef, pickerPortalRef], openSlot !== null, () => {
    setOpenSlot(null);
    setSearch('');
  });

  const focusMoveSlot = useCallback((index: number) => {
    setFocusedSlot(index);
    requestAnimationFrame(() => {
      slotRefs.current[index]?.focus();
    });
  }, []);

  const handleMovesKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || set.moves.length <= 1) return;

      const target = e.target as Node;
      if (!movesGroupRef.current?.contains(target)) return;

      let currentIndex = slotRefs.current.findIndex((ref) => ref === target);
      if (currentIndex < 0 && openSlot !== null) {
        currentIndex = openSlot;
      }
      if (currentIndex < 0) return;

      e.preventDefault();
      e.stopPropagation();

      const count = set.moves.length;
      const next = e.shiftKey ? (currentIndex - 1 + count) % count : (currentIndex + 1) % count;

      if (openSlot !== null) {
        setOpenSlot(null);
        setSearch('');
      }

      focusMoveSlot(next);
    },
    [focusMoveSlot, openSlot, set.moves.length],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">Moves</span>
        {loading && <span className="text-xs text-muted">Loading learnset…</span>}
        {!loading && source && (
          <span className="text-[11px] text-muted">
            via {source === 'pokeapi' ? 'PokeAPI' : 'Showdown dex'}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div
        ref={movesGroupRef}
        className="grid gap-2"
        role="group"
        aria-label="Moves"
        onKeyDownCapture={handleMovesKeyDownCapture}
      >
        {set.moves.map((move, index) => {
          const moveData = move ? getMoveDisplayData(move) : null;
          const slotFocused = openSlot === index;
          const typeStyle = moveData
            ? (moveSlotStyle(moveData.type, slotFocused) as CSSProperties | undefined)
            : undefined;

          return (
          <div
            key={index}
            ref={(el) => {
              slotContainerRefs.current[index] = el;
            }}
            className={
              openSlot === index
                ? 'relative z-[1]'
                : openSlot !== null
                  ? 'relative z-0'
                  : 'relative'
            }
          >
            <div className="flex gap-2">
              <button
                ref={(el) => {
                  slotRefs.current[index] = el;
                }}
                type="button"
                tabIndex={index === focusedSlot ? 0 : -1}
                onFocus={() => setFocusedSlot(index)}
                onClick={() => {
                  setFocusedSlot(index);
                  setOpenSlot(openSlot === index ? null : index);
                  setSearch('');
                }}
                onKeyDown={
                  openSlot === null
                    ? handleSlotKeyDown({
                        index,
                        count: set.moves.length,
                        onMove: focusMoveSlot,
                        onDismiss: () => slotRefs.current[index]?.blur(),
                        getRef: (i) => slotRefs.current[i] ?? null,
                      })
                    : undefined
                }
                style={typeStyle}
                className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${focusRingClass} ${
                  slotFocused
                    ? 'border-accent bg-surface-overlay'
                    : move
                      ? 'hover:brightness-[0.98]'
                      : 'border-border bg-surface-raised hover:border-accent-dim'
                }`}
              >
                {move ? (
                  <MoveDisplay move={move} variant="slot" />
                ) : (
                  <span className="text-muted">Select move {index + 1}</span>
                )}
              </button>
              {move && (
                <CloseButton
                  tabIndex={-1}
                  onClick={() => clearMove(index)}
                  aria-label={`Clear move ${index + 1}`}
                />
              )}
            </div>

            {openSlot === index && (
              <MovePicker
                portalRef={pickerPortalRef}
                anchorRefs={slotContainerRefs}
                anchorIndex={index}
                moves={filtered}
                loading={loading}
                search={search}
                methodFilter={methodFilter}
                selected={selected}
                current={move}
                onSearchChange={setSearch}
                onMethodFilterChange={setMethodFilter}
                onSelect={(name) => updateMove(index, name)}
                onClose={closePicker}
              />
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function MovePicker({
  portalRef,
  anchorRefs,
  anchorIndex,
  moves,
  loading,
  search,
  methodFilter,
  selected,
  current,
  onSearchChange,
  onMethodFilterChange,
  onSelect,
  onClose,
}: {
  portalRef: RefObject<HTMLDivElement | null>;
  anchorRefs: RefObject<(HTMLDivElement | null)[]>;
  anchorIndex: number;
  moves: LearnableMove[];
  loading: boolean;
  search: string;
  methodFilter: LearnMethod | 'all';
  selected: Set<string>;
  current: string;
  onSearchChange: (value: string) => void;
  onMethodFilterChange: (value: LearnMethod | 'all') => void;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const getAnchor = useCallback(
    () => anchorRefs.current[anchorIndex] ?? null,
    [anchorRefs, anchorIndex],
  );
  const placement = useOverlayPlacement(getAnchor, true);
  const { panelRef, style } = useFloatingPanel(getAnchor, placement, true);

  const setPanelRef = useCallback(
    (el: HTMLDivElement | null) => {
      panelRef.current = el;
      portalRef.current = el;
    },
    [panelRef, portalRef],
  );

  const isDisabled = (index: number) => {
    const move = moves[index];
    if (!move) return true;
    return selected.has(move.name) && move.name !== current;
  };

  const { handleKeyDown, getItemProps, activeIndex } = useListKeyboardNavigation({
    enabled: !loading && moves.length > 0,
    itemCount: moves.length,
    onSelect: (index) => onSelect(moves[index].name),
    onClose,
    isDisabled,
    resetDeps: [search, methodFilter, moves],
  });

  const focusedMove = moves[activeIndex];
  const focusedEffect = focusedMove ? getMoveEffect(focusedMove.name) : null;
  const effectInsidePicker = placement === 'below';

  const picker = (
    <>
      {focusedMove && !effectInsidePicker && (
        <FloatingMoveEffect
          anchorRef={panelRef}
          move={focusedMove}
          effect={focusedEffect}
        />
      )}

      <div
        ref={setPanelRef}
        style={style}
        className="flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <div className="popover flex min-h-0 flex-1 flex-col rounded-xl p-3">
          <div className="mb-2 flex shrink-0 items-center gap-2">
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search moves…"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <CloseButton tabIndex={-1} onClick={onClose} aria-label="Close move picker" />
          </div>

          <div className="mb-2 flex shrink-0 flex-wrap gap-1">
            {METHOD_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                tabIndex={-1}
                onClick={() => onMethodFilterChange(filter)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${focusRingClass} ${
                  methodFilter === filter
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface-raised text-muted hover:text-foreground'
                }`}
              >
                {filter === 'all' ? 'All' : LEARN_METHOD_LABELS[filter]}
              </button>
            ))}
          </div>

          {focusedMove && effectInsidePicker && (
            <div className="mb-2">
              <MoveEffectPreview move={focusedMove} effect={focusedEffect} />
            </div>
          )}

          <ul
            className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-surface-raised"
            role="listbox"
          >
            {loading ? (
              <li className="px-3 py-4 text-center text-sm text-muted">Fetching learnable moves…</li>
            ) : moves.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted">No matching moves</li>
            ) : (
              moves.map((move, index) => {
                const taken = isDisabled(index);
                const itemProps = getItemProps(index);
                return (
                  <li key={move.name}>
                    <button
                      type="button"
                      tabIndex={-1}
                      disabled={taken}
                      ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
                      onMouseEnter={itemProps.onMouseEnter}
                      onClick={() => onSelect(move.name)}
                      className={`flex w-full items-center gap-2.5 border-l-[4px] px-3 py-2.5 text-left ${
                        index === activeIndex ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                      } ${
                        taken
                          ? 'cursor-not-allowed opacity-40'
                          : 'hover:bg-surface-overlay'
                      } ${move.name === current ? 'bg-accent/10' : ''}`}
                      style={{ borderLeftColor: moveTypeAccentColor(move.type ?? 'Normal') }}
                    >
                      <MoveDisplay
                        move={move}
                        variant="picker"
                        suffix={
                          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                            {methodTags(move.methods)
                              .map((m) => LEARN_METHOD_LABELS[m])
                              .join(' · ')}
                            {move.minLevel !== undefined ? ` · Lv${move.minLevel}` : ''}
                          </span>
                        }
                      />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </>
  );

  return createPortal(picker, document.body);
}
