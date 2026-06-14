import { FORMATS } from '../data/formats';
import type { BattleFormat } from '../types/format';
import { Dropdown } from './Dropdown';

type Props = {
  value: string;
  onChange: (formatId: string) => void;
};

export function FormatSelector({ value, onChange }: Props) {
  const selected = FORMATS.find((f) => f.id === value);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">Format</span>
      <Dropdown<BattleFormat>
        options={FORMATS}
        isSelected={(f) => f.id === value}
        getKey={(f) => f.id}
        ariaLabel="Battle format"
        onSelect={(f) => onChange(f.id)}
        renderTrigger={
          <span className="truncate font-semibold text-foreground">
            {selected?.name ?? 'Select format'}
          </span>
        }
        renderOption={(f, isSelected) => (
          <span className={`truncate text-foreground ${isSelected ? 'font-semibold' : 'font-medium'}`}>
            {f.name}
          </span>
        )}
      />
    </div>
  );
}
