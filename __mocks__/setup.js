import '@testing-library/jest-dom';

// Load environment variables for testing
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
}

// Add missing globals for jose library
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add structuredClone polyfill
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock crypto globally for tests
const mockCrypto = {
  getRandomValues: jest.fn(() => new Uint8Array(32)),
  randomUUID: jest.fn(() => 'test-uuid'),
  timingSafeEqual: jest.fn((buf1, buf2) => {
    if (buf1.equals && buf2.equals) {
      return buf1.equals(buf2);
    }
    return buf1 === buf2;
  }),
  importKey: jest.fn().mockImplementation(async (format, keyData, algorithm, extractable, keyUsages) => {
    return {
      type: 'secret',
      extractable,
      algorithm,
      usages: keyUsages,
    };
  }),
  subtle: {
    importKey: jest.fn().mockImplementation(async (format, keyData, algorithm, extractable, keyUsages) => {
      return {
        type: 'secret',
        extractable,
        algorithm,
        usages: keyUsages,
      };
    }),
    sign: jest.fn().mockImplementation(async (algorithm, key, data) => {
      return new Uint8Array(32); // Mock signature
    }),
    verify: jest.fn().mockImplementation(async (algorithm, key, signature, data) => {
      return true; // Mock verification
    }),
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

// Only mock logger for unit tests - integration tests should use real logger
if (process.env.JEST_WORKER_ID && !process.env.INTEGRATION_TEST) {
  jest.mock('@/lib/utils/logger', () => ({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    },
  }));
}

// Set environment variable to identify test type
if (process.env.JEST_WORKER_ID) {
  // Check if we're running integration tests by looking at the test file path
  const testPath = process.env.JEST_WORKER_ID ? process.argv[process.argv.length - 1] : '';
  if (testPath && testPath.includes('.integration.test.')) {
    process.env.INTEGRATION_TEST = 'true';
  } else {
    process.env.INTEGRATION_TEST = 'false';
  }
}

// Global test timeout
jest.setTimeout(30000)

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})