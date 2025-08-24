# Testing Guide

This project supports both unit tests and integration tests with separate coverage reporting.

## Test Structure

### Unit Tests
- Located in `__tests__/` directory
- File naming: `*.test.ts` or `*.test.tsx`
- Run in `jsdom` environment
- Mock external dependencies (database, external APIs)
- Fast execution, no external dependencies

### Integration Tests
- Located in `__tests__/` directory
- File naming: `*.integration.test.ts` or `*.integration.test.tsx`
- Run in `node` environment
- Use real database connections
- Test full application flow

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Coverage Reports

#### All Tests Coverage
```bash
npm run test:coverage:all
```

#### Unit Tests Coverage Only
```bash
npm run test:coverage:unit
```

#### Integration Tests Coverage Only
```bash
npm run test:coverage:integration
```

#### Legacy Coverage (same as all)
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration
- **Unit Tests**: Use `jsdom` environment, mock external dependencies
- **Integration Tests**: Use `node` environment, real database connections
- **Coverage Threshold**: 80% for branches, functions, lines, and statements

### Environment Variables
- Tests use `.env.test` file for configuration
- Integration tests set `INTEGRATION_TEST=true`
- Unit tests set `INTEGRATION_TEST=false`

### Database Setup
- Integration tests use a separate test database
- Database is cleaned before and after each test
- Helper functions available in `__tests__/db.setup.js`

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from '@jest/globals';
import { formatDate } from '@/shared/utils/date';

describe('Date Utils Unit Tests', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDate(date, 'YYYY-MM-DD');
    expect(formatted).toBe('2024-01-15');
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect } from '@jest/globals';
import { AuthService } from '@/lib/modules/auth/service/auth.service';

describe('AuthService Integration Tests', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      fullName: 'Test User',
      password: 'securePassword123',
      timezone: 'America/New_York'
    };

    const result = await AuthService.register(userData);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.email).toBe(userData.email);
  });
});
```

## Best Practices

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test complete workflows with real dependencies
3. **Naming**: Use descriptive test names that explain the expected behavior
4. **Setup**: Use `beforeEach` for test setup, `afterEach` for cleanup
5. **Mocking**: Mock external dependencies in unit tests
6. **Database**: Use helper functions for creating test data in integration tests

## Coverage Requirements

- **Branches**: 40%
- **Functions**: 40%
- **Lines**: 40%
- **Statements**: 40%

Note: These are global thresholds. Individual modules may have higher coverage requirements based on their criticality.

Coverage reports are generated in the `coverage/` directory and can be viewed in a browser.
