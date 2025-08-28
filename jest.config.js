const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',
    '^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/app/**',
    '!src/client/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/__tests__/**/*.test.{js,ts,tsx}',
        '!<rootDir>/__tests__/**/*.integration.test.{js,ts,tsx}'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/__mocks__/setup.js'],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      moduleNameMapper: {
        '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',
        '^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^jose$': '<rootDir>/__mocks__/jose.js',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.js' }],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(jose|@peculiar|@js-temporal)/)',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '.*\\.integration\\.test\\.[jt]sx?$'
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/**/*.integration.test.{js,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__mocks__/setup.js',
        '<rootDir>/__tests__/db.setup.js'
      ],
      moduleNameMapper: {
        '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',
        '^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.js' }],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(jose|@peculiar|@js-temporal)/)',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
      ]
    }
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.js' }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@peculiar|@js-temporal)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
}

module.exports = createJestConfig(customJestConfig)
