import React, { useState, createContext, useContext, type ReactNode } from 'react';

type Role =
  | 'CHW'
  | 'Health Center'
  | 'Local Clinic'
  | 'District Hospital'
  | 'Referral Hospital'
  | 'Admin'
  | 'RICH'
  | 'PFTH'
  | 'SFR'
  | null;

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  return (
    <AppContext.Provider value={{ role, setRole }}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
