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

  test('searches and selects timezone', async () => {
    render(<MatchmakingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search timezone...')).toBeInTheDocument();
    });

    const tzInput = screen.getByPlaceholderText('Search timezone...');
    fireEvent.focus(tzInput);
    fireEvent.change(tzInput, { target: { value: 'London' } });

    await waitFor(() => {
      expect(screen.getByText('Europe/London')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Europe/London'));

    expect(screen.getByText(/Selected: Europe\/London/)).toBeInTheDocument();
  });

  test('Find Match button disabled when no filters selected', async () => {
    render(<MatchmakingPage />);
    const button = await screen.findByText('Find Match');
    expect(button.closest('button')).toBeDisabled();
  });

  test('finds match with timezone filter', async () => {
    render(<MatchmakingPage />);

    const tzInput = await screen.findByPlaceholderText('Search timezone...');
    fireEvent.focus(tzInput);
    fireEvent.change(tzInput, { target: { value: 'Tokyo' } });

    await waitFor(() => {
      expect(screen.getByText('Asia/Tokyo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Asia/Tokyo'));

    fireEvent.click(screen.getByText('Find Match'));

    await waitFor(() => {
      // URLSearchParams encodes '/'
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('timezone=Asia%2FTokyo'));
    });

    expect(await screen.findByText('Matched User')).toBeInTheDocument();
  });

  test('proceed to chat success flow', async () => {
    jest.useFakeTimers();
    render(<MatchmakingPage />);

    // Select a language to enable button and find match
    const languageInput = await screen.findByPlaceholderText('Search language...');
    fireEvent.focus(languageInput);
    fireEvent.change(languageInput, { target: { value: 'Eng' } });
    await waitFor(() => expect(screen.getByText('English')).toBeInTheDocument());
    fireEvent.click(screen.getByText('English'));

    fireEvent.click(screen.getByText('Find Match'));
    await screen.findByText('Matched User');

    // choose chat type then proceed
    fireEvent.click(screen.getByText(/One Time Chat/));
    const proceedBtn = screen.getByText('Proceed to chat');
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/match'));
    });

    // Advance timers to trigger router push
    act(() => {
      jest.advanceTimersByTime(850);
    });

    expect(mockPush).toHaveBeenCalledWith('/pages/inbox');
    jest.useRealTimers();
  });

  test('proceed to chat error flow shows error and does not navigate', async () => {
    // Override fetch for /api/match to fail
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/available_timezones')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/available_languages')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, name: 'English', value: 'English' }]) });
      }
      if (url.includes('/api/matchmaking')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ userID: 'u2', username: 'u2' }) });
      }
      if (url.includes('/api/match')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Failed to create match' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    jest.useFakeTimers();
    render(<MatchmakingPage />);

    const languageInput = await screen.findByPlaceholderText('Search language...');
    fireEvent.focus(languageInput);
    fireEvent.change(languageInput, { target: { value: 'Eng' } });
    await waitFor(() => expect(screen.getByText('English')).toBeInTheDocument());
    fireEvent.click(screen.getByText('English'));

    fireEvent.click(screen.getByText('Find Match'));
    await screen.findByText('Matched User');

    fireEvent.click(screen.getByText(/One Time Chat/));
    fireEvent.click(screen.getByText('Proceed to chat'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create match')).toBeInTheDocument();
    });

    // Ensure no navigation happened
    expect(mockPush).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('dropdown hides when clicking outside', async () => {
    render(<MatchmakingPage />);

    const languageInput = await screen.findByPlaceholderText('Search language...');
    fireEvent.focus(languageInput);

    // List should be visible now
    fireEvent.change(languageInput, { target: { value: 'E' } });
    await waitFor(() => expect(screen.getByText('English')).toBeInTheDocument());

    // Click outside (on heading text for example)
    fireEvent.mouseDown(screen.getByText((c) => c.includes('Find a Match')));

    // Options should be hidden; querying by text should fail
    await waitFor(() => {
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });
  });

  test('clear selection resets search and selected language', async () => {
    render(<MatchmakingPage />);

    const languageInput = await screen.findByPlaceholderText('Search language...');
    fireEvent.focus(languageInput);
    fireEvent.change(languageInput, { target: { value: 'Eng' } });
    await waitFor(() => expect(screen.getByText('English')).toBeInTheDocument());
    fireEvent.click(screen.getByText('English'));

    // Clear
    fireEvent.click(screen.getByText('Clear'));

    // Selected label should be gone
    expect(screen.queryByText('Selected: English')).not.toBeInTheDocument();

    // Re-focus and type again to show results anew
    fireEvent.focus(languageInput);
    fireEvent.change(languageInput, { target: { value: 'French' } });
    await waitFor(() => expect(screen.getByText('French')).toBeInTheDocument());
  });
});