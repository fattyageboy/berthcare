# Testing Guide

## Overview

This guide covers testing practices for the BerthCare backend authentication system.

## Test Structure

```
backend/
├── src/
│   ├── __tests__/              # Unit tests
│   │   ├── services/           # Service layer tests
│   │   │   ├── auth.service.test.ts
│   │   │   ├── device.service.test.ts
│   │   │   └── auth0.service.test.ts
│   │   ├── middleware/         # Middleware tests
│   │   │   ├── auth.test.ts
│   │   │   └── rbac.test.ts
│   │   ├── utils/              # Utility tests
│   │   │   └── jwt.utils.test.ts
│   │   └── setup.ts           # Test configuration
│   └── ...
├── tests/
│   ├── unit/                   # Additional unit tests
│   └── integration/            # Integration tests (future)
├── jest.config.js              # Jest configuration
└── package.json
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.service.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="login"
```

### Coverage Reports

```bash
# Generate full coverage report
npm run test:coverage

# Coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/services/user/**/*.ts"

# View coverage in browser
open coverage/lcov-report/index.html
```

## Test Coverage Targets

The project enforces minimum coverage thresholds:

- **Statements:** ≥80%
- **Branches:** ≥80%
- **Functions:** ≥80%
- **Lines:** ≥80%

Current auth service coverage:
- **Statements:** 96.72%
- **Branches:** 92.3%
- **Functions:** 100%
- **Lines:** 96.47%

## Writing Tests

### Test Structure

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize mocks
  });

  // Cleanup
  afterEach(() => {
    // Reset state
  });

  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = { /* ... */ };

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toBe(expectedValue);
    });

    it('should throw error when invalid input', () => {
      // Arrange & Act & Assert
      expect(() => methodName(invalidInput)).toThrow('Error message');
    });
  });
});
```

### Mocking Best Practices

#### Mock External Dependencies

```typescript
// Mock entire module
jest.mock('../../config');

// Mock specific functions
jest.mock('../../shared/utils/jwt.utils', () => ({
  generateAccessToken: jest.fn(),
  verifyToken: jest.fn(),
}));

// Mock database client
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

(database.getClient as jest.Mock).mockResolvedValue(mockClient);
```

#### Reset Mocks

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history
  // or
  jest.resetAllMocks(); // Reset implementation
});
```

#### Verify Mock Calls

```typescript
// Check if called
expect(mockFunction).toHaveBeenCalled();

// Check call count
expect(mockFunction).toHaveBeenCalledTimes(2);

// Check arguments
expect(mockFunction).toHaveBeenCalledWith(expectedArg);

// Check call order
expect(mockFunction).toHaveBeenNthCalledWith(1, firstCallArg);
```

### Testing Async Code

```typescript
// Using async/await
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expectedValue);
});

// Testing rejections
it('should reject with error', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});

// Testing promises
it('should resolve promise', () => {
  return expect(promiseFunction()).resolves.toBe(expectedValue);
});
```

### Testing Express Middleware

```typescript
describe('authenticate middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  it('should call next() for valid token', async () => {
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    await authenticate(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
  });
});
```

## Test Coverage by Component

### Auth Service (`auth.service.ts`)
- ✅ Login with local authentication
- ✅ Login with Auth0
- ✅ Token refresh
- ✅ Token validation
- ✅ Error handling (invalid credentials, missing fields, user not found)

### Device Service (`device.service.ts`)
- ✅ Store/update device tokens
- ✅ Verify device tokens
- ✅ Delete device tokens
- ✅ Cleanup expired tokens
- ✅ Get user devices

### Auth0 Service (`auth0.service.ts`)
- ✅ Configuration detection
- ✅ Credential verification
- ✅ Token validation

### JWT Utils (`jwt.utils.ts`)
- ✅ Access token generation
- ✅ Refresh token generation
- ✅ Token verification
- ✅ Token expiration handling

### Auth Middleware (`auth.ts`)
- ✅ Bearer token authentication
- ✅ Optional authentication
- ✅ Error handling

### RBAC Middleware (`rbac.ts`)
- ✅ Role-based access control
- ✅ Permission-based access control
- ✅ Resource ownership validation
- ✅ Organization-based access control

## Common Test Patterns

### Testing Database Operations

```typescript
it('should release client on error', async () => {
  mockClient.query.mockRejectedValue(new Error('Database error'));

  await expect(serviceMethod()).rejects.toThrow();
  expect(mockClient.release).toHaveBeenCalled();
});
```

### Testing Token Operations

```typescript
it('should reject expired token', async () => {
  (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
    throw new Error('Token has expired');
  });

  await expect(validateToken('expired-token')).rejects.toThrow();
});
```

### Testing Authorization

```typescript
it('should deny access without required permission', () => {
  mockRequest.user = {
    role: 'nurse',
    // ... other user properties
  };

  const middleware = requirePermission(Permission.ADMIN_ACCESS);
  middleware(mockRequest, mockResponse, mockNext);

  expect(mockResponse.status).toHaveBeenCalledWith(403);
  expect(mockNext).not.toHaveBeenCalled();
});
```

## Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="should successfully login"
```

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--testPathPattern=${fileBasename}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-commit hook (optional)

### GitHub Actions Example

```yaml
- name: Run tests
  run: npm test -- --coverage

- name: Check coverage
  run: npm test -- --coverage --coverageThreshold='{"global":{"statements":80,"branches":80,"functions":80,"lines":80}}'
```

## Best Practices

1. **Test Naming:** Use descriptive names that explain what is being tested and the expected outcome
2. **Test Isolation:** Each test should be independent and not rely on others
3. **Mock External Dependencies:** Mock database, APIs, and external services
4. **Cleanup:** Always reset mocks and restore state in afterEach
5. **Edge Cases:** Test error scenarios, boundary conditions, and edge cases
6. **Assertions:** Use specific assertions that clearly indicate what went wrong
7. **Coverage:** Aim for >80% coverage, but focus on meaningful tests
8. **Fast Tests:** Keep unit tests fast by avoiding real I/O operations

## Troubleshooting

### Tests Fail Intermittently
- Check for shared state between tests
- Ensure mocks are properly reset
- Look for race conditions in async code

### Low Coverage
- Check which lines/branches are uncovered
- Add tests for error scenarios
- Test edge cases and boundary conditions

### Mock Not Working
- Verify mock is defined before the module is imported
- Check jest.mock() is at the top of the file
- Ensure mock implementation matches expected interface

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)
