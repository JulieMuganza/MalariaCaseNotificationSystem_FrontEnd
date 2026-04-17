import type { AuthUserRole } from './types';

export function dashboardPathForRole(role: AuthUserRole): string {
  switch (role) {
    case 'CHW':
      return '/chw';
    case 'Health Center':
      return '/hc';
    case 'Local Clinic':
      return '/lc';
    case 'District Hospital':
      return '/hospital';
    case 'Referral Hospital':
      return '/referral-hospital';
    case 'Admin':
      return '/admin';
    case 'RICH':
      return '/rich';
    case 'PFTH':
      return '/pfth';
    case 'SFR':
      return '/sfr';
    default:
      return '/login';
  }
}
