// Export main client
export { RendevoClient } from './client';

// Export error class
export { RendevoAPIError } from './core/base-client';

// Export all types and enums (re-export from types/index)
export type {
  // Common types
  ApiResponse,
  ApiErrorResponse,
  ClientConfig,
  RequestOptions,
  
  // User types
  User,
  UpdateUserDto,

  // Auth types
  LoginDto,
  RegisterDto,
  AuthResponse,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './types';

export { Role } from './types';
