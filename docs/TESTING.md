# Testing Guide

This document describes the testing strategy and how to run tests for the CMC Central Manager.

## Overview

The project uses different testing frameworks for backend and frontend:
- **Backend**: Jest + Supertest
- **Frontend**: Vitest + React Testing Library

## Backend Testing

### Setup

Install dependencies:
```bash
cd cmc-backend
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
cmc-backend/
├── __tests__/
│   ├── api.test.js        # API endpoint tests
│   └── database.test.js   # Database operation tests
├── jest.config.js         # Jest configuration
└── jest.setup.js          # Test setup
```

### Writing Backend Tests

Example test structure:
```js
import request from 'supertest';
import app from '../server.js';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('field');
  });
});
```

### Coverage Goals
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%


## Frontend Testing

### Setup
Install Dependencies:

```bash
cd cmc-interface
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
cmc-interface/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       └── ComponentName.test.jsx
│   ├── hooks/
│   │   └── __tests__/
│   │       └── hookName.test.js
│   └── test/
│       └── setup.js           # Test configuration
└── vitest.config.js          # Vitest configuration
```

### Writing Frontend Tests
Example Component test:
```js
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const mockHandler = vi.fn();
    render(<ComponentName onClick={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

Example Hook test:
```js
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomHook } from '../useCustomHook';

describe('useCustomHook', () => {
  it('should return expected data', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## Test Categories

### Unit Tests
Test individual functions and components in isolation.
**Backend Examples:**
- Database query functions
- Validation logic
- Utility Functions
**Frontend Examples**
- Individual React components
- Custom Hooks
- Utility Functions
### Integration Tests
Test interactions between multiple components or modules
**Backend Examples:**
- API Endpoints with database
- CORS configuration
- Error handling
**Frontend Examples:**
- Component interactions
- API Client functions
- State management

## Mocking

### Backend Mocking
Jest automatically mocks ES6 modules. To mock database:
```js
vi.mock('../database.js', () => ({
  statements: {
    getAllCmcs: { all: vi.fn() },
    getCmcById: { get: vi.fn() },
    // ... other statements
  }
}));
```

### Frontend mocking
Mock API Calls:
```js
global.fetch = vi.fn(() => 
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'mock data' }),
    })
);
```

Mock localStorage:
```js
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = localStorageMock;
```

## Continuous Integration
Tests are automatically run on every pull request via GitHub Actions (if configured).

### Local pre-commit testing
Run both backend and frontend tests before committing:

```bash
#!/bin/bash
# Run this script before committing

echo "Running backend tests..."
cd cmc-backend
npm test
BACKEND_STATUS=$?

echo "Running frontend tests..."
cd ../cmc-interface
npm test
FRONTEND_STATUS=$?

if [ $BACKEND_STATUS -ne 0 ] || [ $FRONTEND_STATUS -ne 0 ]; then
  echo "Tests failed! Please fix before committing."
  exit 1
fi

echo "All tests passed!"
```

### Debugging tests

#### Backend
```bash
# Run specific test file
npm test -- api.test.js

# Run specific test
npm test -- -t "should create a new CMC"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```


#### Frontend
```bash
# Run specific test file
npm test -- CmcSidebar.test.jsx

# Run with UI for debugging
npm run test:ui

# Debug in browser
# Open the Vitest UI and use browser DevTools
```

### Best Practices
1. **Test Naming:** Use descriptive names that explain what is being tested
2. **AAA Pattern:** Arrange, Act, Assert
3. **One Assertion Per Test:** Focus on one behavior per test
4. **Clean Up:** Always clean up after tests (database, mocks, etc.)
5. **Don't Test Implementation Details:** Test behavior, not implementation
6. **Mock External Dependencies:** Don't make real API calls or database operations
7. **Test Edge Cases:** Test error conditions and boundary values

### Coverage Reports

After running tests with coverage, view reports:

**Backend:**

```bash
open coverage/index.html
```

**Frontend:**

```bash
open coverage/index.html
```


## Troubleshooting

### Jest Issues
- **Module not found:** Check that ES modules are properly configured
- **Timeout errors:** Increase timeout with `jest.setTimeout(10000)`

### Vitest Issues
- **DOM no available:** Check jsdom environment is configured
- **CSS Errors:** Ensure `css: true` in vitest.config.js

### Common Errors
- **Cannot find module:** Check import paths and aliases
- **Async tests hanging:** Make sure to return promises or use async/await
- **Tests passing locally but failing in CI:** Check environment variables and dependencies

