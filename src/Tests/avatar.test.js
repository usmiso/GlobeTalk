// src/Tests/AvatarUsernameGen.test.js
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import AvatarUsernameGen from "../app/components/avatar/page";
import { auth } from "../app/firebase/auth";

// Mock next/router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ 
    push: mockPush,
    refresh: jest.fn(),
    back: jest.fn()
  }),
}));

// Mock auth
jest.mock("../app/firebase/auth", () => {
  const mockAuth = {
    currentUser: { uid: "testUserId" }
  };
  return { auth: mockAuth };
});

// Mock global fetch
global.fetch = jest.fn();
global.alert = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  require("../app/firebase/auth").auth.currentUser = { uid: "testUserId" };
  
  fetch.mockImplementation((url) => {
    if (url.includes('randomuser.me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          results: [{ login: { username: "mockUser" } }],
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
});

describe("AvatarUsernameGen Component", () => {
  test("renders correctly with default elements", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    expect(screen.getByText(/Create Your Avatar/i)).toBeInTheDocument();
    expect(screen.getByText(/Personalize your profile/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate New Avatar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save New Avatar/i })).toBeInTheDocument();
  });

  test("generates a username and updates state", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genNameButton = screen.getByRole("button", { name: /Generate Name/i });

    await act(async () => {
      fireEvent.click(genNameButton);
    });

    // Wait for the username to appear
    await waitFor(() => {
      expect(screen.getByText("mockUser")).toBeInTheDocument();
    });
  });

  test("handles username generation API failure", async () => {
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: async () => ({}),
      })
    );

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genNameButton = screen.getByRole("button", { name: /Generate Name/i });

    await act(async () => {
      fireEvent.click(genNameButton);
    });

    expect(global.alert).toHaveBeenCalledWith("Failed to fetch username");
  });

  test("handles malformed username API response", async () => {
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: async () => ({ results: [{}] }), // No login.username
      })
    );

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genNameButton = screen.getByRole("button", { name: /Generate Name/i });

    await act(async () => {
      fireEvent.click(genNameButton);
    });

    expect(global.alert).toHaveBeenCalledWith("Malformed response from username API");
  });

  test("generates avatar and updates state", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genAvatarButton = screen.getByRole("button", { name: /Generate New Avatar/i });

    // Get initial avatar (if any)
    const initialAvatar = screen.queryByAltText("avatar");

    await act(async () => {
      fireEvent.click(genAvatarButton);
    });

    // Check that an avatar image exists
    await waitFor(() => {
      expect(screen.getByAltText("avatar")).toBeInTheDocument();
    });
  });


  test("handleConfirm alerts if user not logged in", async () => {
    // Mock no user logged in
    require("../app/firebase/auth").auth.currentUser = null;

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(global.alert).toHaveBeenCalledWith("User not logged in");
  });

  test("handleConfirm alerts if API fails", async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('randomuser.me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ login: { username: "mockUser" } }],
          }),
        });
      }
      // Mock failure for the profile API call
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "API failed" }),
      });
    });

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(global.alert).toHaveBeenCalledWith("API failed");
  });

  test("handleConfirm alerts on network error", async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('randomuser.me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ login: { username: "mockUser" } }],
          }),
        });
      }
      // Mock network error
      return Promise.reject(new Error("Network error"));
    });

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(global.alert).toHaveBeenCalledWith("Error saving avatar: Network error");
  });


});

// Additional test for edge cases
describe("Edge Cases", () => {
  test("handles empty username response gracefully", async () => {
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: async () => ({ results: [] }), // Empty results array
      })
    );

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genNameButton = screen.getByRole("button", { name: /Generate Name/i });

    await act(async () => {
      fireEvent.click(genNameButton);
    });

    expect(global.alert).toHaveBeenCalledWith("Malformed response from username API");
  });

  test("handles network error in username generation", async () => {
    fetch.mockImplementationOnce(() => 
      Promise.reject(new Error("Network error"))
    );

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genNameButton = screen.getByRole("button", { name: /Generate Name/i });

    await act(async () => {
      fireEvent.click(genNameButton);
    });

    expect(global.alert).toHaveBeenCalledWith("Error generating username: Network error");
  });
});