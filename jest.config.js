const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    // Order matters! More specific patterns should come first
    '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',
    '^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/app/**', // Exclude Next.js app router files
    '!src/client/**', // Exclude client-side files
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
  // Separate configurations for different test types
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
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['next/babel', { 'preset-env': { targets: { node: 'current' } } }]
      ]
    }],
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