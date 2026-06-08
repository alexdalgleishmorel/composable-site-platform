import { useEffect, useState } from 'react';

/** Tracks the user's `prefers-reduced-motion` setting so motifs can hold still. */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const upd = () => setReduced(m.matches);
    upd();
    m.addEventListener('change', upd);
    return () => m.removeEventListener('change', upd);
  }, []);
  return reduced;
};
