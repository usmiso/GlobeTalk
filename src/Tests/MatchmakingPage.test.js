import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import MatchmakingPage from "../app/pages/matchmaking/page";
import { auth } from "../app/firebase/auth";

/**
 * @jest-environment jsdom
 */

// Global fetch polyfill
global.fetch = jest.fn();
global.Headers = jest.fn();

// Mock Firebase auth
jest.mock('../app/firebase/auth', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  }
}));

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock components
jest.mock('../app/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

jest.mock('../app/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Navbar</div>;
  };
});

// ...existing code...

describe('MatchmakingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fetch mock responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/available_timezones')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'America/New_York', value: 'America/New_York' },
            { id: 2, name: 'Europe/London', value: 'Europe/London' },
            { id: 3, name: 'Asia/Tokyo', value: 'Asia/Tokyo' }
          ])
        });
      }
      
      if (url.includes('/api/available_languages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'English', value: 'English' },
            { id: 2, name: 'Spanish', value: 'Spanish' },
            { id: 3, name: 'French', value: 'French' }
          ])
        });
      }
      
      if (url.includes('/api/matchmaking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            userID: 'matched-user-id',
            username: 'matcheduser',
            language: 'English',
            timezone: 'America/New_York',
            avatarURL: '/avatar.jpg',
            intro: 'Hello world!',
            hobbies: ['reading', 'coding']
          })
        });
      }
      
      if (url.includes('/api/match')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  test('renders matchmaking page with all elements', async () => {
    render(<MatchmakingPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    });
    
        expect(screen.getByText((content) => content.includes('Find a Match'))).toBeInTheDocument();
    expect(screen.getByText('Filter by Timezone, Country, or Both')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search timezone...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search language...')).toBeInTheDocument();
    expect(screen.getByText('Find Match')).toBeInTheDocument();
  });

  test('fetches available timezones and languages on mount', async () => {
    render(<MatchmakingPage />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/available_timezones'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/available_languages'));
    });
  });



  test('searches and selects language', async () => {
    render(<MatchmakingPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search language...')).toBeInTheDocument();
    });
    
    const languageInput = screen.getByPlaceholderText('Search language...');
    
    fireEvent.focus(languageInput);
    fireEvent.change(languageInput, { target: { value: 'Eng' } });
    
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('English'));
    
    expect(screen.getByText('Selected: English')).toBeInTheDocument();
  });



  test('finds match with language filter', async () => {
    render(<MatchmakingPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search language...')).toBeInTheDocument();
    });
    
    // Select language
    const languageInput = screen.getByPlaceholderText('Search language...');
    fireEvent.focus(languageInput);
    fireEvent.change(languageInput, { target: { value: 'Eng' } });
    
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('English'));
    
    // Click find match
    fireEvent.click(screen.getByText('Find Match'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('language=English'));
    });
    
    expect(await screen.findByText('Matched User')).toBeInTheDocument();
  });


  test('handles empty timezones and languages response', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/available_timezones') || url.includes('/api/available_languages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]) // Empty array
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    
    render(<MatchmakingPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search timezone...')).toBeInTheDocument();
    });
    
    // Try to search in empty timezone list
    const timezoneInput = screen.getByPlaceholderText('Search timezone...');
    fireEvent.focus(timezoneInput);
    fireEvent.change(timezoneInput, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(screen.getByText('No results')).toBeInTheDocument();
    });
  });
});