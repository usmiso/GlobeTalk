const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/app/**/*.{js,jsx}',
    '!src/components/**/*.{js,jsx,ts,tsx}', // optional exclude
    '!src/pages/**/*.{js,jsx,ts,tsx}',      // optional exclude
    '!**/*.test.{js,jsx,ts,tsx}',           // exclude test files
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageReporters: ['lcov', 'text'],
};

// Use next/jest to wrap our custom config
module.exports = createJestConfig(customJestConfig);
