import { useCallback, useEffect, useState } from 'react';
import type { PokemonSet, Team } from '../types/pokemon';
import { createEmptySet, createEmptyTeam } from '../types/pokemon';

const STORAGE_KEY = 'pokemon-team-builder-team';

function loadTeam(): Team {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Team;
  } catch {
    /* ignore */
  }
  return createEmptyTeam();
}

export function useTeam() {
  const [team, setTeam] = useState<Team>(loadTeam);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  }, [team]);

  const updateTeam = useCallback((patch: Partial<Team>) => {
    setTeam((prev) => ({ ...prev, ...patch }));
  }, []);

  const addPokemon = useCallback((species: string) => {
    setTeam((prev) => {
      if (prev.pokemon.length >= 6) return prev;
      const set = createEmptySet(species);
      const newIndex = prev.pokemon.length;
      setSelectedIndex(newIndex);
      return { ...prev, pokemon: [...prev.pokemon, set] };
    });
  }, []);

  const updatePokemon = useCallback((index: number, patch: Partial<PokemonSet>) => {
    setTeam((prev) => ({
      ...prev,
      pokemon: prev.pokemon.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }, []);

  const removePokemon = useCallback((index: number) => {
    setTeam((prev) => ({
      ...prev,
      pokemon: prev.pokemon.filter((_, i) => i !== index),
    }));
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  }, []);

  const replaceTeam = useCallback((newTeam: Team) => {
    setTeam(newTeam);
    setSelectedIndex(newTeam.pokemon.length > 0 ? 0 : null);
  }, []);

  const selectedSet = selectedIndex !== null ? team.pokemon[selectedIndex] ?? null : null;

  return {
    team,
    selectedIndex,
    selectedSet,
    setSelectedIndex,
    updateTeam,
    addPokemon,
    updatePokemon,
    removePokemon,
    replaceTeam,
  };
}
