const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('flowpilot_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers as Record<string, string>) };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem('flowpilot_token');
        localStorage.removeItem('flowpilot_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error ${response.status}`);
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Backend server is unreachable. Please ensure the server is running on port 5000.');
      }
      throw err;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

