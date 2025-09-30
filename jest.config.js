const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
  },

  testEnvironment: 'jest-environment-jsdom',

  // Exclude specific files from running tests
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/components/ProtectedLayout.js',
    '<rootDir>/src/components/ProtectedRoute.js',
    '<rootDir>/src/components/useAuthRedirect.js',
    '<rootDir>/src/components/AuthContext.js', // optional if you don't want to test it
    '<rootDir>/src/app/pages/reports/', // exclude reports from testing
  ],

  collectCoverage: true,

  // Exclude specific files/folders from coverage reporting
  collectCoverageFrom: [
    'src/app/**/*.{js,jsx}',
    '!src/app/components/ProtectedLayout.js',
    '!src/app/components/ProtectedRoute.js',
    '!src/app/components/useAuthRedirect.js',
    '!src/app/pages/reports/**/*.{js,jsx}', // exclude reports from coverage
    'src/app/firebase/auth.js',
    'src/app/firebase/config.js',
    '!src/app/components/AuthContext.js', // optional
    '!src/pages/**/*.{js,jsx,ts,tsx}',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  coverageReporters: ['lcov', 'text'],
};

// Wrap custom config with next/jest
module.exports = createJestConfig(customJestConfig);
