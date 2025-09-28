// __tests__/ForgotPassword.test.js
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ForgotPassword from "../app/pages/forgetpassword/page"; // adjust path
import { forgotPassword } from "../app/firebase/auth";

// Mock next/image
jest.mock("next/image", () => ({ src, alt, ...props }) => (
  <img src={src} alt={alt} {...props} />
));

// Mock forgotPassword function
jest.mock("../app/firebase/auth", () => ({
  forgotPassword: jest.fn(),
}));

describe("ForgotPassword component", () => {
  const setWindowWidth = (width) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event("resize"));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders mobile layout elements", () => {
    setWindowWidth(500); // mobile
    render(<ForgotPassword />);

    expect(screen.getAllByText(/Forgot password/i).length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("GlobeTalk").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("Forgot password").length).toBeGreaterThan(0);

    const link = screen.getAllByText(/Sign In/i)[0];
    expect(link.closest("a")).toHaveAttribute("href", "/pages/signin");
  });

  test("renders desktop layout elements", () => {
    setWindowWidth(1200); // desktop
    render(<ForgotPassword />);

    expect(screen.getAllByText(/Forgot Password/i).length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("Forgot password").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("GlobeTalk").length).toBeGreaterThan(0);
  });

  test("updates email input field", () => {
    const { container } = render(<ForgotPassword />);
    // Multiple inputs exist (mobile + desktop). Pick the first one in this render scope.
    const input = within(container).getAllByPlaceholderText(/Email/i)[0];
    fireEvent.change(input, { target: { value: "test@example.com" } });
    expect(input.value).toBe("test@example.com");
  });

  test("successful form submission shows message", async () => {
    // Ensure any calls resolve
    forgotPassword.mockResolvedValue(undefined);
    const { container } = render(<ForgotPassword />);

    // Pick the first visible submit button and its associated input.
    const button = within(container).getAllByRole("button", { name: /Send Reset Email/i })[0];
    const input = within(button.closest("form") || container).getAllByPlaceholderText(/Email/i)[0];
    const scope = button.closest("section") || button.closest("form") || container;

    fireEvent.change(input, { target: { value: "user@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith("user@example.com");
      // Scope the assertion to the same section to avoid duplicate matches (mobile + desktop)
      expect(within(scope).getByText(/Password reset email sent/i)).toBeInTheDocument();
    });
    expect(input.value).toBe(""); // cleared
  });

  test("failed form submission shows error", async () => {
    // Ensure any calls reject
    forgotPassword.mockRejectedValue(new Error("User not found"));
    const { container } = render(<ForgotPassword />);

  const button = within(container).getAllByRole("button", { name: /Send Reset Email/i })[0];
  const input = within(button.closest("form") || container).getAllByPlaceholderText(/Email/i)[0];
  const scope = button.closest("section") || button.closest("form") || container;

    fireEvent.change(input, { target: { value: "wrong@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith("wrong@example.com");
      // Scope the assertion to the same section to avoid duplicate matches (mobile + desktop)
      expect(within(scope).getByText(/User not found/i)).toBeInTheDocument();
    });
  });

  test("renders both success and error branches for mobile and desktop", async () => {
    // Mobile success — target the first form explicitly
    setWindowWidth(500);
    forgotPassword.mockResolvedValueOnce(undefined);
    const mobile = render(<ForgotPassword />);
    const mobileForms = within(mobile.container).getAllByRole('form', { hidden: true });
    const mobileForm = mobileForms[0];
    const mobileInput = within(mobileForm).getByPlaceholderText(/Email/i);
    const mobileButton = within(mobileForm).getByRole('button', { name: /Send Reset Email/i });
    fireEvent.change(mobileInput, { target: { value: 'user@example.com' } });
    fireEvent.click(mobileButton);
    await waitFor(() => {
      expect(within(mobileForm.parentElement || mobile.container).getByText(/Password reset email sent/i)).toBeInTheDocument();
    });

    // Unmount to isolate, then prepare desktop rejection
    mobile.unmount();
    forgotPassword.mockRejectedValueOnce(new Error('Test error'));

    // Desktop error — target the last form explicitly
    setWindowWidth(1200);
    const desktop = render(<ForgotPassword />);
    const desktopForms = within(desktop.container).getAllByRole('form', { hidden: true });
    const desktopForm = desktopForms[desktopForms.length - 1];
    const desktopInput = within(desktopForm).getByPlaceholderText(/Email/i);
    const desktopButton = within(desktopForm).getByRole('button', { name: /Send Reset Email/i });
    fireEvent.change(desktopInput, { target: { value: 'test2@example.com' } });
    fireEvent.click(desktopButton);
    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith('test2@example.com');
      expect(within(desktopForm.parentElement || desktop.container).getByText(/Test error/i)).toBeInTheDocument();
    });
  });
});
