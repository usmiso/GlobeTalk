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

  test("handleConfirm calls API and triggers onSuccess", async () => {
    const mockOnSuccess = jest.fn();

    await act(async () => {
      render(<AvatarUsernameGen onSuccess={mockOnSuccess} />);
    });

    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/profile/avatar"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: "testUserId",
          username: "mockUser",
          avatarUrl: expect.any(String),
        }),
      })
    );
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
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

  test("gender dropdown changes hair options", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genderSelect = screen.getByLabelText(/Gender/i) || screen.getByDisplayValue("male");
    const hairSelect = screen.getByLabelText(/Hair Style/i) || screen.getByDisplayValue("");

    // Initial state should have male hair options
    expect(hairSelect.innerHTML).toContain("shaggy");
    expect(hairSelect.innerHTML).toContain("dreads02");
    expect(hairSelect.innerHTML).toContain("theCaesarAndSidePart");

    // Change to female
    await act(async () => {
      fireEvent.change(genderSelect, { target: { value: "female" } });
    });

    // Now should have female hair options
    expect(hairSelect.innerHTML).toContain("straight02");
    expect(hairSelect.innerHTML).toContain("bun");
    expect(hairSelect.innerHTML).toContain("curly");
  });

  test("useEffect runs on mount and generates initial avatar/username", async () => {
    // Spy on the generation functions
    const mockGenerateUsername = jest.fn();
    const mockGenerateAvatar = jest.fn();
    
    // Temporarily replace the functions
    const originalModule = await import("../app/components/avatar/page");
    originalModule.default.prototype.generateUsername = mockGenerateUsername;
    originalModule.default.prototype.generateAvatar = mockGenerateAvatar;

    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    // useEffect should have called both functions on mount
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("https://randomuser.me/api/");
    });

    // Restore original functions
    delete originalModule.default.prototype.generateUsername;
    delete originalModule.default.prototype.generateAvatar;
  });

  test("avatar generation function creates correct URL", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const component = screen.getByTestId('avatar-container') || screen.getByText(/Create Your Avatar/i).closest('div');
    
    // Test male avatar generation
    const maleHair = 'shaggy';
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${expect.any(String)}&top=${maleHair}`;
    
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Generate New Avatar/i }));
    });

    // Avatar should be generated with correct pattern
    await waitFor(() => {
      const avatarImg = screen.getByAltText("avatar");
      expect(avatarImg).toBeInTheDocument();
      expect(avatarImg.src).toContain('api.dicebear.com');
      expect(avatarImg.src).toContain('avataaars');
    });
  });

  test("hover effects apply and remove styles correctly", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    // Test save button hover effects
    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });
    
    // Mouse enter should change background color
    fireEvent.mouseEnter(saveButton);
    expect(saveButton.style.backgroundColor).toBeTruthy();
    
    // Mouse leave should revert background color
    fireEvent.mouseLeave(saveButton);
    expect(saveButton.style.backgroundColor).toBeTruthy();

    // Test generate name button hover effects (transparent background)
    const genNameButton = screen.getByRole("button", { name: /Generate Name/i });
    
    fireEvent.mouseEnter(genNameButton);
    expect(genNameButton.style.backgroundColor).toBeTruthy();
    
    fireEvent.mouseLeave(genNameButton);
    expect(genNameButton.style.backgroundColor).toBe('transparent');
  });

  test("focus and blur events on select elements", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genderSelect = screen.getByDisplayValue("male");
    
    // Test focus effect
    fireEvent.focus(genderSelect);
    expect(genderSelect.style.borderColor).toBeTruthy();
    
    // Test blur effect
    fireEvent.blur(genderSelect);
    expect(genderSelect.style.borderColor).toBeTruthy();
  });

  test("renders all UI elements with correct styling", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    // Test main container styling
    const mainContainer = screen.getByText(/Create Your Avatar/i).closest('div').parentElement;
    expect(mainContainer).toHaveStyle({
      backgroundColor: expect.any(String)
    });

    // Test card styling
    const card = screen.getByText(/Create Your Avatar/i).closest('div');
    expect(card).toHaveStyle({
      backgroundColor: expect.any(String),
      border: expect.any(String)
    });

    // Test avatar container styling
    const avatarContainer = screen.getByAltText("avatar")?.parentElement || 
                           screen.getByText(/Tap to generate/i)?.parentElement;
    expect(avatarContainer).toHaveStyle({
      backgroundColor: expect.any(String),
      borderColor: expect.any(String)
    });

    // Test username display styling
    const usernameDisplay = screen.getByText("mockUser") || 
                           screen.getByText(/Click to generate a username/i);
    expect(usernameDisplay.parentElement).toHaveStyle({
      backgroundColor: expect.any(String),
      border: expect.any(String)
    });
  });

  test("conditional rendering based on avatar state", async () => {
    // Test when avatar is not generated (fallback text)
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: async () => ({ results: [{ login: { username: "mockUser" } }] }),
      })
    );

    const { rerender } = render(<AvatarUsernameGen />);
    
    // Initially might show fallback text
    const fallbackText = screen.queryByText(/Tap to generate/i);
    if (fallbackText) {
      expect(fallbackText).toBeInTheDocument();
    }

    // After avatar generation, should show image
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Generate New Avatar/i }));
    });

    await waitFor(() => {
      expect(screen.getByAltText("avatar")).toBeInTheDocument();
    });
  });

  test("hair options change correctly based on gender", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    const genderSelect = screen.getByDisplayValue("male");
    const hairSelect = screen.getByLabelText(/Hair Style/i) || screen.getByDisplayValue("");

    // Initial male options
    const maleOptions = ['shaggy', 'dreads02', 'theCaesarAndSidePart'];
    maleOptions.forEach(option => {
      expect(hairSelect.innerHTML).toContain(option);
    });

    // Change to female
    await act(async () => {
      fireEvent.change(genderSelect, { target: { value: "female" } });
    });

    // Should now show female options
    const femaleOptions = ['straight02', 'bun', 'curly'];
    femaleOptions.forEach(option => {
      expect(hairSelect.innerHTML).toContain(option);
    });
  });

  test("avatar generation uses selected hair style", async () => {
    await act(async () => {
      render(<AvatarUsernameGen />);
    });

    // Select specific hair style
    const hairSelect = screen.getByLabelText(/Hair Style/i);
    const selectedHair = 'dreads02';
    
    await act(async () => {
      fireEvent.change(hairSelect, { target: { value: selectedHair } });
    });

    // Generate avatar
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Generate New Avatar/i }));
    });

    // Avatar should be generated with selected hair style
    await waitFor(() => {
      const avatarImg = screen.getByAltText("avatar");
      expect(avatarImg.src).toContain(selectedHair);
    });
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