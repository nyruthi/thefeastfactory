const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!response.ok) { const error = await response.json().catch(() => ({ message: 'Request failed' })); throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
