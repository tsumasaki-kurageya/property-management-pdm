import { useEffect, useState } from 'react';

function readMediaQuery(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => readMediaQuery(query));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function useExplorerMediaPreferences() {
  return {
    coarsePointer: useMediaQuery('(pointer: coarse)'),
    reducedMotion: useMediaQuery('(prefers-reduced-motion: reduce)'),
  };
}
