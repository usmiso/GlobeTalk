import { render, screen, fireEvent, act } from "@testing-library/react"; 
import AuthPage from "../app/pages/signin/page";
import * as auth from "../app/firebase/auth";

// Mock router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Remove old mockSignIn, use auth.signIn directly
jest.mock("../app/firebase/auth", () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
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
});



