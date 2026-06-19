import type { CustomerSession } from '@aranyam/shared-types';

import { useSessionStore } from '../store/session.store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

let refreshPromise: Promise<CustomerSession> | undefined;

async function parseError(response: Response) {
  const error = await response
    .json()
    .catch(() => ({ message: 'Request failed' }));
  return Array.isArray(error.message)
    ? error.message.join(', ')
    : error.message;
}

async function refreshCustomerSession(
  refreshToken: string,
): Promise<CustomerSession> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${baseUrl}/auth/customer/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await parseError(response));
        }

        return response.json() as Promise<CustomerSession>;
      })
      .finally(() => {
        refreshPromise = undefined;
      });
  }

  return refreshPromise;
}

async function request(path: string, init: RequestInit, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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
  const storedSession = useSessionStore.getState().session;
  const currentToken =
    token && storedSession ? storedSession.accessToken : token;
  let response = await request(path, init, currentToken);

  if (response.status === 401 && token && storedSession?.refreshToken) {
    try {
      const refreshedSession = await refreshCustomerSession(
        storedSession.refreshToken,
      );
      useSessionStore.getState().setSession(refreshedSession);
      response = await request(path, init, refreshedSession.accessToken);
    } catch {
      useSessionStore.getState().clear();
      throw new Error('Your session expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function downloadAuthenticated(path: string, token: string) {
  const storedSession = useSessionStore.getState().session;
  let response = await request(path, {}, storedSession?.accessToken || token);
  if (response.status === 401 && storedSession?.refreshToken) {
    const refreshed = await refreshCustomerSession(storedSession.refreshToken);
    useSessionStore.getState().setSession(refreshed);
    response = await request(path, {}, refreshed.accessToken);
  }
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
