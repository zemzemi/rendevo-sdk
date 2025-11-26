import type { AuthResponse } from '../../src/types';
import { createMockUser, type UserFactoryOptions } from './user.factory';

// ============================================================================
// Auth Response Factory
// ============================================================================

export interface AuthResponseFactoryOptions {
  token?: string;
  refreshToken?: string;
  user?: UserFactoryOptions;
}

export const createMockAuthResponse = (
  options: AuthResponseFactoryOptions = {},
): AuthResponse => ({
  access_token: options.token ?? 'mock-jwt-token-abc123',
  refresh_token: options.token ?? 'mock-refresh-token-def456',
  user: createMockUser(options.user),
});

// ============================================================================
// Auth Test Credentials
// ============================================================================

export const MOCK_CREDENTIALS = {
  valid: {
    email: 'user@example.com',
    password: 'Password123!',
  },
  invalid: {
    email: 'wrong@example.com',
    password: 'wrong-password',
  },
} as const;
