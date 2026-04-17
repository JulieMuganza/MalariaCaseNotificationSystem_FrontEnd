/**
 * Backend origin for direct browser navigation (OAuth must hit the API host, not only Vite proxy).
 * - Local dev: optional `.env` → VITE_BACKEND_ORIGIN=http://localhost:3000 (or rely on dev fallback).
 * - Vercel / prod: set VITE_BACKEND_ORIGIN to your Render API URL (https://…).
 */
const viteBackend = (import.meta.env.VITE_BACKEND_ORIGIN as string | undefined)?.replace(
  /\/$/,
  ''
);
export const BACKEND_ORIGIN =
  viteBackend ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '');

export function backendAuthUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_ORIGIN}${p}`;
}
