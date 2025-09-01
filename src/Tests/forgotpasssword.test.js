import { render, screen, fireEvent, act } from "@testing-library/react";
import ForgotPassword from "../app/pages/forgetpassword/page";
import * as auth from "../app/firebase/auth";
import React from "react";
import { useRouter } from "next/navigation";

// Mock the forgotPassword function
jest.mock("../app/firebase/auth", () => ({
  forgotPassword: jest.fn(),
}));

// Mock Next.js Link, Image, and useRouter
const MockLink = ({ children, href }) => <a href={href}>{children}</a>;
MockLink.displayName = "MockLink";
jest.mock("next/link", () => MockLink);

const MockImage = (props) => {
  const { priority, ...rest } = props; // remove priority to avoid React warning
  return <img {...rest} alt={props.alt} />;
};
MockImage.displayName = "MockImage";
jest.mock("next/image", () => MockImage);
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Create push mock
const pushMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({
    push: pushMock,
  });
});

describe("ForgotPassword Component", () => {
  test("renders form elements correctly", () => {
    render(<ForgotPassword />);
    const emailInputs = screen.getAllByPlaceholderText(/Email/i);
    const rememberLinks = screen.getAllByText(/Remember your password\?/i);

    expect(emailInputs[emailInputs.length - 1]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Send Reset Email/i })[0]).toBeInTheDocument();
    expect(rememberLinks[rememberLinks.length - 1]).toBeInTheDocument();
  });

  test("updates email state on input change", () => {
    render(<ForgotPassword />);
    const emailInputs = screen.getAllByPlaceholderText(/Email/i);
    const emailInput = emailInputs[emailInputs.length - 1];

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });

  test("calls forgotPassword and shows success message", async () => {
    auth.forgotPassword.mockResolvedValueOnce({});
    render(<ForgotPassword />);

    const emailInputs = screen.getAllByPlaceholderText(/Email/i);
    const emailInput = emailInputs[emailInputs.length - 1];

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });

    await act(async () => {
      const buttons = screen.getAllByRole("button", { name: /Send Reset Email/i });
      fireEvent.click(buttons[buttons.length - 1]); // click the last button
    });

    expect(auth.forgotPassword).toHaveBeenCalledWith("user@example.com");

    const successMessages = await screen.findAllByText(/Password reset email sent/i);
    expect(successMessages[successMessages.length - 1]).toBeInTheDocument(); // pick last
    expect(emailInput.value).toBe(""); // Input cleared after success
  });

  test("shows error message if forgotPassword fails", async () => {
    auth.forgotPassword.mockRejectedValueOnce(new Error("Failed to send email"));
    render(<ForgotPassword />);

    const emailInputs = screen.getAllByPlaceholderText(/Email/i);
    const emailInput = emailInputs[emailInputs.length - 1];

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });

    await act(async () => {
      const buttons = screen.getAllByRole("button", { name: /Send Reset Email/i });
      fireEvent.click(buttons[buttons.length - 1]); // click the last button
    });

    expect(auth.forgotPassword).toHaveBeenCalledWith("user@example.com");

    const errorMessages = await screen.findAllByText(/Failed to send email/i);
    expect(errorMessages[errorMessages.length - 1]).toBeInTheDocument(); // pick last
  });

  test("renders Sign In link correctly", () => {
    render(<ForgotPassword />);
    const signInLinks = screen.getAllByText(/Sign In/i);

    const signInLink = signInLinks[signInLinks.length - 1];
    expect(signInLink.closest("a")).toHaveAttribute("href", "/pages/signin");
  });
});

