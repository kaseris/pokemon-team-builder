import { useEffect, type RefObject } from 'react';

type RefTarget = RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[];

function containsTarget(refs: RefTarget, target: Node): boolean {
  const list = Array.isArray(refs) ? refs : [refs];
  return list.some((ref) => ref.current?.contains(target));
}

/**
 * Calls `onDismiss` when the user interacts outside the referenced element(s),
 * either by pointing/clicking elsewhere or by moving focus to another element
 * (e.g. tabbing away). No-op while `enabled` is false so closed popovers don't
 * pay for listeners.
 */
export function useDismissOnOutside(
  refs: RefTarget,
  enabled: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: Event) => {
      const target = e.target as Node | null;
      if (target && !containsTarget(refs, target)) {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handle);
    document.addEventListener('focusin', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('focusin', handle);
    };
  }, [enabled, onDismiss]);
}
