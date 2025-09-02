// src/Tests/Profile.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../app/pages/profile/page";
import { auth } from "../app/firebase/auth";

// Mock next/router
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock Firebase auth
jest.mock("../app/firebase/auth", () => ({
  auth: {
    currentUser: { uid: "user123" },
  },
}));

// Mock languages list (don’t import from public/)
jest.mock("../../public/assets/languages.js", () => ({
  en: { name: "English", nativeName: "English" },
  fr: { name: "French", nativeName: "Français" },
}));

// Mock AvatarUsernameGen component
jest.mock("../app/components/avatar/page", () => (props) => (
  <div data-testid="avatar-generator">
    <button onClick={props.onSuccess}>Generate Avatar</button>
  </div>
));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("Profile Page", () => {
  test("shows loading initially", () => {
    render(<Profile />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("renders avatar generator if no profile exists", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<Profile />);
    await waitFor(() => {
      expect(screen.getByTestId("avatar-generator")).toBeInTheDocument();
    });
  });

  test("switches to editProfile after avatar generation", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

  render(<Profile />);
  const generateButton = await screen.findByText(/generate avatar/i);
  fireEvent.click(generateButton);

  expect(screen.getAllByText(/profile/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/save profile/i)).toBeInTheDocument();
  });

  test("renders viewProfile if profile exists", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intro: "Hello!",
        ageRange: "25-34",
        hobbies: ["reading"],
        timezone: "GMT+2",
        language: "en",
        avatarUrl: "avatar.png",
        username: "testuser",
      }),
    });

    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Hello!")).toBeInTheDocument();
      expect(screen.getByText("25-34")).toBeInTheDocument();
      expect(screen.getByText("reading")).toBeInTheDocument();
      expect(screen.getByText("testuser")).toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute("src", "avatar.png");
    });
  });

  test("can add and remove hobbies in edit mode", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<Profile />);
    fireEvent.click(await screen.findByText(/generate avatar/i));

    const hobbyInput = screen.getByPlaceholderText(/type a hobby/i);
    fireEvent.change(hobbyInput, { target: { value: "gaming" } });
    fireEvent.keyDown(hobbyInput, { key: "Enter", code: "Enter" });

    expect(screen.getByText("gaming")).toBeInTheDocument();

    const removeButton = screen.getByText("×");
    fireEvent.click(removeButton);
    expect(screen.queryByText("gaming")).not.toBeInTheDocument();
  });

  test("shows error if required fields missing on submit", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<Profile />);
    fireEvent.click(await screen.findByText(/generate avatar/i));

    const saveButton = screen.getByText(/save profile/i);
  fireEvent.click(saveButton);

  expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument();
  });

  test("submits form successfully", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // fetch profile
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // post profile

    render(<Profile />);
    fireEvent.click(await screen.findByText(/generate avatar/i));

  // Fill form
  const introTextarea = screen.getAllByRole('textbox')[0];
  fireEvent.change(introTextarea, { target: { value: 'Hi!' } });
    fireEvent.change(screen.getByLabelText(/age range/i), { target: { value: '18-24' } });
    const hobbyInput = screen.getByPlaceholderText(/type a hobby/i);
    fireEvent.change(hobbyInput, { target: { value: 'reading' } });
    fireEvent.keyDown(hobbyInput, { key: 'Enter', code: 'Enter' });

    fireEvent.change(screen.getByLabelText(/region/i), { target: { value: 'GMT+2' } });
    fireEvent.change(screen.getByLabelText(/language/i), { target: { value: 'en' } });

    fireEvent.click(screen.getByText(/save profile/i));

    await waitFor(() => {
      expect(screen.getByText(/edit avatar/i)).toBeInTheDocument();
      expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
    });
  });

  test("navigates to dashboard from viewProfile", async () => {
    const mockPush = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: mockPush });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intro: "Hello!",
        ageRange: "25-34",
        hobbies: ["reading"],
        timezone: "GMT+2",
        language: "en",
        avatarUrl: "avatar.png",
        username: "testuser",
      }),
    });

    render(<Profile />);
    await waitFor(() => screen.getByText(/go to dashboard/i));
    fireEvent.click(screen.getByText(/go to dashboard/i));
    expect(mockPush).toHaveBeenCalledWith("/pages/dashboard");
  });
});
