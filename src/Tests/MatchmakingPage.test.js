import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import MatchmakingPage from "../app/pages/matchmaking/page";
import { auth } from "../app/firebase/auth";

// Mock Firebase auth properly
jest.mock("../app/firebase/auth", () => ({
  auth: {
    currentUser: {
      uid: "user123",
      email: "test@example.com"
    }
  }
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
    back: jest.fn()
  }),
}));

// Mock global fetch
global.fetch = jest.fn();
global.alert = jest.fn();

const mockTimezones = [
  { name: "UTC-05", value: "(UTC-05:00) Eastern Time" },
  { name: "UTC+01", value: "(UTC+01:00) Central European Time" }
];

const mockLanguages = [
  { name: "English", value: "en" },
  { name: "French", value: "fr" }
];

const mockMatch = {
  userID: "match123", 
  username: "MatchedUser",
  name: "Matched User",
  email: "matched@example.com",
  language: "English",
  timezone: "UTC-05",
  intro: "Hello world",
  ageMin: 20,
  ageMax: 30,
  hobbies: ["Reading", "Sports"],
  avatarURL: "https://example.com/avatar.jpg"
};

describe("MatchmakingPage - Comprehensive Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default successful fetches
    global.fetch.mockImplementation((url) => {
      if (url.includes('available_timezones')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTimezones
        });
      }
      if (url.includes('available_languages')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLanguages
        });
      }
      if (url.includes('matchmaking')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockMatch
        });
      }
      if (url.includes('/api/match')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Not found' })
      });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // LINES 28-45: useEffect for fetching available data
  test("fetches available timezones and languages on mount", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/available_timezones'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/available_languages'));
    });
  });

  test("handles empty arrays when fetch fails", async () => {
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Failed' })
      })
    );

    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Component should render without crashing
    expect(screen.getByText(/Find a Match/i)).toBeInTheDocument();
  });

  test("handles non-array responses from API", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('available_timezones')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ timezones: mockTimezones }) // Wrong format
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => []
      });
    });

    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Should handle the malformed response gracefully
    expect(screen.getByPlaceholderText("Search timezone...")).toBeInTheDocument();
  });

  // LINES 53-68: handleProceedToChat function
  test("handleProceedToChat creates match and redirects", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    // First, find a match
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
    });

    await waitFor(() => {
      expect(screen.getByText("UTC-05")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("UTC-05"));
    });

    const findMatchButton = screen.getByRole("button", { name: /Find Match/i });
    await act(async () => {
      fireEvent.click(findMatchButton);
    });

    // Wait for match to appear
    await waitFor(() => {
      expect(screen.getByText("Matched User")).toBeInTheDocument();
    });

    // Select chat type
    const oneTimeChatButton = screen.getByText("One Time Chat");
    await act(async () => {
      fireEvent.click(oneTimeChatButton);
    });

    // Proceed to chat
    const proceedButton = screen.getByText("Proceed to chat");
    await act(async () => {
      fireEvent.click(proceedButton);
    });

    // Check API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/match'),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userA: "user123", userB: "match123" })
        })
      );
    });

    // Check redirect after delay
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockPush).toHaveBeenCalledWith("/pages/inbox");
  });

  test("handleProceedToChat shows error when API fails", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/match')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Match creation failed" })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockMatch
      });
    });

    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Find match and proceed
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
      fireEvent.click(await screen.findByText("UTC-05"));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Find Match/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("One Time Chat")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("One Time Chat"));
      fireEvent.click(screen.getByText("Proceed to chat"));
    });

    await waitFor(() => {
      expect(screen.getByText("Match creation failed")).toBeInTheDocument();
    });
  });

  // LINES 74-87: Click outside handler
  test("click outside closes dropdowns", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Open timezone dropdown
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
    });

    await waitFor(() => {
      expect(screen.getByText("UTC-05")).toBeInTheDocument();
    });

    // Click outside
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText("UTC-05")).not.toBeInTheDocument();
    });
  });

  test("event listener cleanup on unmount", async () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<MatchmakingPage />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  // LINES 91-357: UI rendering and interactions
  test("filtering and searching timezones", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    
    // Type in search
    await act(async () => {
      fireEvent.change(timezoneInput, { target: { value: "Eastern" } });
    });

    // Should filter options
    await act(async () => {
      fireEvent.focus(timezoneInput);
    });

    await waitFor(() => {
      expect(screen.getByText("UTC-05")).toBeInTheDocument();
      expect(screen.queryByText("UTC+01")).not.toBeInTheDocument();
    });
  });

  test("clearing timezone selection", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    
    // Select a timezone
    await act(async () => {
      fireEvent.focus(timezoneInput);
      fireEvent.click(await screen.findByText("UTC-05"));
    });

    // Clear button should appear
    const clearButton = screen.getByText("Clear");
    await act(async () => {
      fireEvent.click(clearButton);
    });

    // Selection should be cleared
    expect(timezoneInput.value).toBe("");
  });

  test("handles matchmaking with only timezone filter", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Set only timezone
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
      fireEvent.click(await screen.findByText("UTC-05"));
    });

    const findMatchButton = screen.getByRole("button", { name: /Find Match/i });
    await act(async () => {
      fireEvent.click(findMatchButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('timezone=UTC-05'));
    });
  });

  test("handles matchmaking with only language filter", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Set only language
    const languageInput = screen.getByPlaceholderText("Search language...");
    await act(async () => {
      fireEvent.focus(languageInput);
      fireEvent.click(await screen.findByText("English"));
    });

    const findMatchButton = screen.getByRole("button", { name: /Find Match/i });
    await act(async () => {
      fireEvent.click(findMatchButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('language=English'));
    });
  });

  test("shows error when no filters selected", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    const findMatchButton = screen.getByRole("button", { name: /Find Match/i });
    await act(async () => {
      fireEvent.click(findMatchButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Please select at least a timezone or a language/i)).toBeInTheDocument();
    });
  });

  test("displays all match user information correctly", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Find a match
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
      fireEvent.click(await screen.findByText("UTC-05"));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Find Match/i }));
    });

    // Check all displayed information
    await waitFor(() => {
      expect(screen.getByText("MatchedUser")).toBeInTheDocument();
      expect(screen.getByText("Matched User")).toBeInTheDocument();
      expect(screen.getByText("matched@example.com")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("UTC-05")).toBeInTheDocument();
      expect(screen.getByText("Hello world")).toBeInTheDocument();
      expect(screen.getByText("20 - 30")).toBeInTheDocument();
      expect(screen.getByText("Reading, Sports")).toBeInTheDocument();
    });

    // Check avatar
    const avatar = screen.getByAltText("avatar");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  test("handles match with avatar field instead of avatarURL", async () => {
    const matchWithAvatarField = {
      ...mockMatch,
      avatar: "https://example.com/avatar2.jpg",
      avatarURL: undefined
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('matchmaking')) {
        return Promise.resolve({
          ok: true,
          json: async () => matchWithAvatarField
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => []
      });
    });

    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Find a match
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
      fireEvent.click(await screen.findByText("UTC-05"));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Find Match/i }));
    });

    // Should use avatar field
    await waitFor(() => {
      const avatar = screen.getByAltText("avatar");
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar2.jpg");
    });
  });

  test("falls back to JSON display for unknown match format", async () => {
    const unknownMatch = {
      userID: "test123",
      unknownField: "test value"
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('matchmaking')) {
        return Promise.resolve({
          ok: true,
          json: async () => unknownMatch
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => []
      });
    });

    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Find a match
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
      fireEvent.click(await screen.findByText("UTC-05"));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Find Match/i }));
    });

    // Should show JSON representation
    await waitFor(() => {
      expect(screen.getByText(/"unknownField": "test value"/)).toBeInTheDocument();
    });
  });

  test("handles long-term chat selection", async () => {
    await act(async () => {
      render(<MatchmakingPage />);
    });

    // Find a match first
    const timezoneInput = screen.getByPlaceholderText("Search timezone...");
    await act(async () => {
      fireEvent.focus(timezoneInput);
      fireEvent.click(await screen.findByText("UTC-05"));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Find Match/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Long Term Chat")).toBeInTheDocument();
    });

    // Select long-term chat
    await act(async () => {
      fireEvent.click(screen.getByText("Long Term Chat"));
    });

    expect(screen.getByText("Selected: Long Term Chat")).toBeInTheDocument();
  });
});