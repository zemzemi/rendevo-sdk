import { vi, expect } from 'vitest';

/**
 * Mock Utilities
 * Provides utilities for mocking fetch responses
 */

// ============================================================================
// Fetch Mock Helpers
// ============================================================================

export interface MockFetchOptions {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
  delay?: number;
}

/**
 * Creates a successful mock fetch response
 */
export const createMockFetchResponse = <T>(
  data: T,
  options: MockFetchOptions = {},
) => {
  const responseData = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  // Always include Content-Type header for JSON responses
  const headers = {
    'content-type': 'application/json',
    ...options.headers,
  };

  return Promise.resolve({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    headers: new Headers(headers),
    json: async () => responseData,
  } as Response);
};

/**
 * Creates an error mock fetch response
 */
export const createMockFetchError = (
  statusCode: number,
  message: string,
  path = '/test',
  method = 'GET',
) => {
  const errorData = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
    path,
    method,
  };

  // Always include Content-Type header for JSON responses
  return Promise.resolve({
    ok: false,
    status: statusCode,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => errorData,
  } as Response);
};

// ============================================================================
// Setup Helpers
// ============================================================================

/**
 * Setup global fetch mock for tests
 */
export const setupFetchMock = () => {
  global.fetch = vi.fn();
  return global.fetch as ReturnType<typeof vi.fn>;
};

/**
 * Reset fetch mock between tests
 */
export const resetFetchMock = () => {
  if (global.fetch && 'mockReset' in global.fetch) {
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  }
};

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that fetch was called with correct parameters
 */
export const expectFetchCalledWith = (
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  },
) => {
  expect(global.fetch).toHaveBeenCalledWith(
    url,
    expect.objectContaining({
      method: options?.method ?? 'GET',
      ...(options?.body && {
        body: JSON.stringify(options.body),
      }),
      ...(options?.headers && {
        headers: expect.objectContaining(options.headers),
      }),
    }),
  );
};

/**
 * Assert that fetch was called with authorization header
 */
export const expectFetchCalledWithAuth = (token: string) => {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: `Bearer ${token}`,
      }),
    }),
  );
};

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generate unique email for tests
 */
export const generateUniqueEmail = (prefix = 'test') =>
  `${prefix}-${Date.now()}@example.com`;

/**
 * Generate random ID
 */
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
