# Contributing to MailSafePro SDK

Thank you for your interest in contributing to the MailSafePro JavaScript/TypeScript SDK!

## Development Setup

1. **Fork and clone the repository**

git clone https://github.com/your-username/mailsafepro-sdk-js.git
cd mailsafepro-sdk-js

text

2. **Install dependencies**

npm install

text

3. **Run tests**

npm test

text

4. **Build the project**

npm run build

text

## Development Workflow

### Branch Naming

- `feature/your-feature-name` - New features
- `fix/your-bug-fix` - Bug fixes
- `docs/your-documentation-change` - Documentation updates
- `refactor/your-refactor` - Code refactoring
- `test/your-test` - Test additions or modifications

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

feat: add webhook support
fix: resolve rate limiting issue
docs: update README examples
test: add unit tests for validation
refactor: improve error handling
chore: update dependencies

text

### Code Style

- Run `npm run lint` to check for linting errors
- Run `npm run format` to format code with Prettier
- Follow TypeScript best practices
- Add JSDoc comments for public APIs
- Maintain test coverage above 80%

### Pull Request Process

1. Update documentation if you're adding/changing APIs
2. Add tests for new functionality
3. Ensure all tests pass (`npm test`)
4. Ensure linting passes (`npm run lint`)
5. Update CHANGELOG.md with your changes
6. Submit PR with clear description

### Testing

- Write unit tests for new utilities and functions
- Write integration tests for client methods
- Mock external HTTP calls
- Test both success and error scenarios

Example:

describe('MyNewFeature', () => {
it('should do something', () => {
// Test implementation
});

it('should handle errors', () => {
// Error handling test
});
});

text

## Project Structure

mailsafepro-sdk/
├── src/
│ ├── auth/ # Authentication logic
│ ├── validation/ # Validation logic
│ ├── http/ # HTTP client
│ ├── errors/ # Error classes
│ ├── utils/ # Utilities
│ ├── interceptors/ # Axios interceptors
│ ├── config/ # Configuration
│ └── index.ts # Main entry point
├── tests/
│ ├── unit/ # Unit tests
│ └── integration/ # Integration tests
├── examples/ # Usage examples
└── docs/ # Documentation

text

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Questions?

Feel free to open an issue for discussion or reach out via email at mailsafepro1@gmail.com.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.