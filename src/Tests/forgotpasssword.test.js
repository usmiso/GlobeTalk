// __tests__/ForgotPassword.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    render(<ForgotPassword />);
    const input = screen.getByPlaceholderText(/Email/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });
    expect(input.value).toBe("test@example.com");
  });

  test("successful form submission shows message", async () => {
    forgotPassword.mockResolvedValueOnce();
    render(<ForgotPassword />);

    const input = screen.getByPlaceholderText(/Email/i);
    const button = screen.getByRole("button", { name: /Send Reset Email/i });

    fireEvent.change(input, { target: { value: "user@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith("user@example.com");
      expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument();
      expect(input.value).toBe(""); // cleared
    });
  });

  test("failed form submission shows error", async () => {
    forgotPassword.mockRejectedValueOnce(new Error("User not found"));
    render(<ForgotPassword />);

    const input = screen.getByPlaceholderText(/Email/i);
    const button = screen.getByRole("button", { name: /Send Reset Email/i });

    fireEvent.change(input, { target: { value: "wrong@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith("wrong@example.com");
      expect(screen.getByText(/User not found/i)).toBeInTheDocument();
    });
  });

  test("renders both success and error branches for mobile and desktop", async () => {
    // Mobile success
    setWindowWidth(500);
    forgotPassword.mockResolvedValueOnce();
    render(<ForgotPassword />);
    const inputMobile = screen.getByPlaceholderText(/Email/i);
    const buttonMobile = screen.getByRole("button", { name: /Send Reset Email/i });
    fireEvent.change(inputMobile, { target: { value: "user@example.com" } });
    fireEvent.click(buttonMobile);
    await waitFor(() => {
      expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument();
    });

    // Desktop error
    setWindowWidth(1200);
    forgotPassword.mockRejectedValueOnce(new Error("Test error"));
    render(<ForgotPassword />);
    const inputDesktop = screen.getByPlaceholderText(/Email/i);
    const buttonDesktop = screen.getByRole("button", { name: /Send Reset Email/i });
    fireEvent.change(inputDesktop, { target: { value: "test2@example.com" } });
    fireEvent.click(buttonDesktop);
    await waitFor(() => {
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    });
  });
});
