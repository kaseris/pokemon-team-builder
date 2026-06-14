import { useMemo, useRef, useState } from 'react';
import { getSpeciesList } from '../data/dex';
import { PokemonSprite } from './PokemonSprite';
import { CloseButton } from './CloseButton';
import { focusRingClass, useListKeyboardNavigation } from '../hooks/useListKeyboardNavigation';
import { useDismissOnOutside } from '../hooks/useDismissOnOutside';
import { filterBySearch } from '../engine/search-match';

export type SearchSpecies = ReturnType<typeof getSpeciesList>[number];

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (species: SearchSpecies) => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputClassName?: string;
  listClassName?: string;
};

export function SpeciesSearch({
  value,
  onChange,
  onSelect,
  placeholder,
  autoFocus,
  inputClassName = '',
  listClassName = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const speciesList = useMemo(() => getSpeciesList(), []);

  const filtered = useMemo(() => {
    if (!value.trim()) return speciesList.slice(0, 50);
    return filterBySearch(speciesList, value, {
      kind: 'species',
      getName: (species) => species.name,
    }).slice(0, 50);
  }, [speciesList, value]);

  const listOpen = open && Boolean(value);

  const close = () => setOpen(false);

  // Close the suggestion list when the user clicks or tabs outside.
  useDismissOnOutside(containerRef, listOpen, close);

  const pick = (species: SearchSpecies) => {
    onSelect(species);
    onChange('');
    close();
  };

  const { handleKeyDown, getItemProps, highlightClass } = useListKeyboardNavigation({
    enabled: listOpen && filtered.length > 0,
    itemCount: filtered.length,
    onSelect: (index) => pick(filtered[index]),
    onClose: close,
    resetDeps: [value, filtered],
  });

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onChange('');
      close();
      e.currentTarget.blur();
      return;
    }
    handleKeyDown(e);
  };

  return (
    <div ref={containerRef} className="contents">
      <div className="relative">
        <input
          type="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(Boolean(e.target.value));
          }}
          onFocus={() => setOpen(Boolean(value))}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          className={`${inputClassName} pr-10`}
        />
        {value && (
          <CloseButton
            onClick={() => {
              onChange('');
              close();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          />
        )}
      </div>
      {listOpen && filtered.length > 0 && (
        <ul
          className={`popover overflow-y-auto rounded-lg text-left ${listClassName}`}
          role="listbox"
          onKeyDown={handleKeyDown}
        >
          {filtered.map((species, index) => {
            const itemProps = getItemProps(index);
            return (
              <li key={species.id}>
                <button
                  type="button"
                  ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
                  onMouseEnter={itemProps.onMouseEnter}
                  onClick={() => pick(species)}
                  className={highlightClass(
                    index,
                    `flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-raised ${focusRingClass}`,
                  )}
                >
                  <PokemonSprite species={species.name} size="icon" />
                  {species.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
