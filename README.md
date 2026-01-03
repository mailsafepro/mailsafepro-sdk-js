# MailSafePro JavaScript/TypeScript SDK

<div align="center">

![MailSafePro Logo](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=MailSafePro)

**Professional Email Validation API for Node.js and Browser**

[![npm version](https://img.shields.io/npm/v/mailsafepro-sdk.svg)](https://www.npmjs.com/package/mailsafepro-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/mailsafepro/sdk-js/workflows/CI/badge.svg)](https://github.com/mailsafepro/sdk-js/actions)
[![Coverage: 85%](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/mailsafepro/sdk-js)
[![npm downloads](https://img.shields.io/npm/dm/mailsafepro-sdk.svg)](https://www.npmjs.com/package/mailsafepro-sdk)

[Documentation](https://docs.mailsafepro.com) • [API Reference](https://api.mailsafepro.com/docs) • [Examples](./examples) • [Changelog](./CHANGELOG.md)

</div>

---

## 🚀 Features

- ✅ **Full TypeScript Support** - Complete type definitions and IntelliSense
- 🔐 **Dual Authentication** - API Key and JWT (OAuth2) support
- 🚦 **Smart Rate Limiting** - Client-side rate limiting prevents 429 errors
- 🔄 **Auto Retry Logic** - Exponential backoff for transient failures
- 📦 **Batch Processing** - Validate thousands of emails efficiently
- 🛡️ **Type-Safe Errors** - Comprehensive error handling with typed exceptions
- 📊 **Progress Tracking** - Real-time progress for batch operations
- 🔌 **Zero Config** - Works out of the box with sensible defaults
- 🌐 **Universal** - Runs in Node.js and modern browsers
- 📝 **Extensive Logging** - Built-in debugging and monitoring
- ⚡ **High Performance** - Optimized for speed and reliability
- 🎯 **Production Ready** - Battle-tested with 85%+ test coverage and 249 tests

---

## 📦 Installation

```bash
npm install mailsafepro-sdk
```

or
```bash
yarn add mailsafepro-sdk
```

or
```bash
pnpm add mailsafepro-sdk
```

**Requirements:**
- Node.js >= 16.0.0
- TypeScript >= 4.5 (for TypeScript users)

---

## 🏁 Quick Start

### API Key Authentication (Recommended)

```typescript
import { MailSafeProClient } from 'mailsafepro-sdk';

const client = new MailSafeProClient({
apiKey: 'your_api_key_here',
});

// Validate a single email
const result = await client.validateEmail({
email: 'user@example.com',
checkSmtp: true,
});

console.log(result.valid); // true/false
console.log(result.riskScore); // 0-100
console.log(result.provider); // 'gmail', 'outlook', etc.
```

### JWT Authentication

```typescript
const client = new MailSafeProClient({
baseURL: 'https://api.mailsafepro.com/v1',
});

// Login to get JWT tokens
await client.login('your-email@example.com', 'your-password');

// Now you can make authenticated requests
const result = await client.validateEmail({
email: 'test@example.com',
});

// Logout when done
await client.logout();
```

---


## 🎬 Real-World Examples

### Signup Form Validation

```typescript
async function validateSignupEmail(email: string) {
try {
const result = await client.validateEmail({
email,
checkSmtp: true
});
```

```typescript
if (!result.valid) {
  return { valid: false, message: 'Invalid email address' };
}

if (result.riskScore > 70) {
  return { valid: false, message: 'High-risk email detected' };
}

if (result.disposable) {
  return { valid: false, message: 'Disposable emails not allowed' };
}

return { valid: true };
} catch (error) {
console.error('Validation error:', error);
return { valid: false, message: 'Validation service unavailable' };
}
}
```

### Newsletter Cleanup

```typescript
async function cleanEmailList(emails: string[]) {
const results = await client.batchValidateEmails({
emails,
checkSmtp: true,
});

// Filter valid, low-risk emails
const cleanList = results.results
.filter(r => r.valid && r.riskScore < 50 && !r.disposable)
.map(r => r.email);

console.log(✅ Clean emails: ${cleanList.length}/${emails.length});
return cleanList;
}
```

### E-commerce Order Verification

```typescript
async function verifyOrderEmail(email: string) {
const result = await client.validateEmail({
email,
checkSmtp: true,
includeRawDns: true
});

// Accept only corporate/personal emails
if (result.disposable || result.roleAccount) {
throw new Error('Please use a personal email address');
}

// Require mailbox verification
if (!result.mailboxExists) {
throw new Error('Email address does not exist');
}

return result;
}
```

## 📖 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage Examples](#-usage-examples)
  - [Single Email Validation](#single-email-validation)
  - [Batch Validation](#batch-validation)
  - [File Upload](#file-upload-batch)
  - [Progress Tracking](#progress-tracking)
- [Error Handling](#-error-handling)
- [Rate Limiting](#-rate-limiting)
- [Advanced Features](#-advanced-features)
- [API Reference](#-api-reference)
- [TypeScript](#-typescript)
- [Contributing](#-contributing)
- [Support](#-support)

---

## ⚙️ Configuration

### Client Options

```typescript
const client = new MailSafeProClient({
// Required (one of these)
apiKey: 'your_api_key', // API Key authentication

// Optional
baseURL: 'https://api.mailsafepro.com/v1', // API base URL
timeout: 30000, // Request timeout (ms)
maxRetries: 3, // Max retry attempts
enableRetry: true, // Enable automatic retries
autoRefresh: true, // Auto-refresh JWT tokens

// Rate limiting
rateLimitConfig: {
maxRequestsPerSecond: 10, // Max requests per second
maxConcurrent: 5, // Max concurrent requests
},

// Logging
logger: {
level: 'INFO', // DEBUG, INFO, WARN, ERROR, NONE
prefix: '[MailSafePro]',
timestamp: true,
colors: true,
},
});
```

---

## 💡 Usage Examples

### Single Email Validation

```typescript
// Basic validation
const result = await client.validateEmail({
email: 'user@example.com',
});
```

```typescript
// With SMTP check
const result = await client.validateEmail({
email: 'user@example.com',
checkSmtp: true, // Verify mailbox exists
includeRawDns: true, // Include DNS records
});
```

```typescript
// Check result
if (result.valid && result.riskScore < 50) {
console.log('✅ Email is valid and safe');
console.log(Provider: ${result.provider});
console.log(Reputation: ${result.reputation}/100);
}
```

### Batch Validation

```typescript
const emails = [
'user1@example.com',
'user2@example.com',
'user3@example.com',
// ... up to 1000 emails
];

const results = await client.batchValidateEmails({
emails,
checkSmtp: true,
});

console.log(✅ Valid: ${results.validCount});
console.log(❌ Invalid: ${results.invalidCount});
console.log(⏱️ Processing time: ${results.processingTime}ms);

// Filter valid emails
const validEmails = results.results
.filter(r => r.valid && r.riskScore < 50)
.map(r => r.email);
```

### File Upload Batch

```typescript
import fs from 'fs';

// Upload CSV file
const fileBuffer = fs.readFileSync('emails.csv');

const job = await client.uploadFileBatch(fileBuffer, {
filename: 'emails.csv',
contentType: 'text/csv',
checkSmtp: true,
});

console.log(Job ID: ${job.jobId});
console.log(Status: ${job.status});

// Wait for completion with progress
const results = await client.waitForBatchCompletion(job.jobId, {
pollInterval: 2000,
onProgress: (status) => {
console.log(Progress: ${status.progress}%);
},
});

console.log('Batch completed!');
console.log(Valid: ${results.validCount});
console.log(Invalid: ${results.invalidCount});
```

### Progress Tracking

```typescript
// Validate with progress callback
const results = await client.validateEmailsWithRetry(emails, {
checkSmtp: true,
maxRetries: 3,
onProgress: (completed, total) => {
const percentage = (completed / total * 100).toFixed(1);
console.log(Progress: ${percentage}% (${completed}/${total}));
},
});
```

---

## 🚨 Error Handling

The SDK provides typed error classes for precise error handling:

```typescript
import {
RateLimitError,
AuthenticationError,
ValidationError,
QuotaExceededError,
NetworkError,
TimeoutError,
} from 'mailsafepro-sdk';

try {
await client.validateEmail({ email: 'test@example.com' });
} catch (error) {
if (error instanceof RateLimitError) {
console.error(Rate limited. Retry after: ${error.retryAfter}s);
console.log(Limit: ${error.limit}, Remaining: ${error.remaining});
console.log(Resets at: ${error.reset});
}
else if (error instanceof AuthenticationError) {
console.error('Authentication failed. Check your API key.');
}
else if (error instanceof ValidationError) {
console.error('Invalid input:', error.details);
}
else if (error instanceof QuotaExceededError) {
console.error(Quota exceeded: ${error.used}/${error.limit});
}
else if (error instanceof TimeoutError) {
console.error('Request timed out. Try again.');
}
else if (error instanceof NetworkError) {
console.error('Network error. Check your connection.');
}
}
```

### Error Properties

All errors extend `MailSafeProError` and include:

```typescript
error.message // Human-readable message
error.code // Machine-readable code
error.statusCode // HTTP status code (if applicable)
error.details // Additional error details
error.timestamp // ISO timestamp
```

---

## 🚦 Rate Limiting

### Client-Side Rate Limiting

Prevent 429 errors with built-in rate limiting:

```typescript
const client = new MailSafeProClient({
apiKey: 'your_api_key',
rateLimitConfig: {
maxRequestsPerSecond: 10, // 10 req/s
maxConcurrent: 5, // Max 5 concurrent
},
});

// SDK automatically queues and throttles requests
const promises = emails.map(email =>
client.validateEmail({ email })
);

// All requests respect rate limits
await Promise.all(promises);

// Check queue stats
const stats = client.getRateLimiterStats();
console.log(Queue size: ${stats.queueSize});
console.log(Pending: ${stats.pendingCount});
```

### Handle Server Rate Limits

```typescript
try {
await client.validateEmail({ email: 'test@example.com' });
} catch (error) {
if (error instanceof RateLimitError) {
// Wait and retry
await new Promise(resolve =>
setTimeout(resolve, error.retryAfter * 1000)
);

// Retry the request
const result = await client.validateEmail({ 
  email: 'test@example.com' 
});
}
}
```

---

## 🔥 Advanced Features

### Automatic Token Refresh

JWT tokens are automatically refreshed before expiration:

```typescript
await client.login('email@example.com', 'password');

// Token automatically refreshes 1 minute before expiration
// No manual refresh needed!

// Check session status
const session = client.getSession();
console.log(Expires at: ${session.expiresAt});
console.log(Is valid: ${client.isAuthenticated()});

// Manual refresh if needed
await client.refreshToken();
```

### Custom Retry Configuration

```typescript
import { RetryPolicy } from 'mailsafepro-sdk';

const retryPolicy = new RetryPolicy()
.withMaxRetries(5)
.withInitialDelay(1000)
.withMaxDelay(60000)
.withBackoffMultiplier(2)
.onRetry((attempt, error, delay) => {
console.log(Retry ${attempt} after ${delay}ms);
});

await retryPolicy.execute(async () => {
return client.validateEmail({ email: 'test@example.com' });
});
```

### Custom Logger

```typescript
import { ConsoleLogger } from 'mailsafepro-sdk';

// Built-in logger with options
const logger = new ConsoleLogger({
level: 'DEBUG',
prefix: '[MyApp]',
timestamp: true,
colors: true,
});

const client = new MailSafeProClient({
apiKey: 'your_api_key',
logger: logger,
});

// Or implement custom logger
class CustomLogger {
debug(message: string, ...args: any[]) { /* custom logic / }
info(message: string, ...args: any[]) { / custom logic / }
warn(message: string, ...args: any[]) { / custom logic / }
error(message: string, ...args: any[]) { / custom logic */ }
}

const client2 = new MailSafeProClient({
apiKey: 'your_api_key',
logger: new CustomLogger(),
});
```

### Input Validation

```typescript
import { validateEmail, validateEmails } from 'mailsafepro-sdk';

// Validate before sending
try {
validateEmail('user@example.com');
// Email is valid, proceed
} catch (error) {
console.error('Invalid email format');
}

// Batch validation
try {
validateEmails(['email1@example.com', 'email2@example.com']);
} catch (error) {
console.error('Invalid email in batch');
}
```

---

## ⚡ Performance

### Benchmarks

- **Single validation**: ~100-300ms
- **Batch validation (100 emails)**: ~2-5 seconds
- **Rate limiting**: 10 req/s (configurable)
- **Memory usage**: ~50MB base + 1MB per 1000 emails

### Optimization Tips

```typescript
// ✅ Good - Batch validation
const results = await client.batchValidateEmails({
emails: ['email1@test.com', 'email2@test.com'],
});

// ❌ Bad - Sequential validation
for (const email of emails) {
await client.validateEmail({ email }); // Slow!
}

// ✅ Good - Parallel with rate limiting
const client = new MailSafeProClient({
rateLimitConfig: { maxConcurrent: 5 }
});
await Promise.all(emails.map(email =>
client.validateEmail({ email })
));
```

---

## 📚 API Reference

### MailSafeProClient

#### Constructor

```typescript
new MailSafeProClient(options: MailSafeProClientOptions)
```

#### Authentication Methods

- `login(email, password): Promise<UserSession>`
- `register(email, password, name?): Promise<UserSession>`
- `logout(): Promise<void>`
- `refreshToken(): Promise<UserSession>`
- `getSession(): UserSession | null`
- `isAuthenticated(): boolean`
- `setApiKey(apiKey): void`
- `clearApiKey(): void`

#### Validation Methods

- `validateEmail(request): Promise<EmailValidationResponse>`
- `batchValidateEmails(request): Promise<BatchValidationResponse>`
- `uploadFileBatch(file, options?): Promise<BatchJobStatus>`
- `getBatchStatus(jobId): Promise<BatchJobStatus>`
- `getBatchResults(jobId): Promise<BatchValidationResponse>`
- `waitForBatchCompletion(jobId, options?): Promise<BatchValidationResponse>`
- `cancelBatch(jobId): Promise<void>`
- `validateEmailsWithRetry(emails, options?): Promise<EmailValidationResponse[]>`

#### Utility Methods

- `getRateLimiterStats(): object | null`
- `clearRateLimiter(): void`
- `setAutoRefresh(enabled): void`
- `getLogger(): Logger`
- `destroy(): void`

### Types

Full TypeScript definitions are included. Import types:

```typescript
import type {
EmailValidationRequest,
EmailValidationResponse,
BatchValidationRequest,
BatchValidationResponse,
UserSession,
MailSafeProClientOptions,
} from 'mailsafepro-sdk';
```

---

## 🎯 TypeScript

This SDK is written in TypeScript and includes complete type definitions:

```typescript
// Full IntelliSense support
const result: EmailValidationResponse = await client.validateEmail({
email: 'test@example.com',
checkSmtp: true,
});

// Type-safe error handling
if (result.valid) {
// result.valid is boolean
// result.riskScore is number
// result.provider is string | undefined
}

// Import types
import type {
EmailValidationRequest,
EmailValidationResponse,
BatchValidationResponse,
RateLimiterConfig,
Logger,
} from 'mailsafepro-sdk';
```

No additional `@types` packages required!

---

## 🧪 Testing

Run all tests
```bash
npm test
```

Watch mode
```bash
npm run test:watch
```

Coverage
```bash
npm run test:coverage
```

Unit tests only
```bash
npm run test:unit
```

Integration tests only
```bash
npm run test:integration
```

---

## 🗺️ Roadmap

- [x] TypeScript SDK with full type support
- [x] Batch validation with progress tracking
- [x] Rate limiting and retry logic
- [x] JWT authentication
- [ ] Webhook support for async validation
- [ ] React hooks library
- [ ] Vue.js plugin
- [ ] Real-time validation streaming
- [ ] Email list deduplication
- [ ] Advanced filtering and segmentation

Vote for features on [GitHub Discussions](https://github.com/mailsafepro/sdk-js/discussions)!


## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔧 Troubleshooting

### Common Issues

**"Authentication failed"**

```typescript
// Check your API key format
const apiKey = 'msp_live_xxxxxxxxxxxxxxxxxxxxx'; // Correct format
// msp_test_xxxxxxxxxxxxxxxxxxxxx for test mode
```

**"Rate limit exceeded"**

```typescript
// Enable client-side rate limiting
const client = new MailSafeProClient({
apiKey: 'your_key',
rateLimitConfig: {
maxRequestsPerSecond: 10,
},
});
```

**"Request timeout"**
```typescript
// Increase timeout for slow networks
const client = new MailSafeProClient({
apiKey: 'your_key',
timeout: 60000, // 60 seconds
});
```

**"Module not found" in Browser**
// Use CDN for browser

```html
<script src="https://unpkg.com/mailsafepro-sdk@latest/dist/browser.js"></script>
<script>
  const client = new MailSafePro.MailSafeProClient({
    apiKey: 'your_key'
  });
</script>
```

---

## 💬 Support

- 📧 Email: mailsafepro1@gmail.com
- 📖 Documentation: https://docs.mailsafepro.com
- 🐛 Issues: https://github.com/mailsafepro/sdk-js/issues
- 💬 Discussions: https://github.com/mailsafepro/sdk-js/discussions

---

## 🌟 Show Your Support

If you find this SDK helpful, please give it a ⭐️ on [GitHub](https://github.com/mailsafepro/sdk-js)!

---

## 📊 Stats

![npm bundle size](https://img.shields.io/bundlephobia/min/mailsafepro-sdk)
![npm](https://img.shields.io/npm/dt/mailsafepro-sdk)
![GitHub issues](https://img.shields.io/github/issues/mailsafepro/sdk-js)
![GitHub pull requests](https://img.shields.io/github/issues-pr/mailsafepro/sdk-js)

---

<div align="center">
  Made with ❤️ by the MailSafePro Team
</div>