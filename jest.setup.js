// jest.setup.js
import '@testing-library/jest-dom';
import 'whatwg-fetch'; // polyfill fetch

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Mock window methods
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true,
});

// Mock localStorage if needed
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage if needed
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

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
  'Prop `className` did not match',
  // Invalid DOM props often emitted by libraries
  'Invalid DOM property',
  'Received `false` for a non-boolean attribute',
  // App-specific test noise
  'Could not get IP address:',
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

// Mock IntersectionObserver if needed
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver if needed
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};