import { RendevoClient, RendevoAPIError } from '../src';

/**
 * Basic usage examples of the Rendevo SDK
 */
async function main() {
  const client = new RendevoClient({
    baseURL: 'http://localhost:3000/api',
  });

  try {
    console.log('Authentication Examples\n');

    // Login
    console.log('1. Login...');
    const { access_token, refresh_token, user } = await client.auth.login({
      email: 'user@example.com',
      password: 'password123',
    });
    console.log('Logged in as:', user.email, '\n');

    // Register (commented out to avoid duplicate registration)
    /*
    console.log('2. Register new user...');
    const newUser = await client.auth.register({
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });
    console.log('Registered:', newUser.user.email, '\n');
    */

    // Forgot Password
    console.log('3. Request password reset...');
    const forgotResult = await client.auth.forgotPassword({
      email: 'user@example.com',
    });
    console.log(forgotResult.message, '\n');

    // Resend Verification
    console.log('4. Resend verification email...');
    const resendResult = await client.auth.resendVerification({
      email: 'user@example.com',
    });
    console.log(resendResult.message, '\n');

    console.log('Users Examples\n');

    // Get current user
    console.log('5. Get current user...');
    const me = await client.users.getMe();
    console.log('Current user:', me.firstName, me.lastName, '\n');

    // Update current user
    console.log('6. Update user...');
    const updatedUser = await client.users.update(me.id, { firstName: 'Jane' });
    console.log('Updated user:', updatedUser.firstName, updatedUser.lastName, '\n');

    // Get all users (requires admin role)
    console.log('7. Get all users...');
    const users = await client.users.getAll();
    console.log('Found', users.length, 'users\n');

    console.log('Token Management\n');

    console.log('8. Token refresh...');
    const refreshed = await client.auth.refresh({ refreshToken: refresh_token });
    console.log('Token refreshed:', refreshed.user.email, '\n');

    console.log('9. Logout...');
    await client.auth.logout({ refreshToken: refresh_token });
    console.log('Logged out\n');

  } catch (error) {
    if (error instanceof RendevoAPIError) {
      console.error('API Error:', error.statusCode, error.message);
    } else if (error instanceof Error) {
      console.error('Error:', error.message);
    }
  }
}

main();
