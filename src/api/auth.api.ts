import { BaseClient } from '../core/base-client';
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  refreshTokenDto,
} from '../types/auth.types';

export class AuthAPI extends BaseClient {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const data = await this.post<AuthResponse>('/auth/login', credentials);
    this.setToken(data.access_token);
    return data;
  }

  async register(userData: RegisterDto): Promise<AuthResponse> {
    const data = await this.post<AuthResponse>('/auth/register', userData);
    this.setToken(data.access_token);
    this.setRefreshToken(data.refresh_token);
    return data;
  }

  async refresh(data: refreshTokenDto): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/refresh', data);
    this.setToken(response.access_token);
    this.setRefreshToken(response.refresh_token);
    return response;
  }

  async forgotPassword(
    data: ForgotPasswordDto,
  ): Promise<{ message: string; token?: string }> {
    return this.post<{ message: string; token?: string }>(
      '/auth/forgot-password',
      data,
    );
  }

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/reset-password', data);
  }

  async verifyEmail(data: VerifyEmailDto): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/verify-email', data);
  }

  async resendVerification(
    data: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      '/auth/resend-verification',
      data,
    );
  }

  async logout(data: refreshTokenDto): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/auth/logout', data);
    this.clearToken();
    this.clearRefreshToken();
    return response;
  }
}
