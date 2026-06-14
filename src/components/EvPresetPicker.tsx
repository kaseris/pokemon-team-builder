import type { StatsTable } from '../types/pokemon';
import { EV_PRESETS, ZERO_EVS, evsMatch, totalEvs } from '../engine/stats';
import { focusRingClass } from '../hooks/useListKeyboardNavigation';
import { Tooltip } from './Tooltip';

type Props = {
  evs: StatsTable;
  onChange: (evs: StatsTable) => void;
};

export function EvPresetPicker({ evs, onChange }: Props) {
  const total = totalEvs(evs);
  const isClear = evsMatch(evs, ZERO_EVS);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">
          EVs ({total}/510)
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...ZERO_EVS })}
          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${focusRingClass} ${
            isClear
              ? 'bg-accent/25 text-foreground'
              : 'text-muted hover:bg-surface-overlay hover:text-foreground'
          }`}
        >
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EV_PRESETS.map((preset) => {
          const active = evsMatch(evs, preset.evs);
          return (
            <Tooltip key={preset.label} label={preset.description}>
              <button
                type="button"
                onClick={() => onChange({ ...preset.evs })}
                className={`rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-colors ${focusRingClass} ${
                  active
                    ? 'border-accent bg-accent/25 text-foreground'
                    : 'border-border bg-surface-raised text-muted hover:border-accent-dim hover:text-foreground'
                }`}
              >
                {preset.label}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
