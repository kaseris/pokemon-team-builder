import type { StatsTable } from '../types/pokemon';
import { BaseStatDiamond } from './BaseStatDiamond';

type Props = {
  species: string;
  baseStats: StatsTable;
};

export function BaseStatsPanel({ species, baseStats }: Props) {
  return (
    <div className="panel p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="section-title">Base Stats</h2>
        <span className="truncate text-sm font-semibold text-foreground/80">{species}</span>
      </div>
      <div className="flex justify-center py-2">
        <BaseStatDiamond
          baseStats={baseStats}
          size={280}
          prominent
          showTitle={false}
          className="w-full max-w-[300px]"
        />
      </div>
    </div>
  );
}
