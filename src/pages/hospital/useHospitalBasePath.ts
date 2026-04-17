import { useLocation } from 'react-router-dom';

/** Base path for district vs referral hospital vs surveillance partner routes. */
export function useHospitalBasePath():
  | '/hospital'
  | '/referral-hospital'
  | '/rich'
  | '/pfth'
  | '/sfr' {
  const { pathname } = useLocation();
  if (pathname.startsWith('/pfth')) return '/pfth';
  if (pathname.startsWith('/sfr')) return '/sfr';
  if (pathname.startsWith('/rich')) return '/rich';
  return pathname.startsWith('/referral-hospital')
    ? '/referral-hospital'
    : '/hospital';
}
