import { useLocation } from 'react-router-dom';

export type SurveillanceBasePath = '/rich' | '/pfth' | '/sfr';

/** RICH (Southern/East/West), PFTH (Northern), SFR (Kigali City) — same UI shell. */
export function useSurveillanceBasePath(): SurveillanceBasePath {
  const { pathname } = useLocation();
  if (pathname.startsWith('/pfth')) return '/pfth';
  if (pathname.startsWith('/sfr')) return '/sfr';
  return '/rich';
}

/** i18n namespace: `rich`, `pfth`, or `sfr` (parallel keys under each). */
export function useSurveillanceI18nNs(): 'rich' | 'pfth' | 'sfr' {
  const base = useSurveillanceBasePath();
  if (base === '/pfth') return 'pfth';
  if (base === '/sfr') return 'sfr';
  return 'rich';
}

/** Map / dashboard case scope for the current surveillance route. */
export function useSurveillanceProvinceScope():
  | 'Southern Province'
  | 'Northern Province'
  | 'Kigali City' {
  const base = useSurveillanceBasePath();
  if (base === '/pfth') return 'Northern Province';
  if (base === '/sfr') return 'Kigali City';
  return 'Southern Province';
}

export function useSurveillancePartnerLabel(): 'RICH' | 'PFTH' | 'SFR' {
  const base = useSurveillanceBasePath();
  if (base === '/pfth') return 'PFTH';
  if (base === '/sfr') return 'SFR';
  return 'RICH';
}
