import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { LearnableMove } from '../types/moves';
import { MoveEffectPreview } from './MoveEffectPreview';

const GAP_PX = 8;

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  move: LearnableMove;
  effect: string | null;
};

/**
 * Renders the move effect in a body portal with fixed coordinates so it stays
 * above the picker (and other UI like held-item badges) regardless of ancestor
 * overflow or stacking contexts.
 */
export function FloatingMoveEffect({ anchorRef, move, effect }: Props) {
  const effectRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const effectHeight = effectRef.current?.offsetHeight ?? 0;

    setStyle({
      position: 'fixed',
      top: Math.max(8, anchorRect.top - effectHeight - GAP_PX),
      left: anchorRect.left,
      width: anchorRect.width,
      zIndex: 10000,
      visibility: 'visible',
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const anchor = anchorRef.current;
    const observer = anchor ? new ResizeObserver(updatePosition) : null;
    if (anchor && observer) observer.observe(anchor);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      observer?.disconnect();
    };
  }, [anchorRef, updatePosition, move.name, effect]);

  useLayoutEffect(() => {
    const el = effectRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updatePosition);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updatePosition]);

  return createPortal(
    <div ref={effectRef} style={style} aria-live="polite">
      <MoveEffectPreview move={move} effect={effect} floating />
    </div>,
    document.body,
  );
}
