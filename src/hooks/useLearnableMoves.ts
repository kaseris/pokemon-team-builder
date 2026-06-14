import { useEffect, useState } from 'react';
import { fetchLearnableMoves } from '../api/learnable-moves';
import type { LearnableMove } from '../types/moves';

type State = {
  moves: LearnableMove[];
  loading: boolean;
  error: string | null;
  source: 'pokeapi' | 'dex' | null;
};

export function useLearnableMoves(species: string, forme?: string) {
  const [state, setState] = useState<State>({
    moves: [],
    loading: false,
    error: null,
    source: null,
  });

  useEffect(() => {
    if (!species) {
      setState({ moves: [], loading: false, error: null, source: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchLearnableMoves(species, forme)
      .then(({ moves, source }) => {
        if (!cancelled) {
          setState({ moves, loading: false, error: null, source });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            moves: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load moves',
            source: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [species, forme]);

  return state;
}
