// src/Tests/Profile.extra2.test.js
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Profile from "../app/pages/profile/page";
import { auth } from "../app/firebase/auth";

// Mock router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Firebase auth
jest.mock("../app/firebase/auth", () => ({
  auth: { currentUser: { uid: "user123" } },
}));

// Mock languages
jest.mock("../../public/assets/languages.js", () => ({
  en: { name: "English", nativeName: "English" },
  fr: { name: "French", nativeName: "Français" },
  es: { name: "Spanish", nativeName: "Español" },
}));

// Mock geonames timezones
jest.mock("../../public/assets/geonames_timezone.json", () => [
  { timezone_id: "America/New_York", country_code: "US", gmt_offset: -5 },
  { timezone_id: "Europe/Paris", country_code: "FR", gmt_offset: 1 },
  { timezone_id: "Asia/Tokyo", country_code: "JP", gmt_offset: 9 },
]);

// Mock AvatarUsernameGen
function MockAvatarUsernameGen({ onSuccess }) {
  return (
    <div data-testid="avatar-generator">
      <button onClick={() => onSuccess({ avatarUrl: "gen.png", username: "genUser" })}>
        Generate Avatar
      </button>
    </div>
  );
}
jest.mock("../app/components/avatar/page", () => ({
  __esModule: true,
  default: MockAvatarUsernameGen,
}));

// Mock LoadingScreen
jest.mock("../app/components/LoadingScreen", () => () => <div>Loading...</div>);

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  auth.currentUser = { uid: "user123" }; // Reset auth state
});

describe("Profile Page - Additional Coverage", () => {
  test("displays hobby validation error for spaces", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));

    const hobbyInput = screen.getByPlaceholderText(/type a hobby/i);
    fireEvent.change(hobbyInput, { target: { value: "bad hobby" } });
    fireEvent.keyDown(hobbyInput, { key: "Enter", code: "Enter" });

    expect(await screen.findByText(/hobby tags must be one word/i)).toBeInTheDocument();
  });

  test("handles unauthenticated user on submit", async () => {
    auth.currentUser = null;
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<Profile />);
    
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/short intro/i), { target: { value: "Hi" } });
    fireEvent.change(screen.getByLabelText(/age range/i), { target: { value: "18-24" } });
    
    const hobbyInput = screen.getByPlaceholderText(/type a hobby/i);
    fireEvent.change(hobbyInput, { target: { value: "reading" } });
    fireEvent.keyDown(hobbyInput, { key: "Enter" });

    fireEvent.click(screen.getByText(/save profile/i));
    expect(await screen.findByText(/user not authenticated/i)).toBeInTheDocument();
  });

  test("selects timezone from dropdown and updates country", async () => {
    const csvText = "US,United States\nFR,France\nJP,Japan";
    fetch.mockResolvedValueOnce({ ok: true, text: async () => csvText });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));

    await waitFor(() => {
      const tzInput = screen.getByPlaceholderText(/type timezone/i);
      expect(tzInput).toBeInTheDocument();
    });

    const tzInput = screen.getByPlaceholderText(/type timezone/i);
    fireEvent.change(tzInput, { target: { value: "America" } });
    fireEvent.focus(tzInput);

    await waitFor(() => {
      const option = screen.getByText(/America\/New_York/);
      fireEvent.mouseDown(option);
    });

    expect(tzInput.value).toContain("America/New_York");
  });

  test("handles CSV fetch error gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("CSV fetch failed"));
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText(/generate avatar/i)).toBeInTheDocument();
    });
  });

  test("handles profile fetch error and shows avatar mode", async () => {
    fetch.mockRejectedValueOnce(new Error("Profile fetch failed"));
    
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText(/generate avatar/i)).toBeInTheDocument();
    });
  });

  test("handles profile with existing data correctly", async () => {
    const mockProfile = {
      intro: "Hello world",
      ageRange: "25-34",
      hobbies: ["reading", "coding"],
      timezone: "Europe/Paris",
      languageCode: "fr",
      avatarUrl: "avatar.jpg",
      username: "testuser",
    };
    
    fetch.mockResolvedValueOnce({ ok: true, text: async () => "FR,France" });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockProfile });
    
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText("testuser")).toBeInTheDocument();
      expect(screen.getByText("Hello world")).toBeInTheDocument();
      expect(screen.getByText("reading")).toBeInTheDocument();
      expect(screen.getByText("coding")).toBeInTheDocument();
    });
  });

  test("navigates between modes correctly", async () => {
    const mockProfile = {
      intro: "Test",
      ageRange: "25-34",
      hobbies: ["reading"],
      timezone: "Europe/Paris",
      languageCode: "en",
      avatarUrl: "avatar.jpg",
      username: "testuser",
    };
    
    fetch.mockResolvedValueOnce({ ok: true, text: async () => "FR,France" });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockProfile });
    
    render(<Profile />);
    
    // Should start in view mode
    await waitFor(() => {
      expect(screen.getByText("Edit Avatar")).toBeInTheDocument();
    });
    
    // Test navigation to edit profile
    fireEvent.click(screen.getByText("Edit Profile"));
    await waitFor(() => {
      expect(screen.getByText("Save Profile")).toBeInTheDocument();
    });
    
    // Test navigation to avatar editor
    fireEvent.click(screen.getByText("Edit Avatar"));
    await waitFor(() => {
      expect(screen.getByTestId("avatar-generator")).toBeInTheDocument();
    });
  });

  test("handles dashboard navigation", async () => {
    const mockProfile = {
      intro: "Test",
      ageRange: "25-34",
      hobbies: ["reading"],
      timezone: "Europe/Paris",
      languageCode: "en",
    };
    
    fetch.mockResolvedValueOnce({ ok: true, text: async () => "FR,France" });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockProfile });
    
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Go to Dashboard"));
    expect(mockPush).toHaveBeenCalledWith("/pages/dashboard");
  });

  test("validates all required fields on submit", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));
    
    // Try to submit without filling any fields
    fireEvent.click(screen.getByText(/save profile/i));
    
    expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument();
  });

  test("handles hobby removal correctly", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));
    
    // Add a hobby
    const hobbyInput = screen.getByPlaceholderText(/type a hobby/i);
    fireEvent.change(hobbyInput, { target: { value: "reading" } });
    fireEvent.keyDown(hobbyInput, { key: "Enter" });
    
    // Remove the hobby
    const removeButton = screen.getByText("×");
    fireEvent.click(removeButton);
    
    expect(screen.queryByText("reading")).not.toBeInTheDocument();
  });

  test("handles API error on profile save", async () => {
    // CSV
    fetch.mockResolvedValueOnce({ ok: true, text: async () => "FR,France" });
    // Profile GET
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // Profile POST (fails)
    fetch.mockResolvedValueOnce({ 
      ok: false, 
      json: async () => ({ error: "Server error" }) 
    });
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));
    
  // Fill required fields
    fireEvent.change(screen.getByLabelText(/short intro/i), { target: { value: "Hi" } });
    fireEvent.change(screen.getByLabelText(/age range/i), { target: { value: "18-24" } });
    
    const hobbyInput = screen.getByPlaceholderText(/type a hobby/i);
    fireEvent.change(hobbyInput, { target: { value: "reading" } });
    fireEvent.keyDown(hobbyInput, { key: "Enter" });
  // Also set timezone and language so validation passes
  const tzInput = screen.getByPlaceholderText(/type timezone/i);
  fireEvent.change(tzInput, { target: { value: "Europe/Paris" } });
  const langInput = screen.getByPlaceholderText(/type language/i);
  fireEvent.change(langInput, { target: { value: "en" } });
    
    fireEvent.click(screen.getByText(/save profile/i));
    
  const err = await screen.findByText(/server error|failed to (save profile|connect to server)/i);
  expect(err).toBeInTheDocument();
  });

  test("handles network error on profile save", async () => {
    // CSV
    fetch.mockResolvedValueOnce({ ok: true, text: async () => "FR,France" });
    // Profile GET
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // Profile POST (network error)
    fetch.mockRejectedValueOnce(new Error("Network error"));
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));
    
  // Fill required fields
    fireEvent.change(screen.getByLabelText(/short intro/i), { target: { value: "Hi" } });
    fireEvent.change(screen.getByLabelText(/age range/i), { target: { value: "18-24" } });
    
    const hobbyInput = screen.getByPlaceholderText(/type a hobby/i);
    fireEvent.change(hobbyInput, { target: { value: "reading" } });
    fireEvent.keyDown(hobbyInput, { key: "Enter" });
  // Also set timezone and language so validation passes
  const tzInput2 = screen.getByPlaceholderText(/type timezone/i);
  fireEvent.change(tzInput2, { target: { value: "Europe/Paris" } });
  const langInput2 = screen.getByPlaceholderText(/type language/i);
  fireEvent.change(langInput2, { target: { value: "en" } });
    
    fireEvent.click(screen.getByText(/save profile/i));
    
    expect(await screen.findByText(/failed to connect to server/i)).toBeInTheDocument();
  });

  test("filters languages correctly", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));
    
    const langInput = screen.getByPlaceholderText(/type language/i);
    fireEvent.change(langInput, { target: { value: "French" } });
    fireEvent.focus(langInput);
    
    await waitFor(() => {
      expect(screen.getByText(/French/)).toBeInTheDocument();
      expect(screen.queryByText(/English/)).not.toBeInTheDocument();
    });
  });

  test("handles timezone display without country map", async () => {
    fetch.mockResolvedValueOnce({ ok: false }); // CSV fetch fails
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));
    
    const tzInput = screen.getByPlaceholderText(/type timezone/i);
    fireEvent.change(tzInput, { target: { value: "Test/Timezone" } });
    
    expect(tzInput.value).toBe("Test/Timezone");
  });
});


describe("Profile Page - Remaining Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    auth.currentUser = { uid: "user123" };
  });

  test("covers country CSV with malformed lines", async () => {
    const malformedCSV = "US,United States\nFR\nDE,Germany,Europe"; // FR line malformed
    fetch.mockResolvedValueOnce({ ok: true, text: async () => malformedCSV });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText(/generate avatar/i)).toBeInTheDocument();
    });
  });

  test("covers timezone display fallback when timezone not found", async () => {
    // Test the getTimezoneDisplay function when timezone_id is not found
    fetch.mockResolvedValueOnce({ ok: true, text: async () => "US,United States" });
    const mockProfile = {
      intro: "Test",
      ageRange: "25-34",
      hobbies: ["reading"],
      timezone: "Non/Existent/Timezone",
      languageCode: "en",
    };
    fetch.mockResolvedValueOnce({ ok: true, json: async () => mockProfile });
    
    render(<Profile />);
    
    await waitFor(() => {
      // Should display the timezone ID directly when not found
      expect(screen.getByText("Non/Existent/Timezone")).toBeInTheDocument();
    });
  });

  test("covers empty string handling in form validation", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    render(<Profile />);
    await waitFor(() => screen.getByText(/generate avatar/i));
    fireEvent.click(screen.getByText(/generate avatar/i));
    
    // Try to submit with empty strings instead of null/undefined
    fireEvent.change(screen.getByLabelText(/short intro/i), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/age range/i), { target: { value: "" } });
    
    fireEvent.click(screen.getByText(/save profile/i));
    
    expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument();
  });

  
});