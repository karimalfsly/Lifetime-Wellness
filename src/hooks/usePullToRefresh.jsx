import { useState, useEffect, useRef } from 'react';

export default function usePullToRefresh(onRefresh) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startYRef = useRef(null);
  const THRESHOLD = 70;

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && window.scrollY === 0) {
        setPullY(Math.min(delta, THRESHOLD * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (pullY >= THRESHOLD) {
        setIsPulling(true);
        await onRefresh();
        setIsPulling(false);
      }
      startYRef.current = null;
      setPullY(0);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullY, onRefresh]);

  return { isPulling, pullY, THRESHOLD };
}
