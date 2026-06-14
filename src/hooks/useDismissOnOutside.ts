import { useEffect, type RefObject } from 'react';

/**
 * Calls `onDismiss` when the user interacts outside the referenced element,
 * either by pointing/clicking elsewhere or by moving focus to another element
 * (e.g. tabbing away). No-op while `enabled` is false so closed popovers don't
 * pay for listeners.
 */
export function useDismissOnOutside(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: Event) => {
      const target = e.target as Node | null;
      if (target && ref.current && !ref.current.contains(target)) {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handle);
    document.addEventListener('focusin', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('focusin', handle);
    };
  }, [ref, enabled, onDismiss]);
}
