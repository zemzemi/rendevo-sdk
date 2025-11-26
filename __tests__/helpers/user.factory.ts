/**
 * User Domain Test Factories
 */

import type { User, Role } from '../../src/types';

// ============================================================================
// User Factory
// ============================================================================

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  isActive?: boolean;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const createMockUser = (options: UserFactoryOptions = {}): User => ({
  id: options.id ?? '1',
  email: options.email ?? 'test@example.com',
  firstName: options.firstName ?? 'John',
  lastName: options.lastName ?? 'Doe',
  role: options.role ?? ('USER' as Role),
  isActive: options.isActive ?? true,
  emailVerifiedAt: options.emailVerifiedAt ?? null,
  createdAt: options.createdAt ?? '2025-01-01T00:00:00.000Z',
  updatedAt: options.updatedAt ?? '2025-01-01T00:00:00.000Z',
});

export const createMockAdminUser = (
  options: UserFactoryOptions = {},
): User => {
  return createMockUser({
    ...options,
    role: 'ADMIN' as Role,
    email: options.email ?? 'admin@example.com',
  });
};
