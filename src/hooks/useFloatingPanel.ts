import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { OverlayPlacement } from './useOverlayPlacement';

const GAP_PX = 4;
export const FLOATING_PANEL_Z_INDEX = 9999;

export function useFloatingPanel(
  getAnchor: () => HTMLElement | null,
  placement: OverlayPlacement,
  enabled: boolean,
) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  const updatePosition = useCallback(() => {
    const anchor = getAnchor();
    if (!anchor || !enabled) return;

    const anchorRect = anchor.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    const maxHeight = Math.min(window.innerHeight * 0.72, 416);

    let top =
      placement === 'above'
        ? anchorRect.top - panelHeight - GAP_PX
        : anchorRect.bottom + GAP_PX;

    top = Math.max(8, Math.min(top, window.innerHeight - maxHeight - 8));

    setStyle({
      position: 'fixed',
      top,
      left: anchorRect.left,
      width: anchorRect.width,
      maxHeight,
      zIndex: FLOATING_PANEL_Z_INDEX,
      visibility: 'visible',
    });
  }, [getAnchor, enabled, placement]);

  useLayoutEffect(() => {
    if (!enabled) {
      setStyle({ visibility: 'hidden' });
      return;
    }

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const anchor = getAnchor();
    const anchorObserver = anchor ? new ResizeObserver(updatePosition) : null;
    if (anchor && anchorObserver) anchorObserver.observe(anchor);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      anchorObserver?.disconnect();
    };
  }, [getAnchor, enabled, placement, updatePosition]);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el || !enabled) return;

    const observer = new ResizeObserver(updatePosition);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, updatePosition]);

  return { panelRef, style };
}
