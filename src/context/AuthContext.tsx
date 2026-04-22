import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, clearStoredTokens, getStoredAccessToken, setStoredTokens } from '../lib/api';
import type { AuthTokensResponse, AuthUser } from '../auth/types';
import type { Notification } from '../types/domain';
import { useApp } from './AppContext';

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  district: string;
  staffCode?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  notifications: Notification[];
  /** Unread system notifications (bell). */
  unreadCount: number;
  /** Unread chat messages across all threads (messages icon). */
  messageUnreadCount: number;
  login: (email: string, password: string) => Promise<AuthUser>;
  /** Self-service CHW registration — sends OTP; does not sign in until verify. */
  register: (input: RegisterInput) => Promise<{ message: string; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<AuthUser>;
  /** After admin invite: set a new password while signed in. */
  completePasswordSetup: (newPassword: string) => Promise<AuthUser>;
  /** Update display name; CHW may also update district (e.g. after transfer). */
  updateProfile: (body: { name?: string; district?: string; phone?: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  refreshNotifications: () => Promise<void>;
  refreshMessageUnread: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setRole } = useApp();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const res = await apiFetch<{ data: { notifications: Notification[] } }>(
        '/api/v1/notifications'
      );
      setNotifications(res.data.notifications);
    } catch {
      setNotifications([]);
    }
  }, []);

  const refreshMessageUnread = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setMessageUnreadCount(0);
      return;
    }
    try {
      const res = await apiFetch<{ data: { count: number } }>(
        '/api/v1/messages/unread-count'
      );
      setMessageUnreadCount(res.data.count);
    } catch {
      setMessageUnreadCount(0);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      setRole(null);
      return null;
    }
    const res = await apiFetch<{ data: { user: AuthUser } }>('/api/v1/auth/me');
    setUser(res.data.user);
    setRole(res.data.user.role);
    await refreshNotifications();
    await refreshMessageUnread();
    return res.data.user;
  }, [setRole, refreshNotifications, refreshMessageUnread]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getStoredAccessToken();
      if (!token) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        await refreshUser();
      } catch {
        clearStoredTokens();
        if (!cancelled) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setRole, refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<{ data: AuthTokensResponse }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });
      if (!res?.data) throw new Error('Login failed');
      setStoredTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      setRole(res.data.user.role);
      await refreshNotifications();
      await refreshMessageUnread();
      return res.data.user;
    },
    [setRole, refreshNotifications, refreshMessageUnread]
  );

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiFetch<{ data: { message: string; email: string } }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuth: true,
    });
    if (!res?.data?.email) throw new Error('Registration failed');
    return { message: res.data.message, email: res.data.email };
  }, []);

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      const res = await apiFetch<{ data: AuthTokensResponse }>('/api/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
        skipAuth: true,
      });
      if (!res?.data?.accessToken) throw new Error('Verification failed');
      setStoredTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      setRole(res.data.user.role);
      await refreshNotifications();
      await refreshMessageUnread();
      return res.data.user;
    },
    [setRole, refreshNotifications, refreshMessageUnread]
  );

  const completePasswordSetup = useCallback(async (newPassword: string) => {
    const res = await apiFetch<{ data: { user: AuthUser } }>('/api/v1/auth/complete-password-setup', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    if (!res?.data?.user) throw new Error('Update failed');
    setUser(res.data.user);
    setRole(res.data.user.role);
    await refreshMessageUnread();
    return res.data.user;
  }, [setRole, refreshMessageUnread]);

  const updateProfile = useCallback(
    async (body: { name?: string; district?: string; phone?: string }) => {
      const res = await apiFetch<{ data: { user: AuthUser } }>('/api/v1/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res?.data?.user) throw new Error('Update failed');
      setUser(res.data.user);
      setRole(res.data.user.role);
      await refreshNotifications();
      await refreshMessageUnread();
      return res.data.user;
    },
    [setRole, refreshNotifications, refreshMessageUnread]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    []
  );

  const markAllNotificationsRead = useCallback(async () => {
    await apiFetch<{ data: { count: number } }>('/api/v1/notifications/read-all', {
      method: 'PATCH',
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refreshToken');
    try {
      if (refresh) {
        await apiFetch('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refresh }),
        });
      }
    } catch {
      /* still clear locally */
    }
    clearStoredTokens();
    setUser(null);
    setRole(null);
    setNotifications([]);
    setMessageUnreadCount(0);
  }, [setRole]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return notifications.filter(
      (n) =>
        !n.read &&
        (user.role === 'Admin' || n.targetRole === user.role)
    ).length;
  }, [notifications, user]);

  const value: AuthContextValue = {
    user,
    ready,
    notifications,
    unreadCount,
    messageUnreadCount,
    login,
    register,
    verifyEmail,
    completePasswordSetup,
    updateProfile,
    logout,
    refreshUser,
    refreshNotifications,
    refreshMessageUnread,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
