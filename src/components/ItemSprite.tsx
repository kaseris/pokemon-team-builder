import { useEffect, useMemo, useState } from 'react';
import { getItemSpriteSources, isHighResItemTier } from '../data/item-sprites';
import { useItemEffect } from '../hooks/useItemEffect';

const SIZES = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 44,
} as const;

type Props = {
  item: string;
  size?: keyof typeof SIZES;
  variant?: 'boxed' | 'plain';
  showLabel?: boolean;
  /** When labeled, reveal the item's effect text above the name on hover/focus. */
  showEffect?: boolean;
  /** Suppress the native hover tooltip (use when the name is already shown beside the sprite). */
  disableTitle?: boolean;
  className?: string;
  labelClassName?: string;
};

export function ItemSprite({
  item,
  size = 'md',
  variant = 'boxed',
  showLabel = false,
  showEffect = false,
  disableTitle = false,
  className = '',
  labelClassName = '',
}: Props) {
  const px = SIZES[size];
  const sources = useMemo(() => getItemSpriteSources(item), [item]);
  const [useCdn, setUseCdn] = useState(false);
  const [active, setActive] = useState(false);
  const { effect, loading } = useItemEffect(item, showEffect && active);

  useEffect(() => {
    setUseCdn(false);
  }, [item, sources?.local, sources?.cdn]);

  if (!sources) return null;

  const activeSrc = useCdn ? sources.cdn : sources.local;

  const iconEl = (
    <span
      className={
        variant === 'boxed'
          ? 'inline-flex shrink-0 items-center justify-center overflow-hidden rounded border border-border/60 bg-surface/90 p-0.5 shadow-sm'
          : 'inline-flex shrink-0 items-center justify-center overflow-hidden'
      }
      style={{ width: px, height: px }}
    >
      <img
        src={activeSrc}
        alt={showLabel ? '' : item}
        title={showLabel || disableTitle ? undefined : item}
        width={px}
        height={px}
        className="h-full w-full object-contain"
        style={{
          imageRendering: isHighResItemTier(sources.tier) ? 'auto' : 'pixelated',
        }}
        draggable={false}
        onError={() => {
          if (!useCdn && sources.cdn !== sources.local) {
            setUseCdn(true);
          }
        }}
      />
    </span>
  );

  if (!showLabel) {
    return <span className={className}>{iconEl}</span>;
  }

  const pill = (
    <span className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-border/70 bg-surface-raised/95 py-1 pl-1 pr-2.5 shadow-sm backdrop-blur-sm">
      {iconEl}
      <span
        className={`truncate font-display text-sm font-semibold leading-tight text-foreground ${labelClassName}`}
        title={item}
      >
        {item}
      </span>
    </span>
  );

  if (!showEffect) {
    return <span className={className}>{pill}</span>;
  }

  const expanded = active;

  return (
    <span
      className={`group inline-flex flex-col items-end gap-1.5 ${className}`}
      tabIndex={0}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <div
        className={`grid w-56 max-w-[min(80vw,18rem)] transition-[grid-template-rows,opacity] duration-200 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden">
          <span
            role="tooltip"
            className="block rounded-xl border border-border/70 bg-surface-raised/95 px-2.5 py-2 text-xs leading-snug text-foreground/80 shadow-lg backdrop-blur-sm"
          >
            {loading
              ? 'Loading effect…'
              : effect ?? 'No effect description available.'}
          </span>
        </div>
      </div>
      {pill}
    </span>
  );
}
