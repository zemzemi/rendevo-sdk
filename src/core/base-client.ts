import type {
  ClientConfig,
  RequestOptions,
  ApiResponse,
  ApiErrorResponse,
} from '../types/common';

export class RendevoAPIError extends Error {
  constructor(
    public statusCode: number,
    public response: ApiErrorResponse,
  ) {
    super(response.message);
    this.name = 'RendevoAPIError';
  }
}

/**
 * Base HTTP client with token management and error handling
 */
export class BaseClient {
  protected baseURL: string;
  protected timeout: number;
  protected defaultHeaders: Record<string, string>;
  protected token?: string;
  protected refreshToken?: string;

  constructor(config: ClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 10000; // 10 seconds default
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = undefined;
  }

  getToken(): string | undefined {
    return this.token;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  getRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  clearRefreshToken(): void {
    this.refreshToken = undefined;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof RendevoAPIError) {
      // Retry on server errors (5xx) but not client errors (4xx)
      return error.statusCode >= 500;
    }

    if (error instanceof Error) {
      // Retry on network errors but not on timeout or validation errors
      return (
        error.message.includes('Network error') ||
        error.message.includes('fetch failed') ||
        error.message.includes('ECONNREFUSED')
      );
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    // Disable retries in test environment for faster tests
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      process.env.VITEST === 'true' ||
      typeof (globalThis as any).vitest !== 'undefined';

    if (isTestEnv) {
      return await this.executeRequest<T>(endpoint, options);
    }

    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(endpoint, options);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries - 1 || !this.isRetryableError(error)) {
          throw error;
        }

        const delayMs = Math.pow(2, attempt) * 1000;
        await this.delay(delayMs);
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.timeout,
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(
          `Invalid response format: expected JSON but got ${contentType || 'unknown'}`,
        );
      }

      const data = await response.json();

      if (!response.ok) {
        if (
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          'statusCode' in data
        ) {
          throw new RendevoAPIError(response.status, data as ApiErrorResponse);
        }
        throw new RendevoAPIError(response.status, {
          success: false,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
          path: endpoint,
          method: options.method || 'GET',
          message: typeof data === 'string' ? data : 'An error occurred',
        });
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        'success' in data
      ) {
        return data as ApiResponse<T>;
      }

      return {
        success: true,
        data: data as T,
        timestamp: new Date().toISOString(),
      } as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof RendevoAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(
            `Request timeout: The request to ${endpoint} took longer than ${options.timeout || this.timeout}ms`,
          );
        }

        if (
          error.message.includes('CORS') ||
          error.message.includes('Network request failed')
        ) {
          throw new Error(
            `Network error: Unable to reach ${this.baseURL}. This may be due to CORS policy or network connectivity issues.`,
          );
        }

        throw error;
      }

      throw new Error('An unexpected error occurred');
    }
  }

  protected async get<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
    return response.data;
  }

  protected async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    return response.data;
  }

  protected async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    return response.data;
  }

  protected async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    return response.data;
  }

  protected async delete<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
    return response.data;
  }
}
