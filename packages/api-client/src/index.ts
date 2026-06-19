export type ApiClientOptions = {
  baseUrl: string;
  accessToken?: string;
  onUnauthorized?: () => void;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: formData }, false);
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    json = true,
  ): Promise<T> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...(this.options.accessToken
          ? { Authorization: `Bearer ${this.options.accessToken}` }
          : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) this.options.onUnauthorized?.();
      const payload = await response
        .json()
        .catch(() => ({ message: `API request failed: ${response.status}` }));
      throw new Error(
        Array.isArray(payload.message)
          ? payload.message.join(', ')
          : payload.message,
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
