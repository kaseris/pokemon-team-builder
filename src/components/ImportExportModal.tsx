import { useState } from 'react';
import type { Team } from '../types/pokemon';
import { importShowdown, exportShowdown } from '../showdown/import-export';
import { CloseButton } from './CloseButton';

type Props = {
  team: Team;
  onImport: (team: Team) => void;
  onClose: () => void;
};

export function ImportExportModal({ team, onImport, onClose }: Props) {
  const [text, setText] = useState(exportShowdown(team));
  const [mode, setMode] = useState<'import' | 'export'>('export');

  const handleImport = () => {
    onImport(importShowdown(text, team.formatId));
    onClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportShowdown(team));
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-card w-full max-w-lg rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title text-base">Showdown Import / Export</h2>
          <CloseButton onClick={onClose} aria-label="Close" />
        </div>

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => { setMode('export'); setText(exportShowdown(team)); }}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'export' ? 'bg-accent text-on-accent' : 'text-muted hover:bg-surface-overlay'}`}
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => { setMode('import'); setText(''); }}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'import' ? 'bg-accent text-on-accent' : 'text-muted hover:bg-surface-overlay'}`}
          >
            Import
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Paste Pokémon Showdown team export..."
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs outline-none focus:border-accent"
        />

        <div className="mt-4 flex justify-end gap-2">
          {mode === 'export' ? (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-overlay"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-overlay"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent"
              >
                Import Team
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
