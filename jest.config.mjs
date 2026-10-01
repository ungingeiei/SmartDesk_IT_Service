// Unit tests for the pure business logic in src/lib. next/jest reuses the
// project's SWC transform and the "@/..." alias from tsconfig.json, so the
// test files can import the app's modules exactly as the app does.
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

export default createJestConfig({
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/lib/**/*.js'],
});
