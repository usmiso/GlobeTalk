/**
 * Tests for Explore page
 */
import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Navbar to avoid layout complexity
jest.mock('@/app/components/Navbar', () => () => <nav data-testid="navbar" />);

// Mock router to avoid Next.js App Router invariant
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

// Mock app auth to avoid initializing Firebase in tests
jest.mock('@/app/firebase/auth', () => ({
  auth: { currentUser: { uid: 'u-123' } },
}));

// Mock Papa.parse to control CSV parsing
jest.mock('papaparse', () => ({
  __esModule: true,
  default: { parse: (text, opts) => ({ data: [] }) },
  parse: (text, opts) => ({ data: [] }),
}));

// Access the mocked SDKs after jest transforms
import Papa from 'papaparse';

// Import the page under test AFTER mocks so they take effect
import ExplorePage from '@/app/pages/explore/page';

// Ensure timers don't trigger the 10s interval repeatedly
beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(global, 'fetch');
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

function setupAuth(user = { uid: 'u-123', email: 'user@test.com' }) {
  // Mutate the exported auth object so Explore sees a logged-in user
  const authModule = require('@/app/firebase/auth');
  if (!authModule.auth) {
    authModule.auth = {};
  }
  authModule.auth.currentUser = user;
}

function mockExploreNetwork({
  matchedTimezones = ['Europe/Paris'],
  facts = [
    {
      title: 'French Cuisine',
      category: 'Food',
      location: 'Paris',
      description: 'Croissants and baguettes',
      country: 'France',
    },
    {
      title: 'Bastille Day',
      category: 'Holidays',
      location: 'France',
      description: 'National day celebrations',
      country: 'France',
    },
  ],
  countryCsv = 'FR,France\nZA,South Africa',
  countryProfile = {
    cca2: 'FR',
    name: { common: 'France' },
    region: 'Europe',
    population: 67000000,
    timezones: ['UTC+1'],
    currencies: { EUR: { name: 'Euro' } },
    languages: { fra: 'French' },
    coatOfArms: { svg: 'https://example.com/coa.svg' },
    flags: { svg: 'https://example.com/flag.svg' },
  },
} = {}) {
  // Mock Papa.parse to return our facts from explorer.csv
  const parseImpl = jest.fn(() => ({ data: facts }));
  // Some imports use default, others named; cover both
  // @ts-ignore
  Papa.parse = parseImpl;
  // @ts-ignore
  if (Papa.default) Papa.default.parse = parseImpl;

  // fetch handler
  global.fetch.mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;

    if (url.endsWith('/assets/country.csv')) {
      return {
        ok: true,
        text: async () => countryCsv,
      };
    }

    if (url.endsWith('/assets/explorer.csv')) {
      return {
        ok: true,
        text: async () => 'title,category,location,description,country\n', // content unused by mocked Papa
      };
    }

    if (url.startsWith('http://localhost:5000/api/matchedUsers')) {
      return {
        ok: true,
        json: async () => matchedTimezones,
      };
    }

    if (url.startsWith('https://restcountries.com/v3.1/name/')) {
      return {
        ok: true,
        json: async () => [countryProfile],
      };
    }

    // Fallback for unexpected URLs
    return {
      ok: true,
      json: async () => ({}),
      text: async () => '',
    };
  });
}

function advanceAll() {
  // Let pending promises resolve then flush timers
  return Promise.resolve().then(() => {
    jest.runOnlyPendingTimers();
  });
}


describe('ExplorePage', () => {
  test('loads and displays cultural facts; filters by category and search', async () => {
    setupAuth();
    mockExploreNetwork();

    render(<ExplorePage />);

    // Wait for one of the fact cards to appear
    await waitFor(() => {
      expect(screen.getByText('French Cuisine')).toBeInTheDocument();
      expect(screen.getByText('Bastille Day')).toBeInTheDocument();
    });

    // Filter by category "Food" should keep French Cuisine and hide Bastille Day
    fireEvent.click(screen.getByRole('button', { name: /food/i }));

    await waitFor(() => {
      expect(screen.getByText('French Cuisine')).toBeInTheDocument();
      expect(screen.queryByText('Bastille Day')).not.toBeInTheDocument();
    });

    // Search for "croissants" narrows to the first fact
    const searchBox = screen.getByPlaceholderText(/search for traditions/i);
    fireEvent.change(searchBox, { target: { value: 'croissants' } });

    await waitFor(() => {
      expect(screen.getByText('French Cuisine')).toBeInTheDocument();
    });
  });

  test('switching to Country Profiles shows a profile and details', async () => {
    setupAuth();
    mockExploreNetwork();

    render(<ExplorePage />);

    // Wait for facts first to ensure data flow finished
    await waitFor(() => expect(screen.getByText('French Cuisine')).toBeInTheDocument());

    // Switch to Profiles tab
    fireEvent.click(screen.getByRole('tab', { name: /country profiles/i }));

    // Wait for the list to show France (there will be two headings: H4 in list, H2 in details)
    const franceHeadings = await screen.findAllByRole('heading', { name: 'France' });
    const listFrance = franceHeadings.find((el) => el.tagName === 'H4');
    expect(listFrance).toBeInTheDocument();

    // Click the France item in the list
    if (!listFrance) throw new Error('List heading for France not found');
    fireEvent.click(listFrance);

    // Details panel shows region, currency, and language chip
    await waitFor(() => {
      // Removed ambiguous 'Europe' assertion (appears in list and details)
      expect(screen.getByText('Euro')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
      expect(screen.getByText('Population:')).toBeInTheDocument();
      expect(screen.getByText('Time Zone:')).toBeInTheDocument();
    });
  });
});
