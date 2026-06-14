import type { ButtonHTMLAttributes } from 'react';
import { focusRingClass } from '../hooks/useListKeyboardNavigation';

type Size = 'sm' | 'md';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: Size;
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
};

const iconSize: Record<Size, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
};

// Uniform round red close / clear / remove button used across every selector and slot.
export function CloseButton({ size = 'md', className = '', ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-danger bg-surface-raised text-danger shadow-sm transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed ${sizeClasses[size]} ${focusRingClass} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        className={iconSize[size]}
        aria-hidden="true"
      >
        <line x1="5" y1="5" x2="19" y2="19" />
        <line x1="19" y1="5" x2="5" y2="19" />
      </svg>
    </button>
  );
}
