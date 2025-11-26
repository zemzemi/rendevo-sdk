import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UsersAPI } from '../../src/api/users.api';
import { RendevoAPIError } from '../../src/core/base-client';
import {
  setupFetchMock,
  resetFetchMock,
  createMockFetchResponse,
  createMockFetchError,
  expectFetchCalledWith,
  expectFetchCalledWithAuth,
  TEST_CONFIG,
  MOCK_TOKENS,
  createMockUser,
  createMockAdminUser,
} from '../helpers';

describe('UsersAPI', () => {
  let usersAPI: UsersAPI;
  let fetchMock: ReturnType<typeof setupFetchMock>;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    usersAPI = new UsersAPI(TEST_CONFIG);
  });

  afterEach(() => {
    resetFetchMock();
  });

  describe('getAll', () => {
    it('should get all users successfully (admin)', async () => {
      const mockUsers = [
        createMockUser({ id: '1' }),
        createMockUser({ id: '2', email: 'user2@example.com' }),
        createMockAdminUser({ id: '3' }),
      ];
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockUsers));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.getAll();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(3);
      expectFetchCalledWith('http://localhost:3000/api/users', {
        method: 'GET',
      });
      expectFetchCalledWithAuth(MOCK_TOKENS.valid);
    });

    it('should throw error when not authenticated', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users', 'GET'),
      );

      await expect(usersAPI.getAll()).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error when user is not admin', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          403,
          'Forbidden - Admin access required',
          '/users',
          'GET',
        ),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.getAll()).rejects.toThrow(RendevoAPIError);
    });

    it('should return empty array when no users exist', async () => {
      fetchMock.mockResolvedValueOnce(createMockFetchResponse([]));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should get user by ID successfully', async () => {
      const mockUser = createMockUser({ id: '123' });
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockUser));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.getById('123');

      expect(result).toEqual(mockUser);
      expect(result.id).toBe('123');
      expectFetchCalledWith('http://localhost:3000/api/users/123', {
        method: 'GET',
      });
    });

    it('should throw error when user not found', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(404, 'User not found', '/users/999', 'GET'),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.getById('999')).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error when not authenticated', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users/123', 'GET'),
      );

      await expect(usersAPI.getById('123')).rejects.toThrow(RendevoAPIError);
    });

    it('should handle invalid ID format', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(400, 'Invalid ID format', '/users/invalid', 'GET'),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.getById('invalid')).rejects.toThrow(
        RendevoAPIError,
      );
    });
  });

  describe('getMe', () => {
    it('should get current user successfully', async () => {
      const mockUser = createMockUser();
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockUser));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.getMe();

      expect(result).toEqual(mockUser);
      expectFetchCalledWith('http://localhost:3000/api/users/me', {
        method: 'GET',
      });
      expectFetchCalledWithAuth(MOCK_TOKENS.valid);
    });

    it('should throw error when not authenticated', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users/me', 'GET'),
      );

      await expect(usersAPI.getMe()).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error on invalid token', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Invalid token', '/users/me', 'GET'),
      );

      usersAPI.setToken(MOCK_TOKENS.invalid);
      await expect(usersAPI.getMe()).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error on expired token', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Token expired', '/users/me', 'GET'),
      );

      usersAPI.setToken(MOCK_TOKENS.expired);
      await expect(usersAPI.getMe()).rejects.toThrow(RendevoAPIError);
    });
  });

  describe('update', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should update user successfully', async () => {
      const updatedUser = createMockUser({
        id: '123',
        ...updateData,
      });
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(updatedUser));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.update('123', updateData);

      expect(result).toEqual(updatedUser);
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expectFetchCalledWith('http://localhost:3000/api/users/123', {
        method: 'PATCH',
        body: updateData,
      });
    });

    it('should update partial user data', async () => {
      const updatedUser = createMockUser({
        id: '123',
        firstName: 'Updated',
      });
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(updatedUser));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.update('123', { firstName: 'Updated' });

      expect(result.firstName).toBe('Updated');
    });

    it('should throw error when user not found', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(404, 'User not found', '/users/999', 'PATCH'),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.update('999', updateData)).rejects.toThrow(
        RendevoAPIError,
      );
    });

    it('should throw error when not authenticated', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users/123', 'PATCH'),
      );

      await expect(usersAPI.update('123', updateData)).rejects.toThrow(
        RendevoAPIError,
      );
    });

    it('should throw error on invalid email format', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Invalid email format',
          '/users/123',
          'PATCH',
        ),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(
        usersAPI.update('123', { email: 'invalid-email' }),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error when email already exists', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          409,
          'Email already exists',
          '/users/123',
          'PATCH',
        ),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(
        usersAPI.update('123', { email: 'existing@example.com' }),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error when updating without permission', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          403,
          'Cannot update other users',
          '/users/456',
          'PATCH',
        ),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.update('456', updateData)).rejects.toThrow(
        RendevoAPIError,
      );
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(null));

      usersAPI.setToken(MOCK_TOKENS.valid);
      await usersAPI.remove('123');

      expectFetchCalledWith('http://localhost:3000/api/users/123', {
        method: 'DELETE',
      });
    });

    it('should not return data on successful deletion', async () => {
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(null));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.remove('123');

      expect(result).toBeUndefined();
    });

    it('should throw error when user not found', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(404, 'User not found', '/users/999', 'DELETE'),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.remove('999')).rejects.toThrow(
        RendevoAPIError,
      );
    });

    it('should throw error when not authenticated', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users/123', 'DELETE'),
      );

      await expect(usersAPI.remove('123')).rejects.toThrow(
        RendevoAPIError,
      );
    });

    it('should throw error when deleting without permission (non-admin)', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          403,
          'Admin access required',
          '/users/123',
          'DELETE',
        ),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.remove('123')).rejects.toThrow(
        RendevoAPIError,
      );
    });

    it('should throw error when trying to delete self', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Cannot delete your own account',
          '/users/123',
          'DELETE',
        ),
      );

      usersAPI.setToken(MOCK_TOKENS.valid);
      await expect(usersAPI.remove('123')).rejects.toThrow(
        RendevoAPIError,
      );
    });
  });

  describe('authorization and permissions', () => {
    it('should include token in all requests when set', async () => {
      const mockUser = createMockUser();
      fetchMock.mockResolvedValue(createMockFetchResponse(mockUser));

      usersAPI.setToken(MOCK_TOKENS.valid);

      await usersAPI.getMe();
      expectFetchCalledWithAuth(MOCK_TOKENS.valid);

      await usersAPI.getById('123');
      expectFetchCalledWithAuth(MOCK_TOKENS.valid);
    });

    it('should not include token when not set', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users/me', 'GET'),
      );

      await expect(usersAPI.getMe()).rejects.toThrow(RendevoAPIError);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty update data', async () => {
      const mockUser = createMockUser({ id: '123' });
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockUser));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.update('123', {});

      expect(result).toEqual(mockUser);
    });

    it('should handle special characters in user data', async () => {
      const specialUser = createMockUser({
        firstName: "O'Brien",
        lastName: 'Müller-Schmidt',
        email: 'test+tag@example.com',
      });
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(specialUser));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.getMe();

      expect(result.firstName).toBe("O'Brien");
      expect(result.lastName).toBe('Müller-Schmidt');
    });

    it('should handle very long user IDs', async () => {
      const longId = 'a'.repeat(100);
      const mockUser = createMockUser({ id: longId });
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockUser));

      usersAPI.setToken(MOCK_TOKENS.valid);
      const result = await usersAPI.getById(longId);

      expect(result.id).toBe(longId);
    });
  });
});
