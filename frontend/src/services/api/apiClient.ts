import type { ApiResponse } from '../../types';

const API_BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

if (!API_BASE_URL) {
  console.warn('VITE_APPS_SCRIPT_URL not configured. API calls will fail.');
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(
    action: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}?action=${action}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        credentials: 'include', // Include cookies for session
      };

      if (method === 'POST' && body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
            code: 'TIMEOUT',
          };
        }
        return {
          success: false,
          error: error.message,
          code: 'NETWORK_ERROR',
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  async get<T>(action: string): Promise<ApiResponse<T>> {
    return this.request<T>(action, 'GET');
  }

  async post<T>(action: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(action, 'POST', body);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Health check
export async function checkApiHealth(): Promise<boolean> {
  const response = await apiClient.get('health');
  return response.success;
}
