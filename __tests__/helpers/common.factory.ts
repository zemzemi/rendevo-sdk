// ============================================================================
// API Response Factory
// ============================================================================

export const createMockApiResponse = <T>(data: T) => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

export const createMockApiErrorResponse = (
  statusCode: number,
  message: string,
  path = '/test',
  method = 'GET',
) => ({
  success: false,
  statusCode,
  message,
  timestamp: new Date().toISOString(),
  path,
  method,
});

// ============================================================================
// Common Test Constants
// ============================================================================

export const TEST_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
} as const;

export const MOCK_TOKENS = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-token',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired-token',
  invalid: 'invalid-token-format',
} as const;