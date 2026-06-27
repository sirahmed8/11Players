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
  modulePathIgnorePatterns: [
    '<rootDir>/.firebase/',
    '<rootDir>/.next/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'es2022',
        module: 'commonjs',
        moduleResolution: 'node',
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowJs: true,
        paths: {
          '@/*': ['./src/*']
        }
      }
    }]
  }
};

export default config;
