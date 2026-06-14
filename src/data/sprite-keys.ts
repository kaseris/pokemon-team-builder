/** Normalized lookup key for species + optional forme (Showdown-style). */
export function toKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function speciesKey(species: string, forme?: string): string {
  const full =
    forme && !species.includes('-') ? `${species}-${forme}` : species;
  return toKey(full);
}
