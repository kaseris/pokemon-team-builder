import { useEffect, type RefObject } from 'react';

type RefTarget = RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[];

function containsTarget(refs: RefTarget, target: Node): boolean {
  const list = Array.isArray(refs) ? refs : [refs];
  return list.some((ref) => ref.current?.contains(target));
}

/**
 * Calls `onDismiss` when the user interacts outside the referenced element(s),
 * either by pointing/clicking elsewhere, by moving focus to another element
 * (e.g. tabbing away), or by pressing Escape. No-op while `enabled` is false
 * so closed popovers don't pay for listeners.
 */
export function useDismissOnOutside(
  refs: RefTarget,
  enabled: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleOutside = (e: Event) => {
      const target = e.target as Node | null;
      if (target && !containsTarget(refs, target)) {
        onDismiss();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [enabled, onDismiss]);
}
