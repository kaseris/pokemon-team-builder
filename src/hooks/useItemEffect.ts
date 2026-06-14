import { useEffect, useState } from 'react';
import { fetchItemEffect } from '../api/items';

type State = {
  effect: string | null;
  loading: boolean;
};

/**
 * Lazily fetch an item's effect text. The request only fires once `enabled`
 * becomes true (e.g. on hover), so item descriptions aren't fetched eagerly.
 */
export function useItemEffect(item: string, enabled: boolean): State {
  // Tracks which item the stored effect belongs to so we can derive `loading`
  // without resetting state synchronously inside the effect.
  const [resolved, setResolved] = useState<{ item: string; effect: string | null } | null>(null);

  useEffect(() => {
    if (!enabled || !item) return;

    let cancelled = false;
    fetchItemEffect(item)
      .then((effect) => {
        if (!cancelled) setResolved({ item, effect });
      })
      .catch(() => {
        if (!cancelled) setResolved({ item, effect: null });
      });

    return () => {
      cancelled = true;
    };
  }, [item, enabled]);

  const ready = resolved?.item === item;
  return {
    effect: ready ? resolved!.effect : null,
    loading: enabled && !ready,
  };
}
