import type { ApiResponse } from '../../types';
import { useStore } from '../../store/useStore';

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
      // Get current user email from store for demo mode authentication
      const currentUser = useStore.getState().currentUser;
      const demoEmail = currentUser?.email || 'demo@example.com';

      // Add cache-busting parameter for GET requests to prevent stale data
      const cacheBuster = method === 'GET' ? `&_t=${Date.now()}` : '';
      const url = `${this.baseUrl}?action=${action}&demoEmail=${encodeURIComponent(demoEmail)}${cacheBuster}`;
      const options: RequestInit = {
        method,
        headers: {
          // Use text/plain to avoid CORS preflight OPTIONS request
          // Apps Script will still parse this as JSON on the backend
          'Content-Type': 'text/plain;charset=utf-8',
        },
        signal: controller.signal,
      };

      if (method === 'POST') {
        // Merge demoEmail into the body payload for demo mode
        const payload = body ? { ...body as object, demoEmail } : { demoEmail };
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`API Error: ${method} ${action}`, {
          status: response.status,
          statusText: response.statusText,
          url,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();

      // Log API errors for debugging
      if (!data.success) {
        console.error(`API Response Error: ${method} ${action}`, {
          error: data.error,
          code: data.code,
          url,
        });
      }

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
