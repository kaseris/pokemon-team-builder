import { useMemo, useRef, useState } from 'react';
import type { PokemonSet } from '../types/pokemon';
import { useItems } from '../hooks/useItems';
import { ItemSprite } from './ItemSprite';
import { CloseButton } from './CloseButton';
import { focusRingClass, useListKeyboardNavigation } from '../hooks/useListKeyboardNavigation';
import { useDismissOnOutside } from '../hooks/useDismissOnOutside';

type Props = {
  value?: string;
  onChange: (patch: Partial<PokemonSet>) => void;
};

/** Common misspellings / alternate names → Showdown item name */
const ITEM_SEARCH_ALIASES: Record<string, string> = {
  excadrillite: 'Excadrite',
  excadrinite: 'Excadrite',
};

export function ItemSelector({ value, onChange }: Props) {
  const { items, loading, error, source } = useItems();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => {
      const name = item.name.toLowerCase();
      const category = item.category?.toLowerCase() ?? '';
      if (name.includes(q) || category.includes(q)) return true;
      if (item.searchTerms?.some((term) => term.includes(q))) return true;
      return Object.entries(ITEM_SEARCH_ALIASES).some(
        ([alias, itemName]) =>
          itemName === item.name && alias.includes(q),
      );
    });
  }, [items, search]);

  const selectItem = (name: string) => {
    onChange({ item: name });
    setOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  };

  const closePicker = () => {
    setOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  };

  const clearItem = () => {
    onChange({ item: undefined });
    setOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  };

  const { handleKeyDown, getItemProps, highlightClass } = useListKeyboardNavigation({
    enabled: open && !loading && filtered.length > 0,
    itemCount: filtered.length,
    onSelect: (index) => selectItem(filtered[index].name),
    onClose: closePicker,
    resetDeps: [search, filtered],
  });

  // Close (without yanking focus back to the trigger) when the user clicks or
  // tabs outside the picker.
  useDismissOnOutside(containerRef, open, () => {
    setOpen(false);
    setSearch('');
  });

  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">Item</span>
        {loading && <span className="text-xs text-muted">Loading items…</span>}
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

      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              setOpen(!open);
              setSearch('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && open) {
                e.preventDefault();
                closePicker();
              }
            }}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${focusRingClass} ${
              open
                ? 'border-accent bg-surface-overlay'
                : 'border-border bg-surface-raised hover:border-accent-dim'
            }`}
          >
            {value ? (
              <>
                <ItemSprite item={value} size="md" variant="plain" disableTitle />
                <span className="truncate font-medium text-foreground">{value}</span>
              </>
            ) : (
              <span className="text-muted">No item</span>
            )}
          </button>
          {value && (
            <CloseButton onClick={clearItem} aria-label="Clear item" />
          )}
        </div>

        {open && (
          <div
            className="popover absolute left-0 right-0 top-full z-20 mt-1 rounded-xl p-3"
            onKeyDown={handleKeyDown}
          >
            <div className="mb-2 flex items-center gap-2">
              <input
                type="search"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search items…"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <CloseButton onClick={closePicker} aria-label="Close item picker" />
            </div>

            <ul className="max-h-52 overflow-y-auto rounded-lg border border-border bg-surface-raised" role="listbox">
              {loading ? (
                <li className="px-3 py-4 text-center text-sm text-muted">Fetching items…</li>
              ) : filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-muted">No matching items</li>
              ) : (
                filtered.map((item, index) => {
                  const itemProps = getItemProps(index);
                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
                        onMouseEnter={itemProps.onMouseEnter}
                        onClick={() => selectItem(item.name)}
                        className={highlightClass(
                          index,
                          `flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-overlay ${
                            item.name === value ? 'bg-accent/10' : ''
                          }`,
                        )}
                      >
                        <ItemSprite item={item.name} size="sm" />
                        <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{item.name}</span>
                        {item.category && (
                          <span className="shrink-0 rounded-full bg-surface-overlay px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {item.category}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
