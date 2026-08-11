import { useRef, useCallback } from 'react';

/**
 * useSwipe — a drag-gesture hook for swipe card interactions.
 * Returns handlers and refs for manual drag tracking (non-Framer Motion usage).
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeDown, threshold = 150 }) {
  const startX = useRef(null);
  const startY = useRef(null);
  const isDragging = useRef(false);

  const onPointerDown = useCallback((e) => {
    startX.current = e.clientX ?? e.touches?.[0]?.clientX;
    startY.current = e.clientY ?? e.touches?.[0]?.clientY;
    isDragging.current = true;
  }, []);

  const onPointerUp = useCallback((e) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX;
    const endY = e.clientY ?? e.changedTouches?.[0]?.clientY;
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold) {
        onSwipeRight?.();
      } else if (deltaX < -threshold) {
        onSwipeLeft?.();
      }
    } else if (deltaY > threshold) {
      onSwipeDown?.();
    }

    startX.current = null;
    startY.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, threshold]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    // Optionally track move for visual feedback
  }, []);

  return {
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerMove,
      onTouchStart: onPointerDown,
      onTouchEnd: onPointerUp,
    },
  };
}

export default useSwipe;
