import { RendevoClient, RendevoAPIError } from '../src';

/**
 * Token refresh example
 */
async function main() {
  const client = new RendevoClient({
    baseURL: 'http://localhost:3000/api',
  });

  try {
    console.log('Token Refresh Example\n');
    
    console.log('1. Login...');
    const loginResponse = await client.auth.login({
      email: 'user@example.com',
      password: 'password123',
    });

    console.log('Logged in:', loginResponse.user.email, '\n');

    const refreshToken = loginResponse.refresh_token;

    console.log('2. Make API call...');
    const user = await client.users.getMe();
    console.log('User:', user.firstName, user.lastName, '\n');

    console.log('3. Refresh token...');
    const refreshResponse = await client.auth.refresh({ refreshToken });
    console.log('Token refreshed:', refreshResponse.user.email, '\n');

  } catch (error) {
    if (error instanceof RendevoAPIError) {
      console.error('API Error:', error.statusCode, error.message);
    } else if (error instanceof Error) {
      console.error('Error:', error.message);
    }
  }
}

main();
