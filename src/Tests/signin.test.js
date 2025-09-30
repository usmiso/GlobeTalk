import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"; 
import AuthPage from "../app/pages/signin/page";
import * as auth from "../app/firebase/auth";

// Mock router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock firebase auth functions
jest.mock("../app/firebase/auth", () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signInWithGoogle: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

// Mock fetch for IP address
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock successful IP fetch by default
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ ip: '192.168.1.1' })
  });
});


describe("AuthPage Tests", () => {
  test("shows error on invalid email", async () => {
    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /sign in/i });
    fireEvent.submit(signInButtons[signInButtons.length - 1]);

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  test("switches to signup mode when clicking Sign Up", () => {
    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    expect(screen.getByRole("heading", { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  test("shows error if passwords do not match on signup", async () => {
    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Different123!" },
    });

    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    fireEvent.submit(submitButtons[submitButtons.length - 1]);

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test("toggles password visibility", () => {
    render(<AuthPage />);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const toggleButtons = screen.getAllByLabelText(/🙈/i);

    expect(passwordInput.type).toBe("password");
    fireEvent.click(toggleButtons[toggleButtons.length - 1]);
    expect(passwordInput.type).toBe("text");
    fireEvent.click(toggleButtons[toggleButtons.length - 1]);
    expect(passwordInput.type).toBe("password");
  });

  test("routes to profile on successful signin", async () => {
    auth.signIn.mockResolvedValueOnce({ user: { emailVerified: true } });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    fireEvent.submit(signInButtons[signInButtons.length - 1]);

    await new Promise((r) => setTimeout(r, 0));

    expect(mockPush).toHaveBeenCalledWith("/pages/profile");
  });

  test("routes correctly on Google sign-in", async () => {
    auth.signInWithGoogle.mockResolvedValueOnce({ isNewUser: true });

    render(<AuthPage />);
    const googleButtons = screen.getAllByText(/Sign in with Google/i);
    fireEvent.click(googleButtons[googleButtons.length - 1]);

    await new Promise((r) => setTimeout(r, 0));

    expect(mockPush).toHaveBeenCalledWith("/pages/profile");
  });

  // ✅ Notification popup test (after signup)
  test("shows notification after successful signup", async () => {
    auth.signUp.mockResolvedValueOnce({});

    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });

    await act(async () => {
      const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
      fireEvent.submit(submitButtons[submitButtons.length - 1]);
    });

    expect(await screen.findByText(/confirmation email/i)).toBeInTheDocument();
  });

  // ✅ Forgot password link test
  test("renders forgot password link in signin mode", () => {
    render(<AuthPage />);
    const forgotLinks = screen.getAllByText(/Forgot password\?/i);
    const forgotLink = forgotLinks[forgotLinks.length - 1];
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.closest("a")).toHaveAttribute(
      "href",
      "/pages/forgetpassword"
    );
  });
  test("generates strong password when generate button is clicked", async () => {
    render(<AuthPage />);

    // Switch to signup mode
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    // Find and click generate password button
    const generatePasswordBtn = screen.getByRole('button', { name: /Generate Strong Password/i });
    fireEvent.click(generatePasswordBtn);

    // Check that password and confirm password fields are filled
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    expect(passwordInput.value).toBeTruthy();
    expect(confirmPasswordInput.value).toBeTruthy();
    expect(passwordInput.value).toEqual(confirmPasswordInput.value);
    expect(passwordInput.value.length).toBeGreaterThanOrEqual(12);
  });

  test("shows error for weak password on signup", async () => {
    render(<AuthPage />);

    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "weak" }, // Too weak
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "weak" },
    });

    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    await act(async () => {
      fireEvent.submit(submitButtons[submitButtons.length - 1]);
    });

    expect(await screen.findByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
  });

  test("handles email verification requirement on signin", async () => {
    const mockUser = { emailVerified: false };
    auth.signIn.mockResolvedValueOnce({ user: mockUser });
    auth.sendEmailVerification.mockResolvedValueOnce();

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "unverified@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    await act(async () => {
      fireEvent.submit(signInButtons[signInButtons.length - 1]);
    });

    expect(await screen.findByText(/Please verify your email before signing in/i)).toBeInTheDocument();
    expect(auth.sendEmailVerification).toHaveBeenCalledWith(mockUser);
  });

  test("handles Google auth errors correctly", async () => {
    auth.signInWithGoogle.mockRejectedValueOnce({
      code: "auth/popup-closed-by-user"
    });

    render(<AuthPage />);
    const googleButtons = screen.getAllByText(/Sign in with Google/i);

    await act(async () => {
      fireEvent.click(googleButtons[googleButtons.length - 1]);
    });

    expect(await screen.findByText(/Google sign-in was closed before completion/i)).toBeInTheDocument();
  });

  test("handles various Google auth error codes", async () => {
    const errorCases = [
      { code: "auth/popup-blocked", expectedMessage: "Google sign-in popup was blocked." },
      { code: "auth/invalid-credential", expectedMessage: "Invalid credentials. Please try again." },
      { code: "auth/network-request-failed", expectedMessage: "Google sign-up failed. Please try again." },
    ];

    for (const { code, expectedMessage } of errorCases) {
      auth.signInWithGoogle.mockRejectedValueOnce({ code });
      render(<AuthPage />);

      const googleButtons = screen.getAllByText(/Sign in with Google/i);
      await act(async () => {
        fireEvent.click(googleButtons[googleButtons.length - 1]);
      });

      expect(await screen.findByText(expectedMessage)).toBeInTheDocument();

      // Cleanup for next iteration
      jest.clearAllMocks();
      render(<AuthPage />);
    }
  });

  test("handles IP fetch failure gracefully", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    auth.signIn.mockResolvedValueOnce({ user: { emailVerified: true } });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    await act(async () => {
      fireEvent.submit(signInButtons[signInButtons.length - 1]);
    });

    // Should still proceed with signin even if IP fetch fails
    expect(mockPush).toHaveBeenCalledWith("/pages/profile");
  });

  test("notification disappears after 5 seconds", async () => {
    jest.useFakeTimers();

    auth.signUp.mockResolvedValueOnce({});

    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });

    await act(async () => {
      const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
      fireEvent.submit(submitButtons[submitButtons.length - 1]);
    });

    // Notification should be visible
    expect(await screen.findByText(/confirmation email/i)).toBeInTheDocument();

    // Fast-forward timers
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Notification should be gone
    expect(screen.queryByText(/confirmation email/i)).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  test("toggles between signin and signup modes correctly", () => {
    render(<AuthPage />);

    // Initially in signin mode
    expect(screen.getByRole("heading", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Confirm Password/i)).not.toBeInTheDocument();

    // Switch to signup
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[0]); // Use the toggle button

    expect(screen.getByRole("heading", { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();

    // Switch back to signin
    const signInButtons = screen.getAllByText(/Sign In/i);
    fireEvent.click(signInButtons[0]); // Use the toggle button

    expect(screen.getByRole("heading", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Confirm Password/i)).not.toBeInTheDocument();
  });

  test("handles signup with email already in use", async () => {
    auth.signUp.mockRejectedValueOnce({
      code: "auth/email-already-in-use"
    });

    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });

    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    await act(async () => {
      fireEvent.submit(submitButtons[submitButtons.length - 1]);
    });

    expect(await screen.findByText(/This email is already in use/i)).toBeInTheDocument();
  });

  test("clears form fields after successful signup", async () => {
    auth.signUp.mockResolvedValueOnce({});

    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(emailInput, { target: { value: "newuser@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmInput, { target: { value: "Password123!" } });

    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    await act(async () => {
      fireEvent.submit(submitButtons[submitButtons.length - 1]);
    });

    // Fields should be cleared after successful signup
    expect(emailInput.value).toBe("");
    expect(passwordInput.value).toBe("");
    expect(confirmInput.value).toBe("");
  });

  test("routes to dashboard for existing Google user", async () => {
    auth.signInWithGoogle.mockResolvedValueOnce({
      isNewUser: false,
      user: { emailVerified: true }
    });

    render(<AuthPage />);
    const googleButtons = screen.getAllByText(/Sign in with Google/i);

    await act(async () => {
      fireEvent.click(googleButtons[googleButtons.length - 1]);
    });

    expect(mockPush).toHaveBeenCalledWith("/pages/dashboard");
  });

  test("handles confirm password visibility toggle", () => {
    render(<AuthPage />);

    // Switch to signup mode first
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const toggleButtons = screen.getAllByLabelText(/🙈/i);

    // Last toggle button should be for confirm password
    const confirmToggleButton = toggleButtons[toggleButtons.length - 1];

    expect(confirmPasswordInput.type).toBe("password");
    fireEvent.click(confirmToggleButton);
    expect(confirmPasswordInput.type).toBe("text");
    fireEvent.click(confirmToggleButton);
    expect(confirmPasswordInput.type).toBe("password");
  });
  test("renders mobile and desktop layouts correctly", () => {
    // Test responsive layout
    render(<AuthPage />);

    // Check mobile logo is present
    expect(screen.getByText("GlobeTalk")).toBeInTheDocument();

    // Check form elements are present
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test("homepage link has correct href", () => {
    render(<AuthPage />);

    const homeLink = screen.getByText("Go to Homepage");
    expect(homeLink.closest("a")).toHaveAttribute("href", "/");
  });
test("password generation creates valid strong password", async () => {
    render(<AuthPage />);
    
    // Switch to signup mode
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    // Find generate password button (you'll need to add this to your component)
    const generateBtn = screen.getByRole('button', { name: /Generate Strong Password/i });
    
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    
    // Test the generated password meets requirements
    expect(passwordInput.value).toBe(confirmInput.value);
    expect(passwordInput.value.length).toBe(12);
    
    // Check it contains required character types
    const generatedPassword = passwordInput.value;
    expect(generatedPassword).toMatch(/[a-z]/); // lowercase
    expect(generatedPassword).toMatch(/[A-Z]/); // uppercase  
    expect(generatedPassword).toMatch(/[0-9]/); // number
    expect(generatedPassword).toMatch(/[!@#$%^&*()_+\[\]{}|;:,.<>?]/); // special char
  });

  // LINES 78-81: Specific signup error handling
  test("handles invalid-email error during signup", async () => {
    auth.signUp.mockRejectedValueOnce({ 
      code: "auth/invalid-email" 
    });

    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });

    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    await act(async () => {
      fireEvent.submit(submitButtons[submitButtons.length - 1]);
    });

    expect(await screen.findByText(/Invalid email address/i)).toBeInTheDocument();
  });

  test("handles generic auth errors during signup", async () => {
    const errorMessage = "Generic firebase error";
    auth.signUp.mockRejectedValueOnce({ 
      code: "auth/unknown-error",
      message: errorMessage
    });

    render(<AuthPage />);
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });

    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    await act(async () => {
      fireEvent.submit(submitButtons[submitButtons.length - 1]);
    });

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  // LINES 91-96: Email verification flow
  test("resends verification email when user is not verified", async () => {
    const mockUser = { 
      emailVerified: false,
      email: "test@example.com" 
    };
    auth.signIn.mockResolvedValueOnce({ user: mockUser });
    auth.sendEmailVerification.mockResolvedValueOnce();

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    await act(async () => {
      fireEvent.submit(signInButtons[signInButtons.length - 1]);
    });

    // Should show verification error
    expect(await screen.findByText(/Please verify your email before signing in/i)).toBeInTheDocument();
    
    // Should call sendEmailVerification
    expect(auth.sendEmailVerification).toHaveBeenCalledWith(mockUser);
    
    // Should NOT redirect to profile
    expect(mockPush).not.toHaveBeenCalledWith("/pages/profile");
  });

  // LINES 104-114: Google auth error handling details
  test("handles all Google auth error codes specifically", async () => {
    const errorCases = [
      { 
        code: "auth/popup-closed-by-user", 
        expected: "Google sign-in was closed before completion." 
      },
      { 
        code: "auth/popup-blocked", 
        expected: "Google sign-in popup was blocked." 
      },
      { 
        code: "auth/invalid-credential", 
        expected: "Invalid credentials. Please try again." 
      },
      { 
        code: "auth/unauthorized-domain", 
        expected: "Google sign-up failed. Please try again." // fallback
      }
    ];

    for (const errorCase of errorCases) {
      auth.signInWithGoogle.mockRejectedValueOnce({ code: errorCase.code });

      render(<AuthPage />);
      const googleButtons = screen.getAllByText(/Sign in with Google/i);
      
      await act(async () => {
        fireEvent.click(googleButtons[googleButtons.length - 1]);
      });

      expect(await screen.findByText(errorCase.expected)).toBeInTheDocument();
      
      // Cleanup
      jest.clearAllMocks();
    }
  });

  test("handles Google auth with generic error message", async () => {
    auth.signInWithGoogle.mockRejectedValueOnce({ 
      message: "Custom error message" 
    });

    render(<AuthPage />);
    const googleButtons = screen.getAllByText(/Sign in with Google/i);
    
    await act(async () => {
      fireEvent.click(googleButtons[googleButtons.length - 1]);
    });

    expect(await screen.findByText(/Google sign-up failed. Please try again./i)).toBeInTheDocument();
  });

  // LINES 124-126: IP fetching error handling
  test("handles IP fetch network error and uses fallback", async () => {
    // Mock IP fetch failure
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    
    // But signin should still work
    auth.signIn.mockResolvedValueOnce({ user: { emailVerified: true } });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    await act(async () => {
      fireEvent.submit(signInButtons[signInButtons.length - 1]);
    });

    // Should still proceed with authentication
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/pages/profile");
    });

    // Should have attempted to get IP
    expect(global.fetch).toHaveBeenCalledWith('https://api.ipify.org?format=json');
  });

  test("handles IP fetch API response error", async () => {
    // Mock IP fetch returning error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    auth.signIn.mockResolvedValueOnce({ user: { emailVerified: true } });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    await act(async () => {
      fireEvent.submit(signInButtons[signInButtons.length - 1]);
    });

    // Should still proceed with authentication
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/pages/profile");
    });
  });

  // Additional edge case tests
  test("handles empty password generation gracefully", async () => {
    // This tests the password generation loop
    render(<AuthPage />);
    
    // The function should handle the character set selection properly
    // This is mostly covered by the first test, but we can ensure no errors
    const signUpButtons = screen.getAllByText(/Sign Up/i);
    fireEvent.click(signUpButtons[signUpButtons.length - 1]);

    const generateBtn = screen.getByRole('button', { name: /Generate Strong Password/i });
    
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    // No errors should occur during password generation
    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput.value).toBeTruthy();
  });

  test("handles signin with unverified email but verification send fails", async () => {
    const mockUser = { emailVerified: false };
    auth.signIn.mockResolvedValueOnce({ user: mockUser });
    auth.sendEmailVerification.mockRejectedValueOnce(new Error("Failed to send email"));

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    await act(async () => {
      fireEvent.submit(signInButtons[signInButtons.length - 1]);
    });

    // Should still show the verification error even if email send fails
    expect(await screen.findByText(/Please verify your email before signing in/i)).toBeInTheDocument();
  });
});

