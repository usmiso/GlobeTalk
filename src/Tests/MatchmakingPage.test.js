import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MatchmakingPage from "../app/pages/matchmaking/page"; // adjust path
import { auth } from "../app/firebase/auth";

jest.mock("../app/firebase/auth", () => ({
  auth: {
    currentUser: { uid: "user123" }
  }
}));

// Mock the languages list
jest.mock("../../public/assets/languages.js", () => ({
  EN: { name: "English", nativeName: "English" },
  FR: { name: "French", nativeName: "Français" }
}));

const mockTimezones = [
  { value: "UTC-05", text: "(UTC-05:00) Eastern Time" },
  { value: "UTC+01", text: "(UTC+01:00) Central European Time" }
];

describe("MatchmakingPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders timezone and language inputs", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTimezones
    });

    render(<MatchmakingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search timezone...")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search language...")).toBeInTheDocument();
    });
  });

  it("handles timezone fetch failure", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<MatchmakingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search timezone...")).toBeInTheDocument();
      // Timezone select should still render with only default option
      const select = screen.getByRole("combobox", { name: /Timezone/i });
      expect(select.children.length).toBe(1);
    });
  });

  it("disables 'Find Match' button when timezone or language is missing", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTimezones
    });

    render(<MatchmakingPage />);

    await waitFor(() => screen.getByText("(UTC-05:00) Eastern Time"));

    const button = screen.getByText("Find Match");
    expect(button).toBeDisabled();

    // Select timezone only
    fireEvent.change(screen.getByRole("combobox", { name: /Timezone/i }), {
      target: { value: "(UTC-05:00) Eastern Time" }
    });
    expect(button).toBeDisabled();

    // Select language only
    fireEvent.change(screen.getByRole("combobox", { name: /Timezone/i }), {
      target: { value: "" }
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Language/i }), {
      target: { value: "English" }
    });
    expect(button).toBeDisabled();
  });

  it("handles successful matchmaking API call", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimezones
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "match123", name: "Matched User" })
      });

    render(<MatchmakingPage />);

    await waitFor(() => screen.getByText("(UTC-05:00) Eastern Time"));

    fireEvent.change(screen.getByRole("combobox", { name: /Timezone/i }), {
      target: { value: "(UTC-05:00) Eastern Time" }
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Language/i }), {
      target: { value: "English" }
    });

    const button = screen.getByText("Find Match");
    fireEvent.click(button);

    await waitFor(() => screen.getByText("Matched User"));
    expect(screen.getByText("Matched User")).toBeInTheDocument();
    expect(screen.getByText(/match123/)).toBeInTheDocument();
  });

  it("handles API error during matchmaking", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimezones
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "No match found" })
      });

    render(<MatchmakingPage />);

    await waitFor(() => screen.getByText("(UTC-05:00) Eastern Time"));

    fireEvent.change(screen.getByRole("combobox", { name: /Timezone/i }), {
      target: { value: "(UTC-05:00) Eastern Time" }
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Language/i }), {
      target: { value: "English" }
    });

    fireEvent.click(screen.getByText("Find Match"));

    await waitFor(() => screen.getByText("No match found"));
    expect(screen.getByText("No match found")).toBeInTheDocument();
  });

  it("renders nothing when match is null initially", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTimezones
    });

    render(<MatchmakingPage />);
    await waitFor(() => screen.getByText("(UTC-05:00) Eastern Time"));

    expect(screen.queryByText("Matched User")).not.toBeInTheDocument();
  });
});