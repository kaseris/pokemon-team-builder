import { useEffect } from 'react';
import type { AppSettings } from '../hooks/useSettings';
import { focusRingClass } from '../hooks/useListKeyboardNavigation';
import { CloseButton } from './CloseButton';

type Props = {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
};

export function SettingsModal({ settings, onUpdate, onClose }: Props) {
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
        className="modal-card w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="section-title text-base">Settings</h2>
          <CloseButton onClick={onClose} aria-label="Close settings" />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Jirachi Assistant</p>
            <p className="mt-0.5 text-xs text-muted">Show the 3D assistant in the corner</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.assistantEnabled}
            aria-label="Toggle Jirachi Assistant"
            onClick={() => onUpdate({ assistantEnabled: !settings.assistantEnabled })}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${focusRingClass} ${
              settings.assistantEnabled
                ? 'border-accent bg-accent'
                : 'border-border bg-surface-overlay'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface-raised shadow-sm transition-transform ${
                settings.assistantEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          3D model from{' '}
          <a
            href="https://github.com/Pokemon-3D-api/assets"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline decoration-accent/60 underline-offset-2 hover:decoration-accent"
          >
            Pokemon-3D-api
          </a>{' '}
          (open-source, non-commercial fan project).
        </p>
      </div>
    </div>
  );
}
