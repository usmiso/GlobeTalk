// src/Tests/AvatarUsernameGen.test.js
import { render, screen, fireEvent, act } from "@testing-library/react";
import AvatarUsernameGen from "../app/components/avatar/page";
import { auth } from "../app/firebase/auth";

// Mock next/router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock auth
jest.mock("../app/firebase/auth", () => ({
  auth: { currentUser: { uid: "testUserId" } },
}));

// Mock global fetch
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // Default fetch mock for tests that don't override it
  fetch.mockResolvedValue({
    json: async () => ({
      results: [{ login: { username: "mockUser" } }],
    }),
    ok: true,
  });
  window.alert = jest.fn();
});

describe("AvatarUsernameGen Component", () => {
  test("renders correctly with default elements", () => {
    render(<AvatarUsernameGen />);
    
    expect(screen.getByText(/Create Your Avatar/i)).toBeInTheDocument();
    expect(screen.getByText(/Generated Username/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate New Avatar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate Name/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save New Avatar/i })).toBeInTheDocument();
  });

  test("generates a username and updates state", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        results: [{ login: { username: "mockUser" } }],
      }),
    });

    render(<AvatarUsernameGen />);
    const genNameButton = screen.getByRole("button", { name: /Generate Name/i });

    await act(async () => {
      fireEvent.click(genNameButton);
    });

    expect(await screen.findByText("mockUser")).toBeInTheDocument();
  });

  test("generates avatar and updates state", () => {
    render(<AvatarUsernameGen />);
    const genAvatarButton = screen.getByRole("button", { name: /Generate New Avatar/i });
    
    const avatarBefore = screen.queryByAltText("avatar")?.src;
    
    fireEvent.click(genAvatarButton);
    
    const avatarAfter = screen.queryByAltText("avatar")?.src;
    expect(avatarAfter).not.toBe(avatarBefore);
  });

  test("updates hair options when gender changes", () => {
    render(<AvatarUsernameGen />);
    // If this fails, ensure the <label> for Gender uses htmlFor or aria-labelledby on the <select> in the component
    const genderSelect = screen.getByLabelText(/Gender/i);
    fireEvent.change(genderSelect, { target: { value: "female" } });
    const hairSelect = screen.getByLabelText(/Hair Style/i);
    const hairOptions = Array.from(hairSelect.options).map(opt => opt.value);
    expect(hairOptions).toEqual(expect.arrayContaining(["straight02", "bun", "curly"]));
  });

  test("handleConfirm calls API and triggers onSuccess", async () => {
    const mockOnSuccess = jest.fn();
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<AvatarUsernameGen onSuccess={mockOnSuccess} />);

    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/profile/avatar"),
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      })
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  test("handleConfirm alerts if user not logged in", async () => {
    auth.currentUser = null;
    window.alert = jest.fn();

    render(<AvatarUsernameGen />);
    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(window.alert).toHaveBeenCalledWith("User not logged in");

    // Reset currentUser
    auth.currentUser = { uid: "testUserId" };
  });

  test("handleConfirm alerts if API fails", async () => {
    window.alert = jest.fn();
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "fail" }) });

    render(<AvatarUsernameGen />);
    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // If this fails, check the error handling in the component. It should call alert with the error message from the API response.
    expect(window.alert).toHaveBeenCalledWith("fail");
  });
});
