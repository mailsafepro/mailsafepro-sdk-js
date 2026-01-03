module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
      '**/__tests__/**/*.ts',
      '**/?(*.)+(spec|test).ts',
    ],
    transform: {
      '^.+\\.ts$': ['ts-jest', {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      }],
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/**/*.test.ts',
      '!src/**/*.spec.ts',
      '!src/**/__tests__/**',
      '!src/index.ts',
      '!src/**/types.ts', // Excluir archivos de tipos
    ],
    coverageThreshold: {
      global: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    coverageReporters: [
      'text',
      'text-summary',
      'html',
      'lcov',
      'json',
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 10000,
    verbose: true,
    maxWorkers: '50%',
  };
  