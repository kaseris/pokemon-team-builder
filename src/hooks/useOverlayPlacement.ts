import { useEffect, useState } from 'react';

export type OverlayPlacement = 'below' | 'above';

const VIEWPORT_PADDING = 16;

/**
 * Chooses whether a popover should open above or below its anchor based on
 * remaining viewport space. Re-measures on resize and scroll.
 */
export function useOverlayPlacement(
  getAnchor: () => HTMLElement | null,
  enabled: boolean,
  estimatedHeight = 420,
): OverlayPlacement {
  const [placement, setPlacement] = useState<OverlayPlacement>('below');

  useEffect(() => {
    if (!enabled) {
      setPlacement('below');
      return;
    }

    const measure = () => {
      const anchor = getAnchor();
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
      const spaceAbove = rect.top - VIEWPORT_PADDING;
      const needed = estimatedHeight;

      if (spaceBelow < needed && spaceAbove >= spaceBelow) {
        setPlacement('above');
      } else {
        setPlacement('below');
      }
    };

    measure();

    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [getAnchor, enabled, estimatedHeight]);

  return placement;
}
