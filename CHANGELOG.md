# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-03

### Added
- `validateTimeout()` - New validation function for timeout values
- `validateJobId()` - New validation function for batch job IDs
- `sanitizeEmailForLogging()` - Security function to mask emails in logs
- File size validation in `uploadFileBatch()` (max 10MB)
- Improved error messages with more context

### Changed
- Email addresses are now sanitized in all log outputs for privacy
- Replaced `any` types with `unknown` for better type safety
- Improved error handling with proper type guards
- Updated validation constants to use centralized values
- Enhanced test coverage from 74% to 75%+ branches

### Security
- Email addresses are now masked in logs (e.g., `jo****@example.com`)
- Added file size validation to prevent large file uploads
- Improved input validation for job IDs

### Fixed
- Type safety improvements throughout the codebase
- Better error message extraction from unknown error types

## [1.0.0] - 2025-11-19

### Added
- Initial release
- Email validation (single and batch)
- API Key and JWT authentication
- Automatic token refresh
- Client-side rate limiting
- Exponential backoff retry logic
- Comprehensive error handling with typed errors
- File upload for batch validation
- Batch job status tracking
- TypeScript support with full type definitions
- Extensive logging capabilities
- Request/response interceptors
- Input validation
- Complete test suite
- Documentation and examples

### Features
- ✅ Single email validation with SMTP check
- ✅ Batch email validation
- ✅ File upload batch processing
- ✅ Async batch job management
- ✅ Rate limiting (client-side)
- ✅ Automatic retry with exponential backoff
- ✅ JWT token auto-refresh
- ✅ API Key authentication
- ✅ Comprehensive error types
- ✅ Request logging and debugging
- ✅ TypeScript first-class support
- ✅ Zero dependencies (except axios)
- ✅ Browser and Node.js support

## [Unreleased]

### Planned
- Webhooks support for async validation
- Response caching
- Metrics and telemetry
- Browser-specific build
- React hooks
- CLI tool
