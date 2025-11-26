# @rendevo/sdk

TypeScript SDK for Rendevo API.

## Installation

```bash
npm install @rendevo/sdk
```

## Quick Start

```typescript
import { RendevoClient } from '@rendevo/sdk';

const client = new RendevoClient({
  baseURL: 'http://localhost:3000/api',
});

const { access_token, user } = await client.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

const me = await client.users.getMe();
```

## API Reference

### Authentication

```typescript
// Login
await client.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Register
await client.auth.register({
  email: 'newuser@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
});

// Forgot Password
await client.auth.forgotPassword({
  email: 'user@example.com',
});

// Reset Password
await client.auth.resetPassword({
  token: 'reset-token',
  newPassword: 'newpassword123',
});

// Verify Email
await client.auth.verifyEmail({
  token: 'verification-token',
});

// Resend Verification Email
await client.auth.resendVerification({
  email: 'user@example.com',
});

// Logout
await client.auth.logout({ refreshToken });
```

### Users

```typescript
// Get all users (Admin only)
const users = await client.users.getAll();

// Get user by ID
const user = await client.users.getById('user-id');

// Get current user
const me = await client.users.getMe();

// Update user
const updatedUser = await client.users.update('user-id', {
  firstName: 'Jane',
  lastName: 'Smith',
});

// Delete user
await client.users.remove('user-id');
```

## Token Management

```typescript
// Set token manually
client.setToken('your-jwt-token');

// Get current token
const token = client.getToken();

// Clear token
client.clearToken();
```

## Error Handling

```typescript
import { RendevoAPIError } from '@rendevo/sdk';

try {
  await client.auth.login({ email, password });
} catch (error) {
  if (error instanceof RendevoAPIError) {
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Error:', error.response.error);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript

```typescript
import type { User, AuthResponse } from '@rendevo/sdk';

const response: AuthResponse = await client.auth.login({ email, password });
const user: User = response.user;
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
