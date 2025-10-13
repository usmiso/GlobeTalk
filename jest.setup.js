// jest.setup.js
import '@testing-library/jest-dom';
import 'whatwg-fetch'; // polyfill fetch

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Global mock for next/image to avoid DOM warnings for boolean props like priority & fill
jest.mock('next/image', () => {
  const React = require('react');
  const NextImageMock = ({ src = '', alt = '', ...props }) => {
    // Strip Next-specific/boolean-only props that aren't valid DOM attributes
    const { fill, priority, placeholder, blurDataURL, loader, ...rest } = props;
    return React.createElement('img', { src, alt, ...rest });
  };
  NextImageMock.displayName = 'NextImageMock';
  return NextImageMock;
});

// Mock window methods (guard for Node test environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'alert', {
    value: jest.fn(),
    writable: true,
  });
}

// Mock localStorage/sessionStorage if needed (safe in Node)
if (typeof global.localStorage === 'undefined') {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock;
}

if (typeof global.sessionStorage === 'undefined') {
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.sessionStorage = sessionStorageMock;
}

// Suppress console errors during tests (optional)
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;
const originalDebug = console.debug;

function isString(x) {
  return typeof x === 'string';
}

function suppressBySubstring(msg, substrings) {
  return substrings.some((s) => msg.includes(s));
}

const ERROR_WARNING_FILTERS = [
  // React/JSDOM testing warnings
  'not wrapped in act(',
  'An update to',
  'ReactDOM.render is no longer supported',
  'An invalid form control',
  'validateDOMNesting',
  // Hydration/SSR noise from Next/React
  'Text content does not match server-rendered HTML',
  'Expected server HTML to contain a matching',
  'Hydration failed',
  'Prop className did not match',
  // Invalid DOM props often emitted by libraries
  'Invalid DOM property',
  'Received false for a non-boolean attribute',
  // App-specific test noise
  'Could not get IP address:',
  // Intentional server error-path logs triggered in tests
  'Error adding language(s) to available_languages',
  'Error adding timezone to available_countries',
  '[REPORT] Error saving report',
  'Error storing IP address',
  'Error updating reported user profile with violation',
  'Error fetching matched users:',
  'Error fetching stats:',
  // UserProfile page error-path logs (expected in tests)
  'Error fetching profile:',
  'Error fetching languages:',
  'Error fetching timezones:',
];

function isAuthErrorObject(arg) {
  return (
    arg && typeof arg === 'object' && (
      (
        'code' in arg && typeof arg.code === 'string' && (
          arg.code.includes('auth/popup-closed-by-user') ||
          arg.code.includes('auth/popup-blocked') ||
          arg.code.includes('auth/invalid-credential') ||
          arg.code.includes('auth/network-request-failed') ||
          arg.code.includes('auth/unauthorized-domain')
        )
      ) ||
      (
        // Suppress known generic error objects emitted by our tests
        'message' in arg && typeof arg.message === 'string' && (
          arg.message.includes('Custom error message')
        )
      )
    )
  );
}
beforeAll(() => {
  // Error filter
  console.error = (...args) => {
    const first = args[0];
    if (isString(first) && suppressBySubstring(first, ERROR_WARNING_FILTERS)) return;
    if (isAuthErrorObject(first)) return;
    originalError.call(console, ...args);
  };

  // Warn filter (mirror error filters)
  console.warn = (...args) => {
    const first = args[0];
    if (isString(first) && suppressBySubstring(first, ERROR_WARNING_FILTERS)) return;
    originalWarn.call(console, ...args);
  };

  // Log/debug: suppress by default unless explicitly enabled
  const allowVerbose = process.env.VERBOSE_TEST_LOGS === 'true';
  console.log = (...args) => {
    if (!allowVerbose) {
      // Drop common app logs
      const first = args[0];
      if (isString(first) && (
        first.includes('Fetched IP address:') ||
        first.includes('Using IP address:')
      )) return;
      // Suppress all generic logs when not verbose
      return;
    }
    originalLog.call(console, ...args);
  };

  console.debug = (...args) => {
    if (process.env.VERBOSE_TEST_LOGS === 'true') {
      originalDebug.call(console, ...args);
    }
    // otherwise drop
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
  console.debug = originalDebug;
});

// Mock IntersectionObserver/ResizeObserver if needed (safe in Node)
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}

if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}