import { TYPE_COLORS } from '../constants/type-colors';
import { getTeraTypeIconUrl, getTypeIconUrl } from '../data/type-icons';
import { Tooltip } from './Tooltip';

type Props = {
  type: string;
  variant?: 'default' | 'tera';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
  tooltipPlacement?: 'top' | 'bottom';
};

const SIZE_PX = { sm: 22, md: 32, lg: 40 } as const;

export function TypeBadge({
  type,
  variant = 'default',
  size = 'md',
  className = '',
  showTooltip = false,
  tooltipPlacement = 'bottom',
}: Props) {
  const iconUrl =
    variant === 'tera' ? (getTeraTypeIconUrl(type) ?? getTypeIconUrl(type)) : getTypeIconUrl(type);
  const px = SIZE_PX[size];
  const label = variant === 'tera' ? `Tera ${type}` : type;

  const badge =
    iconUrl != null ? (
      <span className="inline-flex shrink-0">
        <img
          src={iconUrl}
          alt={label}
          width={px}
          height={px}
          className={`block rounded-full shadow-sm ${className}`}
          loading="lazy"
          title={showTooltip ? undefined : label}
        />
      </span>
    ) : (
      <span
        className={`inline-flex shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm ${className} ${
          variant === 'tera' ? 'border border-accent bg-accent/20 text-foreground' : ''
        }`}
        style={variant === 'default' ? { background: TYPE_COLORS[type] ?? 'var(--color-muted)' } : undefined}
        title={showTooltip ? undefined : label}
      >
        {label}
      </span>
    );

  if (!showTooltip) return badge;

  return (
    <Tooltip label={label} placement={tooltipPlacement}>
      {badge}
    </Tooltip>
  );
}
