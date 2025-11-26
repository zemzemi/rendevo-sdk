import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthAPI } from '../../src/api/auth.api';
import { RendevoAPIError } from '../../src/core/base-client';
import {
  setupFetchMock,
  resetFetchMock,
  createMockFetchResponse,
  createMockFetchError,
  expectFetchCalledWith,
  TEST_CONFIG,
  MOCK_CREDENTIALS,
  createMockAuthResponse,
} from '../helpers';

describe('AuthAPI', () => {
  let authAPI: AuthAPI;
  let fetchMock: ReturnType<typeof setupFetchMock>;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    authAPI = new AuthAPI(TEST_CONFIG);
  });

  afterEach(() => {
    resetFetchMock();
  });

  describe('login', () => {
    it('should login successfully and set token', async () => {
      const mockResponse = createMockAuthResponse();
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await authAPI.login(MOCK_CREDENTIALS.valid);

      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe('mock-jwt-token-abc123');
      expect(result.user.email).toBe('test@example.com');
      expect(authAPI.getToken()).toBe('mock-jwt-token-abc123');

      expectFetchCalledWith('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: MOCK_CREDENTIALS.valid,
      });
    });

    it('should throw error on invalid credentials', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          401,
          'Invalid credentials',
          '/auth/login',
          'POST',
        ),
      );

      await expect(
        authAPI.login(MOCK_CREDENTIALS.invalid),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error on server error', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          500,
          'Internal Server Error',
          '/auth/login',
          'POST',
        ),
      );

      await expect(
        authAPI.login(MOCK_CREDENTIALS.valid),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should handle malformed email', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Invalid email format',
          '/auth/login',
          'POST',
        ),
      );

      await expect(
        authAPI.login({ email: 'invalid-email', password: 'password' }),
      ).rejects.toThrow(RendevoAPIError);
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register successfully and set token', async () => {
      const mockResponse = createMockAuthResponse({
        user: { email: registerData.email },
      });
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await authAPI.register(registerData);

      expect(result).toEqual(mockResponse);
      expect(result.user.email).toBe(registerData.email);
      expect(authAPI.getToken()).toBe('mock-jwt-token-abc123');

      expectFetchCalledWith('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: registerData,
      });
    });

    it('should throw error when email already exists', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          409,
          'Email already exists',
          '/auth/register',
          'POST',
        ),
      );

      await expect(authAPI.register(registerData)).rejects.toThrow(
        RendevoAPIError,
      );
    });

    it('should throw error on weak password', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Password too weak',
          '/auth/register',
          'POST',
        ),
      );

      await expect(
        authAPI.register({ ...registerData, password: '123' }),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error on missing required fields', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Missing required fields',
          '/auth/register',
          'POST',
        ),
      );

      await expect(
        authAPI.register({
          email: 'test@example.com',
          password: '',
          firstName: '',
          lastName: '',
        }),
      ).rejects.toThrow(RendevoAPIError);
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset successfully', async () => {
      const mockResponse = {
        message: 'Password reset email sent',
        token: 'reset-token-123',
      };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await authAPI.forgotPassword({
        email: 'test@example.com',
      });

      expect(result).toEqual(mockResponse);
      expectFetchCalledWith('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: { email: 'test@example.com' },
      });
    });

    it('should handle non-existent email gracefully', async () => {
      // Security: Don't reveal if email exists
      const mockResponse = { message: 'If email exists, reset link sent' };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await authAPI.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(result.message).toBeTruthy();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockResponse = { message: 'Password reset successful' };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await authAPI.resetPassword({
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      });

      expect(result).toEqual(mockResponse);
      expectFetchCalledWith('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: {
          token: 'valid-reset-token',
          newPassword: 'NewPassword123!',
        },
      });
    });

    it('should throw error on invalid or expired token', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Invalid or expired token',
          '/auth/reset-password',
          'POST',
        ),
      );

      await expect(
        authAPI.resetPassword({
          token: 'expired-token',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error on weak new password', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Password too weak',
          '/auth/reset-password',
          'POST',
        ),
      );

      await expect(
        authAPI.resetPassword({
          token: 'valid-token',
          newPassword: '123',
        }),
      ).rejects.toThrow(RendevoAPIError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockResponse = { message: 'Email verified successfully' };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await authAPI.verifyEmail({
        token: 'verification-token',
      });

      expect(result).toEqual(mockResponse);
      expectFetchCalledWith('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: { token: 'verification-token' },
      });
    });

    it('should throw error on invalid verification token', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Invalid verification token',
          '/auth/verify-email',
          'POST',
        ),
      );

      await expect(
        authAPI.verifyEmail({ token: 'invalid-token' }),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should throw error on expired verification token', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Verification token expired',
          '/auth/verify-email',
          'POST',
        ),
      );

      await expect(
        authAPI.verifyEmail({ token: 'expired-token' }),
      ).rejects.toThrow(RendevoAPIError);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      const mockResponse = { message: 'Verification email sent' };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await authAPI.resendVerification({
        email: 'test@example.com',
      });

      expect(result).toEqual(mockResponse);
      expectFetchCalledWith(
        'http://localhost:3000/api/auth/resend-verification',
        {
          method: 'POST',
          body: { email: 'test@example.com' },
        },
      );
    });

    it('should handle already verified email', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          400,
          'Email already verified',
          '/auth/resend-verification',
          'POST',
        ),
      );

      await expect(
        authAPI.resendVerification({ email: 'test@example.com' }),
      ).rejects.toThrow(RendevoAPIError);
    });

    it('should handle non-existent email', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockFetchError(
          404,
          'User not found',
          '/auth/resend-verification',
          'POST',
        ),
      );

      await expect(
        authAPI.resendVerification({ email: 'nonexistent@example.com' }),
      ).rejects.toThrow(RendevoAPIError);
    });
  });

  describe('logout', () => {
    it('should clear token on logout', async () => {
      const mockResponse = { message: 'Logged out successfully' };
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      authAPI.setToken('some-token');
      authAPI.setRefreshToken('some-refresh-token');
      expect(authAPI.getToken()).toBe('some-token');

      await authAPI.logout({ refreshToken: 'some-refresh-token' });

      expect(authAPI.getToken()).toBeUndefined();
      expect(authAPI.getRefreshToken()).toBeUndefined();
    });

    it('should NOT clear tokens if API call fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      authAPI.setToken('some-token');
      authAPI.setRefreshToken('some-refresh-token');

      // Should throw error and NOT clear tokens
      await expect(
        authAPI.logout({ refreshToken: 'some-refresh-token' })
      ).rejects.toThrow('Network error');

      // Tokens should still be present (strict mode)
      expect(authAPI.getToken()).toBe('some-token');
      expect(authAPI.getRefreshToken()).toBe('some-refresh-token');
    });

    it('should be safe to logout multiple times', async () => {
      const mockResponse = { message: 'Logged out successfully' };
      fetchMock.mockResolvedValue(createMockFetchResponse(mockResponse));

      authAPI.setToken('token');
      authAPI.setRefreshToken('refresh-token');

      await authAPI.logout({ refreshToken: 'refresh-token' });
      await authAPI.logout({ refreshToken: 'refresh-token' });
      await authAPI.logout({ refreshToken: 'refresh-token' });

      expect(authAPI.getToken()).toBeUndefined();
      expect(authAPI.getRefreshToken()).toBeUndefined();
    });
  });

  describe('token persistence', () => {
    it('should maintain token across multiple requests', async () => {
      const mockResponse = createMockAuthResponse();
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      await authAPI.login(MOCK_CREDENTIALS.valid);

      const token = authAPI.getToken();
      expect(token).toBe('mock-jwt-token-abc123');

      // Token should still be there after login
      expect(authAPI.getToken()).toBe(token);
    });

    it('should replace old token on new login', async () => {
      const firstResponse = createMockAuthResponse({ token: 'first-token' });
      const secondResponse = createMockAuthResponse({ token: 'second-token' });

      fetchMock
        .mockResolvedValueOnce(createMockFetchResponse(firstResponse))
        .mockResolvedValueOnce(createMockFetchResponse(secondResponse));

      await authAPI.login(MOCK_CREDENTIALS.valid);
      expect(authAPI.getToken()).toBe('first-token');

      await authAPI.login(MOCK_CREDENTIALS.valid);
      expect(authAPI.getToken()).toBe('second-token');
    });
  });
});
