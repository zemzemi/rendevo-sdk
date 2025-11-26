/**
 * Test Factories Index
 * Central export point for all test utilities
 */

// Common utilities
export {
  TEST_CONFIG,
  MOCK_TOKENS,
  createMockApiResponse,
  createMockApiErrorResponse,
} from './common.factory';

// User factories
export {
  createMockUser,
  createMockAdminUser,
  type UserFactoryOptions,
} from './user.factory';

// Auth factories
export {
  createMockAuthResponse,
  MOCK_CREDENTIALS,
  type AuthResponseFactoryOptions,
} from './auth.factory';

// Mock utilities
export {
  setupFetchMock,
  resetFetchMock,
  createMockFetchResponse,
  createMockFetchError,
  expectFetchCalledWith,
  expectFetchCalledWithAuth,
  generateUniqueEmail,
  generateId,
  waitFor,
  type MockFetchOptions,
} from './mocks';
