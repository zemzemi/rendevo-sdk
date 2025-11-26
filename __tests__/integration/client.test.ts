import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RendevoClient } from '../../src/client';
import { RendevoAPIError } from '../../src/core/base-client';
import {
  setupFetchMock,
  resetFetchMock,
  createMockFetchResponse,
  createMockFetchError,
  expectFetchCalledWithAuth,
  TEST_CONFIG,
  MOCK_CREDENTIALS,
  createMockAuthResponse,
  createMockUser,
} from '../helpers';

describe('RendevoClient - Integration Tests', () => {
  let client: RendevoClient;
  let fetchMock: ReturnType<typeof setupFetchMock>;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    client = new RendevoClient(TEST_CONFIG);
  });

  afterEach(() => {
    resetFetchMock();
  });

  describe('client initialization', () => {
    it('should initialize with all API modules', () => {
      expect(client.auth).toBeDefined();
      expect(client.users).toBeDefined();
    });

    it('should initialize with correct configuration', () => {
      expect(client['auth']['baseURL']).toBe('http://localhost:3000/api');
      expect(client['users']['baseURL']).toBe('http://localhost:3000/api');
    });

    it('should share configuration across all APIs', () => {
      const customClient = new RendevoClient({
        baseURL: 'https://api.custom.com',
        timeout: 60000,
      });

      expect(customClient['auth']['baseURL']).toBe('https://api.custom.com');
      expect(customClient['users']['baseURL']).toBe('https://api.custom.com');
      expect(customClient['auth']['timeout']).toBe(60000);
      expect(customClient['users']['timeout']).toBe(60000);
    });
  });

  describe('token management across APIs', () => {
    it('should automatically set token on all APIs after login', async () => {
      const mockResponse = createMockAuthResponse();
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      await client.auth.login(MOCK_CREDENTIALS.valid);

      // Token should be set on all APIs
      expect(client.auth.getToken()).toBe('mock-jwt-token-abc123');
      expect(client.users.getToken()).toBe('mock-jwt-token-abc123');
      expect(client.getToken()).toBe('mock-jwt-token-abc123');
    });

    it('should automatically set token on all APIs after register', async () => {
      const mockResponse = createMockAuthResponse();
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      await client.auth.register({
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      });

      expect(client.auth.getToken()).toBe('mock-jwt-token-abc123');
      expect(client.users.getToken()).toBe('mock-jwt-token-abc123');
    });

    it('should clear token from all APIs on logout', async () => {
      const mockResponse = createMockAuthResponse();
      const logoutResponse = { message: 'Logged out successfully' };
      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(mockResponse))
        .mockResolvedValueOnce(createMockFetchResponse(logoutResponse));

      await client.auth.login(MOCK_CREDENTIALS.valid);
      expect(client.getToken()).toBeDefined();

      await client.auth.logout({ refreshToken: 'mock-refresh-token-def456' });

      expect(client.auth.getToken()).toBeUndefined();
      expect(client.users.getToken()).toBeUndefined();
      expect(client.getToken()).toBeUndefined();
    });

    it('should set token on all APIs using setToken method', () => {
      const token = 'manual-token-123';

      client.setToken(token);

      expect(client.auth.getToken()).toBe(token);
      expect(client.users.getToken()).toBe(token);
      expect(client.getToken()).toBe(token);
    });

    it('should clear token from all APIs using clearToken method', () => {
      client.setToken('some-token');
      expect(client.getToken()).toBeDefined();

      client.clearToken();

      expect(client.auth.getToken()).toBeUndefined();
      expect(client.users.getToken()).toBeUndefined();
      expect(client.getToken()).toBeUndefined();
    });

    it('should sync tokens when manually set on auth API', () => {
      client.auth.setToken('auth-set-token');

      // Should propagate to all APIs
      expect(client.auth.getToken()).toBe('auth-set-token');
      expect(client.users.getToken()).toBe('auth-set-token');
      expect(client.getToken()).toBe('auth-set-token');
    });

    it('should sync token clearing when cleared from auth API', () => {
      client.setToken('some-token');

      client.auth.clearToken();

      expect(client.auth.getToken()).toBeUndefined();
      expect(client.users.getToken()).toBeUndefined();
      expect(client.getToken()).toBeUndefined();
    });
  });

  describe('complete authentication flow', () => {
    it('should complete full login → access protected endpoint flow', async () => {
      const authResponse = createMockAuthResponse();
      const userResponse = createMockUser();

      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(authResponse))
        .mockResolvedValueOnce(createMockFetchResponse(userResponse));

      // 1. Login
      const loginResult = await client.auth.login(MOCK_CREDENTIALS.valid);
      expect(loginResult.access_token).toBe('mock-jwt-token-abc123');

      // 2. Access protected endpoint (token should be automatically included)
      const me = await client.users.getMe();
      expect(me).toEqual(userResponse);

      // Verify token was included in the second request
      expectFetchCalledWithAuth('mock-jwt-token-abc123');
    });

    it('should complete full register → access protected endpoint flow', async () => {
      const authResponse = createMockAuthResponse();
      const userResponse = createMockUser();

      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(authResponse))
        .mockResolvedValueOnce(createMockFetchResponse(userResponse));

      // 1. Register
      await client.auth.register({
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      });

      // 2. Access protected endpoint
      const me = await client.users.getMe();
      expect(me).toEqual(userResponse);
    });

    it('should fail to access protected endpoint without authentication', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users/me', 'GET'),
      );

      await expect(client.users.getMe()).rejects.toThrow(RendevoAPIError);
    });

    it('should re-authenticate after logout', async () => {
      const authResponse = createMockAuthResponse();
      const userResponse = createMockUser();

      // First login
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(authResponse));
      await client.auth.login(MOCK_CREDENTIALS.valid);

      // Logout
      const logoutResponse = { message: 'Logged out successfully' };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(logoutResponse));
      await client.auth.logout({ refreshToken: 'mock-refresh-token-def456' });
      expect(client.getToken()).toBeUndefined();

      // Try to access protected endpoint (should fail)
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(401, 'Unauthorized', '/users/me', 'GET'),
      );
      await expect(client.users.getMe()).rejects.toThrow(RendevoAPIError);

      // Login again
      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(authResponse))
        .mockResolvedValueOnce(createMockFetchResponse(userResponse));

      await client.auth.login(MOCK_CREDENTIALS.valid);

      // Now should work
      const me = await client.users.getMe();
      expect(me).toEqual(userResponse);
    });
  });

  describe('multi-API usage scenarios', () => {
    it('should handle parallel requests with shared token', async () => {
      const authResponse = createMockAuthResponse();
      const userResponse = createMockUser();
      const usersListResponse = [createMockUser(), createMockUser()];

      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(authResponse))
        .mockResolvedValueOnce(createMockFetchResponse(userResponse))
        .mockResolvedValueOnce(createMockFetchResponse(usersListResponse));

      await client.auth.login(MOCK_CREDENTIALS.valid);

      // Make parallel requests
      const [me, users] = await Promise.all([
        client.users.getMe(),
        client.users.getAll(),
      ]);

      expect(me).toEqual(userResponse);
      expect(users).toEqual(usersListResponse);
    });

    it('should maintain token consistency across sequential operations', async () => {
      const authResponse = createMockAuthResponse();
      const userResponse = createMockUser();
      const updatedUser = createMockUser({ firstName: 'Updated' });

      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(authResponse))
        .mockResolvedValueOnce(createMockFetchResponse(userResponse))
        .mockResolvedValueOnce(createMockFetchResponse(updatedUser))
        .mockResolvedValueOnce(createMockFetchResponse(updatedUser));

      // 1. Login
      await client.auth.login(MOCK_CREDENTIALS.valid);

      // 2. Get current user
      const me = await client.users.getMe();
      expect(me.firstName).toBe('John');

      // 3. Update user
      const updated = await client.users.update(me.id, {
        firstName: 'Updated',
      });
      expect(updated.firstName).toBe('Updated');

      // 4. Get user again to verify
      const meAfterUpdate = await client.users.getById(me.id);
      expect(meAfterUpdate.firstName).toBe('Updated');
    });
  });

  describe('error handling across APIs', () => {
    it('should handle authentication errors consistently', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          401,
          'Invalid credentials',
          '/auth/login',
          'POST',
        ),
      );

      try {
        await client.auth.login(MOCK_CREDENTIALS.invalid);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(RendevoAPIError);
        expect((error as RendevoAPIError).statusCode).toBe(401);
      }
    });

    it('should handle expired token errors', async () => {
      const authResponse = createMockAuthResponse();
      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(authResponse))
        .mockResolvedValueOnce(
          createMockFetchError(401, 'Token expired', '/users/me', 'GET'),
        );

      await client.auth.login(MOCK_CREDENTIALS.valid);

      try {
        await client.users.getMe();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(RendevoAPIError);
        expect((error as RendevoAPIError).message).toBe('Token expired');
      }
    });

    it('should handle server errors gracefully', async () => {
      const authResponse = createMockAuthResponse();
      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(authResponse))
        .mockResolvedValueOnce(
          createMockFetchError(
            500,
            'Internal Server Error',
            '/users/me',
            'GET',
          ),
        );

      await client.auth.login(MOCK_CREDENTIALS.valid);

      await expect(client.users.getMe()).rejects.toThrow(RendevoAPIError);
    });
  });

  describe('configuration flexibility', () => {
    it('should support custom base URL', () => {
      const customClient = new RendevoClient({
        baseURL: 'https://custom-api.example.com',
      });

      expect(customClient['auth']['baseURL']).toBe(
        'https://custom-api.example.com',
      );
    });

    it('should support custom timeout', () => {
      const customClient = new RendevoClient({
        baseURL: TEST_CONFIG.baseURL,
        timeout: 60000,
      });

      expect(customClient['auth']['timeout']).toBe(60000);
    });

    it('should support custom headers', () => {
      const customClient = new RendevoClient({
        baseURL: TEST_CONFIG.baseURL,
        headers: {
          'X-API-Version': 'v1',
          'X-Client-ID': 'web-app',
        },
      });

      expect(customClient['auth']['defaultHeaders']).toEqual({
        'Content-Type': 'application/json',
        'X-API-Version': 'v1',
        'X-Client-ID': 'web-app',
      });
    });
  });

  describe('real-world usage patterns', () => {
    it('should support typical application startup flow', async () => {
      // 1. Initialize client
      const appClient = new RendevoClient(TEST_CONFIG);

      // 2. Check if stored token exists (simulated)
      const storedToken = 'previously-stored-token';
      appClient.setToken(storedToken);

      // 3. Verify token by fetching current user
      const userResponse = createMockUser();
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(userResponse));

      const currentUser = await appClient.users.getMe();
      expect(currentUser).toEqual(userResponse);
    });

    it('should support token refresh scenario', async () => {
      const oldToken = 'old-token';
      const newAuthResponse = createMockAuthResponse({
        token: 'new-refreshed-token',
      });

      // Set old token
      client.setToken(oldToken);
      expect(client.getToken()).toBe(oldToken);

      // Re-login (simulating token refresh)
      fetchMock.mockResolvedValueOnce(
        createMockFetchResponse(newAuthResponse),
      );

      await client.auth.login(MOCK_CREDENTIALS.valid);

      // Token should be updated
      expect(client.getToken()).toBe('new-refreshed-token');
      expect(client.users.getToken()).toBe('new-refreshed-token');
    });

    it('should support logout and switch user scenario', async () => {
      const user1Auth = createMockAuthResponse({
        token: 'user1-token',
        refreshToken: 'user1-refresh-token',
        user: { email: 'user1@example.com' },
      });
      const user2Auth = createMockAuthResponse({
        token: 'user2-token',
        refreshToken: 'user2-refresh-token',
        user: { email: 'user2@example.com' },
      });

      // Login as user1
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(user1Auth));
      await client.auth.login({ email: 'user1@example.com', password: 'pass' });
      expect(client.getToken()).toBe('user1-token');

      // Logout
      const logoutResponse = { message: 'Logged out successfully' };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(logoutResponse));
      await client.auth.logout({ refreshToken: 'user1-refresh-token' });
      expect(client.getToken()).toBeUndefined();

      // Login as user2
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(user2Auth));
      await client.auth.login({ email: 'user2@example.com', password: 'pass' });
      expect(client.getToken()).toBe('user2-token');
    });
  });
});
