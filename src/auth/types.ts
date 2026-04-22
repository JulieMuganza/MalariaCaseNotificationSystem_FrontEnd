export type AuthUserRole =
  | 'CHW'
  | 'Health Center'
  | 'Local Clinic'
  | 'District Hospital'
  | 'Referral Hospital'
  | 'Admin'
  | 'RICH'
  | 'PFTH'
  | 'SFR';

export type AuthUser = {
  id: string;
  name: string;
  role: AuthUserRole;
  district: string;
  status: string;
  lastActive: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  mustChangePassword: boolean;
};

export type AuthTokensResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
};
