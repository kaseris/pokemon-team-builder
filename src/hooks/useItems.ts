import { useEffect, useState } from 'react';
import { fetchItems } from '../api/items';
import type { GameItem } from '../types/items';

type State = {
  items: GameItem[];
  loading: boolean;
  error: string | null;
  source: 'pokeapi' | 'dex' | null;
};

export function useItems() {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
    source: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetchItems()
      .then(({ items, source }) => {
        if (!cancelled) {
          setState({ items, loading: false, error: null, source });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            items: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load items',
            source: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
