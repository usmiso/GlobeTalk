const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^components/(.*)$': '<rootDir>/src/components/$1',

    },
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: [
        '!src/components/**/*.{js,jsx,ts,tsx}',
        '!src/pages/**/*.{js,jsx,ts,tsx}',  // optional
        "src/app/**/*.{js,jsx}",
        '!**/*.test.{js,jsx,ts,tsx}',      // exclude test files
        '!**/node_modules/**',
        '!**/.next/**',
    ], coverageReporters: ['lcov', 'text']

}

module.exports = {
    testEnvironment: "jest-environment-jsdom",
};