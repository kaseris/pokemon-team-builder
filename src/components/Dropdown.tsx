import { useRef, useState, type ReactNode } from 'react';
import { focusRingClass, useListKeyboardNavigation } from '../hooks/useListKeyboardNavigation';
import { useDismissOnOutside } from '../hooks/useDismissOnOutside';

type Props<T> = {
  options: T[];
  isSelected: (option: T) => boolean;
  getKey: (option: T) => string;
  /** Content shown inside the closed trigger button. */
  renderTrigger: ReactNode;
  renderOption: (option: T, selected: boolean) => ReactNode;
  onSelect: (option: T) => void;
  ariaLabel: string;
  /** Sizing/scroll classes for the open option list. */
  listClassName?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Styled replacement for a native <select>: a popover-backed list that matches
 * the app's surface/border tokens and supports arrow-key navigation. Generic so
 * each field (ability, tera type, nature) can render its own option content.
 */
export function Dropdown<T>({
  options,
  isSelected,
  getKey,
  renderTrigger,
  renderOption,
  onSelect,
  ariaLabel,
  listClassName = 'max-h-60',
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dismiss = () => setOpen(false);

  const select = (option: T) => {
    onSelect(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  useDismissOnOutside(containerRef, open, dismiss);

  const { handleKeyDown, getItemProps, highlightClass } = useListKeyboardNavigation({
    enabled: open && options.length > 0,
    itemCount: options.length,
    onSelect: (index) => select(options[index]),
    onClose: dismiss,
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
            return;
          }
          handleKeyDown(e);
        }}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${focusRingClass} ${
          open
            ? 'border-accent bg-surface-overlay'
            : 'border-border bg-surface-raised hover:border-accent-dim'
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center">{renderTrigger}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`popover absolute left-0 right-0 top-full z-20 mt-1 overflow-y-auto rounded-xl p-1.5 ${listClassName}`}
        >
          {options.map((option, index) => {
            const selected = isSelected(option);
            const itemProps = getItemProps(index);
            return (
              <li key={getKey(option)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
                  onMouseEnter={itemProps.onMouseEnter}
                  onClick={() => select(option)}
                  className={highlightClass(
                    index,
                    `flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-overlay ${
                      selected ? 'bg-accent/10' : ''
                    }`,
                  )}
                >
                  {renderOption(option, selected)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
