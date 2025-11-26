# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial release
- Authentication API (login, register, logout, password reset, email verification)
- Token refresh support (`auth.refresh()` method)
- Users API (CRUD operations)
- Automatic JWT token management with Registry Pattern
- Client methods: `setToken()`, `getToken()`, `setRefreshToken()`, `getRefreshToken()`
- TypeScript support with full type definitions
- Error handling with RendevoAPIError
- Automatic retry with exponential backoff (3 attempts)
- Zero runtime dependencies
