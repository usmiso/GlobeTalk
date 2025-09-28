import { render, screen, waitFor, fireEvent, within, act } from "@testing-library/react";
import UserProfile from "../app/pages/userprofile/page";

// Mock Navbar to avoid unrelated complexity (use relative path to avoid alias issues)
jest.mock("../app/components/Navbar", () => () => <div data-testid="navbar" />);

// Mock next/navigation useRouter to avoid App Router invariant
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock auth export from local module to provide currentUser
jest.mock("../app/firebase/auth", () => ({
  auth: { currentUser: { uid: "user-123" } },
}));

// Mock onAuthStateChanged from firebase/auth to immediately provide a user
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((_auth, cb) => {
    cb({ uid: "user-123" });
    return () => {};
  }),
}));

// Shared fetch mock
const mockTimezones = [
  { value: "(GMT+02:00) Africa/Johannesburg", text: "(GMT+02:00) Africa/Johannesburg", timezone_id: "Africa/Johannesburg", country_code: "ZA" },
  { value: "(GMT+01:00) Europe/Paris", text: "(GMT+01:00) Europe/Paris", timezone_id: "Europe/Paris", country_code: "FR" },
];

const mockProfile = {
  intro: "Hello there!",
  ageRange: "25 - 34",
  hobbies: ["Reading", "Gaming"],
  timezone: "Africa/Johannesburg",
  language: ["English", "Zulu"],
  sayings: ["Howzit"],
  username: "witty-wildebeest",
  avatarUrl: "https://example.com/avatar.svg",
  favorites: "Pizza",
  facts: "I love coding",
  country: "South Africa",
};

describe("UserProfile page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Global fetch mock per URL
    const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000';
    global.fetch = jest.fn((url, options) => {
      const u = typeof url === "string" ? url : url.url;
      if (u.includes("/assets/timezones.json")) {
        return Promise.resolve({ ok: true, json: async () => mockTimezones });
      }
      if (u.startsWith("https://restcountries.com")) {
        // Return languages map shape
        return Promise.resolve({
          ok: true,
          json: async () => [
            { languages: { eng: "English", fra: "French" } },
            { languages: { zul: "Zulu" } },
          ],
        });
      }
      if (u.startsWith(`${API_BASE}/api/profile`) && (!options || options.method === undefined)) {
        // GET profile
        return Promise.resolve({ ok: true, json: async () => mockProfile });
      }
      if ((u === `${API_BASE}/api/profile` || u.endsWith('/api/profile')) && options && options.method === "POST") {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      // default fallback
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders after auth and populates profile fields", async () => {
    render(<UserProfile />);
    // Flush the 500ms delay in component before it fetches profile
    await act(async () => { jest.advanceTimersByTime(600); });

    // Wait for username to appear (after profile fetched)
    expect(await screen.findByText(mockProfile.username)).toBeInTheDocument();

    // Bio textarea should have the intro value
    const bio = screen.getByPlaceholderText(/Write something about yourself/i);
    expect(bio).toHaveValue(mockProfile.intro);

    // Age range select reflects value (no explicit label; pick first select)
    const selects = screen.getAllByRole("combobox");
    const ageSelect = selects[0];
    expect(ageSelect).toHaveValue(mockProfile.ageRange);

    // Languages chips rendered (ignore select options)
    for (const lang of mockProfile.language) {
      const nodes = screen.getAllByText(lang);
      const chip = nodes.find((n) => n.tagName.toLowerCase() !== 'option');
      expect(chip).toBeTruthy();
    }

    // Hobbies chips rendered (ignore select options)
    for (const hobby of mockProfile.hobbies) {
      const nodes = screen.getAllByText(hobby);
      const chip = nodes.find((n) => n.tagName.toLowerCase() !== 'option');
      expect(chip).toBeTruthy();
    }
  });

  test("can add and remove a language chip", async () => {
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    await screen.findByText(mockProfile.username);

    // Wait until languages have been loaded and 'French' is an available option
    const selects = screen.getAllByRole("combobox");
    const languagesSelect = selects[1];
    await waitFor(() => {
      // ensure the option exists before changing value
      expect(screen.queryByText("French")).toBeTruthy();
    });
    // Select a new language from languages dropdown
    fireEvent.change(languagesSelect, { target: { value: "French" } });

    // Chip appears (disambiguate from <option> by selecting non-OPTION element)
    const frenchNodes = await screen.findAllByText("French");
    const frenchChip = frenchNodes.find(n => n.tagName.toLowerCase() !== 'option');
    expect(frenchChip).toBeTruthy();

    // Remove it via ✕ button inside chip
    const chipEl = frenchChip.closest("span");
    const closeBtn = within(chipEl).getByRole("button");
    fireEvent.click(closeBtn);

    await waitFor(() => {
      const frenchNodesAfter = screen.queryAllByText("French");
      const remainingChips = frenchNodesAfter.filter(n => n.tagName.toLowerCase() !== 'option');
      expect(remainingChips.length).toBe(0);
    });
  });

  test("can add and remove a hobby chip", async () => {
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    await screen.findByText(mockProfile.username);

    // The hobbies select is after the Languages section; get all selects and pick the second
  const selects = screen.getAllByRole("combobox");
  const hobbiesSelect = selects[2] || selects[selects.length - 1];

    fireEvent.change(hobbiesSelect, { target: { value: "Cooking" } });

  // Chip appears (not the select option)
  const cookingNodes = await screen.findAllByText("Cooking");
  const cookingChip = cookingNodes.find(n => n.tagName.toLowerCase() !== 'option');
  expect(cookingChip).toBeTruthy();

    // Remove it
    const chip2 = cookingChip.closest("span");
    const closeBtn = within(chip2).getByRole("button");
    fireEvent.click(closeBtn);

    await waitFor(() => {
      const cookingNodesAfter = screen.queryAllByText("Cooking");
      const remainingChips = cookingNodesAfter.filter(n => n.tagName.toLowerCase() !== 'option');
      expect(remainingChips.length).toBe(0);
    });
  });

  test("saves changes and posts payload to API", async () => {
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    await screen.findByText(mockProfile.username);

    // Change bio and favorites
    fireEvent.change(screen.getByPlaceholderText(/Write something about yourself/i), {
      target: { value: "Updated intro" },
    });
    fireEvent.change(screen.getByPlaceholderText(/List your favorites/i), {
      target: { value: "Burgers" },
    });

    // Pick timezone from the timezones select: there is a timezone text shown near the top, but timezone select isn't explicit — instead, Save uses existing timezone state; ensure it's set to a valid one
    // Ensure language has at least one value (already does from profile)

    // Click Save Changes
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Expect a POST to API with our changes
    const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000';
    const postCall = (global.fetch).mock.calls.find(([url, opts]) => {
      return (url === `${API_BASE}/api/profile` || String(url).endsWith('/api/profile')) && opts && opts.method === "POST";
    });

    expect(postCall).toBeTruthy();
    const [, options] = postCall;
    const body = JSON.parse(options.body);

    expect(body.userID).toBe("user-123");
    expect(body.intro).toBe("Updated intro");
    expect(body.favorites).toBe("Burgers");
    // Ensure required fields are present
    expect(body).toHaveProperty("language");
    expect(Array.isArray(body.language)).toBe(true);
    expect(body).toHaveProperty("timezone");
  });
});
