import { useEffect, useMemo, useState } from 'react';
import { focusRingClass, useListKeyboardNavigation } from './hooks/useListKeyboardNavigation';
import { useTeam } from './hooks/useTeam';
import { getFormat } from './data/formats';
import { getBaseStats, getSpeciesList } from './data/dex';
import { validateTeam } from './engine/validation';
import { filterBySearch } from './engine/search-match';
import { FormatSelector } from './components/FormatSelector';
import { TeamSlotList } from './components/TeamSlotList';
import { PokemonSetEditor } from './components/PokemonSetEditor';
import { PokemonSprite } from './components/PokemonSprite';
import { ValidationPanel } from './components/ValidationPanel';
import { TypeMatchupChart } from './components/TypeMatchupChart';
import { BaseStatsPanel } from './components/BaseStatsPanel';
import { PokemonWeaknessPanel } from './components/PokemonWeaknessPanel';
import { OffensiveCoveragePanel } from './components/OffensiveCoveragePanel';
import { ImportExportModal } from './components/ImportExportModal';

function App() {
  const {
    team,
    selectedIndex,
    selectedSet,
    setSelectedIndex,
    updateTeam,
    addPokemon,
    updatePokemon,
    removePokemon,
    replaceTeam,
  } = useTeam();

  const [showImportExport, setShowImportExport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const format = getFormat(team.formatId);
  const issues = useMemo(() => validateTeam(team), [team]);
  const hasErrors = issues.some((i) => i.severity === 'error');
  const selectedBaseStats = selectedSet?.species
    ? getBaseStats(selectedSet.species, selectedSet.forme)
    : null;

  return (
    <div className="flex h-full min-w-[1440px] flex-col overflow-hidden px-7 py-5">
      <header className="mb-5 flex shrink-0 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Emblem />
          <div className="min-w-0">
            <p className="eyebrow">Team Builder · Gen 9 SV</p>
            <input
              type="text"
              value={team.name}
              onChange={(e) => updateTeam({ name: e.target.value })}
              placeholder="Untitled Team"
              aria-label="Team name"
              className="w-full max-w-[26rem] truncate border-b border-transparent bg-transparent font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground outline-none transition-colors placeholder:text-muted/50 hover:border-border focus:border-accent"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-end gap-3">
          <div className="w-60">
            <FormatSelector
              value={team.formatId}
              onChange={(formatId) => {
                updateTeam({ formatId });
                if (format) {
                  team.pokemon.forEach((_, i) => {
                    updatePokemon(i, { level: getFormat(formatId)?.defaultLevel ?? 100 });
                  });
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowImportExport(true)}
            className="flex cursor-pointer items-center rounded-lg border border-border bg-surface-overlay px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent hover:text-on-accent"
          >
            Import / Export
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_352px] gap-5">
        <aside className="panel min-h-0 overflow-y-auto overflow-x-visible p-4 pl-5">
          <TeamSlotList
            sets={team.pokemon}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onDeselect={() => setSelectedIndex(null)}
            onAdd={() => setShowAddModal(true)}
            onRemove={removePokemon}
          />
        </aside>

        <main className="panel min-h-0 overflow-y-auto overflow-x-hidden p-6">
          {selectedSet ? (
            <PokemonSetEditor
              set={selectedSet}
              defaultLevel={format?.defaultLevel ?? 100}
              onChange={(patch) => updatePokemon(selectedIndex!, patch)}
            />
          ) : (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-4 text-center">
              <Emblem size={64} />
              <p className="font-display text-2xl font-bold text-foreground">Build your roster</p>
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                Select a slot or add a Pokémon to start building. Sets, stats, and type
                coverage appear here.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-1 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-[0_8px_24px_-8px_var(--color-accent)] transition-transform hover:scale-[1.03]"
              >
                Add Pokémon
              </button>
            </div>
          )}
        </main>

        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden pr-0.5">
          {selectedSet?.species && (
            <>
              <p className="zone-label shrink-0">Selected Pokémon</p>
              {selectedBaseStats && (
                <BaseStatsPanel species={selectedSet.species} baseStats={selectedBaseStats} />
              )}
              <PokemonWeaknessPanel set={selectedSet} />
              <OffensiveCoveragePanel set={selectedSet} />
            </>
          )}
          <p className="zone-label shrink-0">Team Analysis</p>
          <div className="panel shrink-0 p-4">
            <ValidationPanel issues={issues} />
          </div>
          <div className="panel shrink-0 p-4">
            <TypeMatchupChart sets={team.pokemon} />
          </div>
          {hasErrors && (
            <p className="shrink-0 text-center text-xs text-muted">
              Fix validation errors before using this team in rated battles.
            </p>
          )}
        </aside>
      </div>

      {showImportExport && (
        <ImportExportModal
          team={team}
          onImport={replaceTeam}
          onClose={() => setShowImportExport(false)}
        />
      )}

      {showAddModal && (
        <AddPokemonModal
          onAdd={(species) => {
            addPokemon(species);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function Emblem({ size = 40 }: { size?: number }) {
  const stroke = Math.max(2.5, size * 0.07);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0 drop-shadow-[0_0_12px_color-mix(in_oklch,var(--color-accent)_45%,transparent)]"
    >
      <circle
        cx="24"
        cy="24"
        r="19"
        fill="color-mix(in oklch, var(--color-accent) 10%, transparent)"
        stroke="var(--color-accent)"
        strokeWidth={stroke}
      />
      <line x1="5" y1="24" x2="43" y2="24" stroke="var(--color-accent)" strokeWidth={stroke} />
      <circle cx="24" cy="24" r="6.5" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth={stroke} />
    </svg>
  );
}

function AddPokemonModal({
  onAdd,
  onClose,
}: {
  onAdd: (species: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const speciesList = useMemo(() => getSpeciesList(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return speciesList.slice(0, 80);
    return filterBySearch(speciesList, search, {
      kind: 'species',
      getName: (species) => species.name,
    }).slice(0, 80);
  }, [speciesList, search]);

  const { handleKeyDown, getItemProps, highlightClass } = useListKeyboardNavigation({
    enabled: filtered.length > 0,
    itemCount: filtered.length,
    onSelect: (index) => onAdd(filtered[index].name),
    onClose,
    resetDeps: [search, filtered],
  });

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-card flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/70 p-4">
          <div className="flex items-center gap-2.5">
            <Emblem size={22} />
            <h2 className="font-display text-lg font-bold">Add Pokémon</h2>
          </div>
          <button type="button" onClick={onClose} className={`text-muted hover:text-foreground ${focusRingClass}`}>✕</button>
        </div>
        <div className="p-4">
          <input
            type="search"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
              }
              handleKeyDown(e);
            }}
            placeholder="Search..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-4" role="listbox">
          {filtered.map((s, index) => {
            const itemProps = getItemProps(index);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
                  onMouseEnter={itemProps.onMouseEnter}
                  onClick={() => onAdd(s.name)}
                  className={highlightClass(
                    index,
                    `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-overlay ${focusRingClass}`,
                  )}
                >
                  <PokemonSprite species={s.name} size="icon" />
                  {s.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
