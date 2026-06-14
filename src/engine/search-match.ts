import { toID } from '../data/dex';
import {
  SHOWDOWN_ITEM_ALIASES,
  SHOWDOWN_MOVE_ALIASES,
  SHOWDOWN_SPECIES_ALIASES,
} from '../data/showdown-aliases';

export type SearchKind = 'move' | 'item' | 'species';

const ALIAS_MAPS: Record<SearchKind, Record<string, string>> = {
  move: SHOWDOWN_MOVE_ALIASES,
  item: SHOWDOWN_ITEM_ALIASES,
  species: SHOWDOWN_SPECIES_ALIASES,
};

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function normalizeSearchName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function namesMatch(a: string, b: string): boolean {
  return toID(a) === toID(b);
}

export function isSubsequence(query: string, target: string): boolean {
  if (!query) return true;
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

export function isWordInitialSubsequence(query: string, displayName: string): boolean {
  if (!query) return true;
  const initials = displayName
    .split(/[\s-]+/)
    .map((word) => word[0]?.toLowerCase() ?? '')
    .join('');
  return isSubsequence(query, initials);
}

export function resolveShowdownAlias(kind: SearchKind, query: string): string | undefined {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return undefined;
  return ALIAS_MAPS[kind][normalized];
}

type MatchTargetOptions = {
  extraTerms?: string[];
};

export function matchesSearchTarget(
  query: string,
  targetName: string,
  opts: MatchTargetOptions = {},
): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;

  const normalizedName = normalizeSearchName(targetName);
  const displayLower = targetName.toLowerCase();

  if (displayLower.includes(q)) return true;
  if (isSubsequence(q, normalizedName)) return true;
  if (isWordInitialSubsequence(q, targetName)) return true;

  return opts.extraTerms?.some((term) => {
    const lower = term.toLowerCase();
    const normalized = normalizeSearchName(term);
    return (
      lower.includes(q) ||
      isSubsequence(q, normalized) ||
      isWordInitialSubsequence(q, term)
    );
  }) ?? false;
}

export type FilterBySearchOptions<T> = {
  kind: SearchKind;
  getName: (item: T) => string;
  getExtraTerms?: (item: T) => string[] | undefined;
};

export function filterBySearch<T>(items: T[], query: string, opts: FilterBySearchOptions<T>): T[] {
  const q = normalizeSearchQuery(query);
  if (!q) return items;

  const aliasTarget = resolveShowdownAlias(opts.kind, q);
  if (aliasTarget) {
    const aliasHits = items.filter((item) => namesMatch(opts.getName(item), aliasTarget));
    if (aliasHits.length > 0) return aliasHits;
  }

  return items.filter((item) =>
    matchesSearchTarget(q, opts.getName(item), {
      extraTerms: opts.getExtraTerms?.(item),
    }),
  );
}
