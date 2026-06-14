import { TYPE_COLORS } from '../constants/type-colors';
import { getTypeIconUrl } from '../data/type-icons';

type Props = {
  type: string;
  variant?: 'default' | 'tera';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_PX = { sm: 22, md: 32, lg: 40 } as const;

export function TypeBadge({ type, variant = 'default', size = 'md', className = '' }: Props) {
  const iconUrl = getTypeIconUrl(type);
  const px = SIZE_PX[size];
  const label = variant === 'tera' ? `Tera ${type}` : type;

  if (iconUrl) {
    return (
      <span
        className={`inline-flex shrink-0 ${
          variant === 'tera'
            ? 'rounded-full ring-2 ring-accent/70 ring-offset-1 ring-offset-surface-raised'
            : ''
        }`}
        title={label}
      >
        <img
          src={iconUrl}
          alt={label}
          width={px}
          height={px}
          className={`block rounded-full shadow-sm ${className}`}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm ${className} ${
        variant === 'tera' ? 'border border-accent bg-accent/20 text-foreground' : ''
      }`}
      style={variant === 'default' ? { background: TYPE_COLORS[type] ?? 'var(--color-muted)' } : undefined}
      title={label}
    >
      {label}
    </span>
  );
}
