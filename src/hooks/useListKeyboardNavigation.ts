import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  /** Whether keyboard navigation is active */
  enabled: boolean;
  itemCount: number;
  onSelect: (index: number) => void;
  onClose?: () => void;
  isDisabled?: (index: number) => boolean;
  loop?: boolean;
  resetDeps?: unknown[];
};

function findNextIndex(
  current: number,
  direction: 1 | -1,
  count: number,
  isDisabled?: (index: number) => boolean,
  loop = true,
): number {
  if (count === 0) return 0;

  for (let step = 1; step <= count; step++) {
    const candidate = current + direction * step;
    if (candidate < 0 || candidate >= count) {
      if (!loop) return current;
      const wrapped = direction === 1 ? candidate % count : (candidate + count) % count;
      if (!isDisabled?.(wrapped)) return wrapped;
      continue;
    }
    if (!isDisabled?.(candidate)) return candidate;
  }

  return current;
}

export function useListKeyboardNavigation({
  enabled,
  itemCount,
  onSelect,
  onClose,
  isDisabled,
  loop = true,
  resetDeps = [],
}: Options) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setActiveIndex(0);
  }, [enabled, itemCount, ...resetDeps]);

  useEffect(() => {
    if (!enabled) return;
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, enabled]);

  const move = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => findNextIndex(current, direction, itemCount, isDisabled, loop));
    },
    [itemCount, isDisabled, loop],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const consume = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      if (!enabled || itemCount === 0) {
        if (e.key === 'Escape' && enabled) {
          consume();
          onClose?.();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          consume();
          onClose?.();
          break;
        case 'ArrowDown':
          consume();
          move(1);
          break;
        case 'ArrowUp':
          consume();
          move(-1);
          break;
        case 'Enter':
          if (!isDisabled?.(activeIndex)) {
            consume();
            onSelect(activeIndex);
          }
          break;
      }
    },
    [enabled, itemCount, activeIndex, isDisabled, move, onClose, onSelect],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      'data-active': index === activeIndex || undefined,
      onMouseEnter: () => setActiveIndex(index),
    }),
    [activeIndex],
  );

  const highlightClass = (index: number, base = '') =>
    `${base} ${index === activeIndex ? 'bg-surface-overlay ring-1 ring-inset ring-accent/40' : ''}`.trim();

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getItemProps,
    highlightClass,
  };
}

type SlotOptions = {
  index: number;
  count: number;
  onMove: (index: number) => void;
  onDismiss?: () => void;
  getRef: (index: number) => HTMLButtonElement | null;
  axis?: 'vertical' | 'horizontal';
  /** When true, Tab / Shift+Tab cycle between slots instead of leaving the group */
  tabCycle?: boolean;
};

export function handleSlotKeyDown({
  index,
  count,
  onMove,
  onDismiss,
  getRef,
  axis = 'vertical',
  tabCycle = false,
}: SlotOptions) {
  return (e: React.KeyboardEvent) => {
    if (tabCycle && e.key === 'Tab' && count > 1) {
      e.preventDefault();
      const next = e.shiftKey ? (index - 1 + count) % count : (index + 1) % count;
      onMove(next);
      getRef(next)?.focus();
      return;
    }

    const prevKey = axis === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = axis === 'vertical' ? 'ArrowDown' : 'ArrowRight';

    if (e.key === nextKey) {
      e.preventDefault();
      const next = Math.min(index + 1, count - 1);
      if (next !== index) {
        onMove(next);
        getRef(next)?.focus();
      }
      return;
    }

    if (e.key === prevKey) {
      e.preventDefault();
      const prev = Math.max(index - 1, 0);
      if (prev !== index) {
        onMove(prev);
        getRef(prev)?.focus();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onDismiss?.();
      (e.currentTarget as HTMLElement).blur();
    }
  };
}

export const focusRingClass =
  'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised';
