export type GameItem = {
  name: string;
  category?: string;
  /** Extra terms for search (e.g. Pokémon that can hold a mega stone). */
  searchTerms?: string[];
};
