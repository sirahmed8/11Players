import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '../../../',
  testMatch: [
    '<rootDir>/tests/e2e/**/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/e2e/helpers/test-context.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  }
};

export default config;
