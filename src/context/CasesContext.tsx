import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { MalariaCase } from '../types/domain';
import { useAuth } from './AuthContext';

export type CaseStats = {
  totalCases: number;
  deathsLogged: number;
  reportedToEIDSR: number;
  byStatus: Record<string, number>;
  /** Present for Admin / RICH */
  byDistrict?: Record<string, number>;
};

export type EnsureCaseLoadedResult =
  | { ok: true; case: MalariaCase }
  | {
      ok: false;
      reason: 'not_found' | 'forbidden' | 'error';
    };

type CasesContextValue = {
  cases: MalariaCase[];
  stats: CaseStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCaseByRef: (caseRef: string) => MalariaCase | undefined;
  /** GET /api/v1/cases/:caseRef and merge into `cases` (for deep links / notifications). */
  ensureCaseLoaded: (caseRef: string) => Promise<EnsureCaseLoadedResult>;
  /** PATCH /api/v1/cases/:caseRef — refreshes list on success */
  patchCase: (
    caseRef: string,
    body: Record<string, unknown>
  ) => Promise<MalariaCase>;
};

/** Fallback when `useCasesApi` runs outside `CasesProvider` (e.g. HMR glitch). */
const EMPTY_CASES: CasesContextValue = {
  cases: [],
  stats: null,
  loading: false,
  error: null,
  refresh: async () => {},
  getCaseByRef: () => undefined,
  ensureCaseLoaded: async () => ({ ok: false, reason: 'error' } as EnsureCaseLoadedResult),
  patchCase: async () => {
    throw new Error('CasesProvider not mounted');
  },
};

const CasesContext = createContext<CasesContextValue | null>(null);

export function CasesProvider({ children }: { children: ReactNode }) {
  const { user, ready, refreshNotifications, refreshMessageUnread } = useAuth();
  const [cases, setCases] = useState<MalariaCase[]>([]);
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCases([]);
      setStats(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const listRes = await apiFetch<{ data: { cases: MalariaCase[] } }>(
        '/api/v1/cases'
      );
      setCases(listRes.data.cases);
      try {
        const statsRes = await apiFetch<{ data: CaseStats }>(
          '/api/v1/cases/stats'
        );
        setStats(statsRes.data);
      } catch {
        setStats(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cases');
      setCases([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
    void refreshNotifications();
    void refreshMessageUnread();
  }, [user, refreshNotifications, refreshMessageUnread]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, user?.id, user?.district, refresh]);

  const getCaseByRef = useCallback(
    (caseRef: string) => cases.find((c) => c.id === caseRef),
    [cases]
  );

  const ensureCaseLoaded = useCallback(
    async (caseRef: string): Promise<EnsureCaseLoadedResult> => {
      if (!user) return { ok: false, reason: 'error' };
      try {
        const res = await apiFetch<{ data: { case: MalariaCase } }>(
          `/api/v1/cases/${encodeURIComponent(caseRef)}`
        );
        const kase = res.data.case;
        setCases((prev) => {
          if (prev.some((x) => x.id === kase.id)) {
            return prev.map((x) => (x.id === kase.id ? kase : x));
          }
          return [kase, ...prev];
        });
        return { ok: true, case: kase };
      } catch (e) {
        if (e instanceof ApiRequestError) {
          if (e.status === 403) return { ok: false, reason: 'forbidden' };
          if (e.status === 404) return { ok: false, reason: 'not_found' };
        }
        return { ok: false, reason: 'error' };
      }
    },
    [user]
  );

  const patchCase = useCallback(
    async (caseRef: string, body: Record<string, unknown>) => {
      const res = await apiFetch<{ data: { case: MalariaCase } }>(
        `/api/v1/cases/${encodeURIComponent(caseRef)}`,
        { method: 'PATCH', body: JSON.stringify(body) }
      );
      await refresh();
      return res.data.case;
    },
    [refresh]
  );

  const value: CasesContextValue = {
    cases,
    stats,
    loading,
    error,
    refresh,
    getCaseByRef,
    ensureCaseLoaded,
    patchCase,
  };

  return (
    <CasesContext.Provider value={value}>{children}</CasesContext.Provider>
  );
}

export function useCasesApi(): CasesContextValue {
  const ctx = useContext(CasesContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn(
        '[useCasesApi] No CasesProvider — using empty case list. Wrap the app with <CasesProvider> (see App.tsx).'
      );
    }
    return EMPTY_CASES;
  }
  return ctx;
}
