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

  // Default fetch mock for randomuser API
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      results: [{ login: { username: "mockUser" } }],
    }),
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
      ok: true,
      json: async () => ({ results: [{ login: { username: "mockUser" } }] }),
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


  test("handleConfirm calls API and triggers onSuccess", async () => {
    const mockOnSuccess = jest.fn();

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ login: { username: "mockUser" } }] }),
      }) // for generateUsername
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      }); // for handleConfirm

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

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ login: { username: "mockUser" } }] }),
      }) // generateUsername
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "fail" }),
      }); // handleConfirm

    render(<AvatarUsernameGen />);
    const saveButton = screen.getByRole("button", { name: /Save New Avatar/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(window.alert).toHaveBeenCalledWith("fail");
  });
});
