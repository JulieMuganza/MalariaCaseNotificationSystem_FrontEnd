/**
 * Backend base URL.
 * - Dev: leave unset to use same-origin `/api` via Vite proxy (see vite.config.ts).
 * - Prod: set `VITE_API_URL` to your API origin, e.g. https://api.example.com
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export type ApiErrorBody = { error?: { message?: string; details?: unknown } };

/** Thrown by `apiFetch` on non-OK responses (except 401 which also clears session). */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function setStoredTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearStoredTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!headers.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const t = getStoredAccessToken();
    if (t) headers.set('Authorization', `Bearer ${t}`);
  }
  const res = await fetch(`${BASE}${path}`, { ...rest, headers });
  if (res.status === 204) {
    return null as T;
  }
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = json as ApiErrorBody;
    const message = err?.error?.message ?? res.statusText ?? 'Request failed';
    if (res.status === 401) {
      clearStoredTokens();
      // Optionally trigger a reload to force AuthContext to reset
      window.location.href = '/login';
    }
    throw new ApiRequestError(message, res.status);
  }
  return json as T;
}
