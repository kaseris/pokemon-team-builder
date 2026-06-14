import { useState, type ReactNode } from 'react';

type Props = {
  /** Text shown inside the floating bubble. */
  label: ReactNode;
  children: ReactNode;
  className?: string;
  placement?: 'top' | 'bottom';
};

const PLACEMENT_CLASS = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
} as const;

/**
 * On-brand replacement for the native `title` tooltip. The default OS tooltip
 * renders as a dark, low-contrast box that clashes with the gilded light theme
 * and is hard to read; this shows a crisp navy bubble with near-white text on
 * hover or keyboard focus.
 */
export function Tooltip({ label, children, className = '', placement = 'top' }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-accent/40 bg-foreground px-2.5 py-1.5 text-xs font-semibold tracking-wide text-surface-raised shadow-lg ${PLACEMENT_CLASS[placement]}`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
