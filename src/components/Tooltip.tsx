import { useState, type ReactNode } from 'react';

type Props = {
  /** Text shown inside the floating bubble. */
  label: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * On-brand replacement for the native `title` tooltip. The default OS tooltip
 * renders as a dark, low-contrast box that clashes with the gilded light theme
 * and is hard to read; this shows a crisp navy bubble with near-white text on
 * hover or keyboard focus.
 */
export function Tooltip({ label, children, className = '' }: Props) {
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
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-accent/40 bg-foreground px-2.5 py-1.5 text-xs font-semibold tracking-wide text-surface-raised shadow-lg"
        >
          {label}
        </span>
      )}
    </span>
  );
}
