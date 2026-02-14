import type { ApiResult } from 'shared-types';

export interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

/**
 * Base API client for making HTTP requests
 */
export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.headers['Authorization'];
  }

  async get<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return this.request<T>('PUT', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
    try {
      const url = `${this.baseUrl}${path}`;
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || response.statusText,
            details: data,
          },
        };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }
}

// Singleton instance for the agent service
let agentServiceClient: ApiClient | null = null;

export function getAgentServiceClient(): ApiClient {
  if (!agentServiceClient) {
    const baseUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';
    agentServiceClient = new ApiClient({ baseUrl });
  }
  return agentServiceClient;
}
