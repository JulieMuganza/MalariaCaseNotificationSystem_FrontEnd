import { useLocation } from 'react-router-dom';

/** Health center (`/hc`) vs local clinic (`/lc`) — same UI, different base path. */
export function useFirstLineBasePath(): '/hc' | '/lc' {
  const { pathname } = useLocation();
  return pathname.startsWith('/lc') ? '/lc' : '/hc';
}
