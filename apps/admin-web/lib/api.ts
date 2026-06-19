import type { AdminSession } from '@aranyam/shared-types';
import { useAdminSessionStore } from '../store/session.store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
let refreshPromise: Promise<AdminSession> | undefined;

async function parseError(response: Response) {
  const error = await response
    .json()
    .catch(() => ({ message: 'Request failed' }));
  return Array.isArray(error.message)
    ? error.message.join(', ')
    : error.message;
}

async function refreshSession(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = fetch(`${baseUrl}/auth/admin/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await parseError(response));
        return response.json() as Promise<AdminSession>;
      })
      .finally(() => {
        refreshPromise = undefined;
      });
  }
  return refreshPromise;
}

async function request(path: string, init: RequestInit, token?: string) {
  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const stored = useAdminSessionStore.getState().session;
  let response = await request(
    path,
    init,
    token && stored ? stored.accessToken : token,
  );
  if (response.status === 401 && token && stored?.refreshToken) {
    try {
      const refreshed = await refreshSession(stored.refreshToken);
      useAdminSessionStore.getState().setSession(refreshed);
      response = await request(path, init, refreshed.accessToken);
    } catch {
      useAdminSessionStore.getState().clear();
      throw new Error('Your admin session expired. Please sign in again.');
    }
  }
  if (!response.ok) throw new Error(await parseError(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function downloadAuthenticated(path: string, token: string) {
  const response = await request(path, {}, token);
  if (!response.ok) throw new Error(await parseError(response));
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const filename =
    disposition.match(/filename="([^"]+)"/)?.[1] || 'document.pdf';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { baseUrl as apiBaseUrl };
