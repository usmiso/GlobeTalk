import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import UserProfile from "../app/pages/userprofile/page";

// Mock Navbar to avoid unrelated complexity
jest.mock("../app/components/Navbar", () => {
  function MockNavbar() { return <div data-testid="navbar" />; }
  MockNavbar.displayName = "MockNavbar";
  return MockNavbar;
});

// Mock next/navigation useRouter
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock auth export
jest.mock("../app/firebase/auth", () => ({
  auth: { currentUser: { uid: "user-123" } },
}));

// Mock onAuthStateChanged to immediately provide a user
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((_auth, cb) => {
    cb({ uid: "user-123" });
    return () => {};
  }),
}));

const mockTimezones = [
  { value: "(GMT+02:00) Africa/Johannesburg", text: "(GMT+02:00) Africa/Johannesburg", timezone_id: "Africa/Johannesburg", country_code: "ZA" },
];

const baseProfile = {
  intro: "Hello there!",
  ageRange: "25 - 34",
  hobbies: ["Reading"],
  timezone: "Africa/Johannesburg",
  language: ["English"],
  sayings: ["Howzit"],
  username: "witty-wildebeest",
  avatarUrl: "https://example.com/avatar.svg",
  favorites: "Pizza",
  facts: "I love coding",
  country: "South Africa",
};

function setupDefaultFetch(profileOverride = {}) {
  const profile = { ...baseProfile, ...profileOverride };
  const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000';
  global.fetch = jest.fn((url, options) => {
    const u = typeof url === "string" ? url : url.url;
    if (u.includes("/assets/timezones.json")) {
      return Promise.resolve({ ok: true, json: async () => mockTimezones });
    }
    if (u.startsWith("https://restcountries.com")) {
      return Promise.resolve({ ok: true, json: async () => [{ languages: { eng: "English" } }] });
    }
    if (u.startsWith(`${API_BASE}/api/profile`) && (!options || options.method === undefined)) {
      return Promise.resolve({ ok: true, json: async () => profile });
    }
    if ((u === `${API_BASE}/api/profile` || String(u).endsWith('/api/profile')) && options && options.method === "POST") {
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

describe("UserProfile extra tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset auth & onAuthStateChanged to default authenticated behavior for each test
    const authModule = require("../app/firebase/auth");
    authModule.auth.currentUser = { uid: "user-123" };
    const { onAuthStateChanged } = require("firebase/auth");
    if (onAuthStateChanged && typeof onAuthStateChanged.mockImplementation === 'function') {
      onAuthStateChanged.mockImplementation((_auth, cb) => { cb({ uid: "user-123" }); return () => {}; });
    }
    setupDefaultFetch();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("shows avatar placeholder when no avatarUrl", async () => {
    setupDefaultFetch({ avatarUrl: "" });
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });

    expect(await screen.findByText(/No Avatar/i)).toBeInTheDocument();
    expect(screen.queryByAltText('avatar')).not.toBeInTheDocument();
  });

  // Note: save state transitions and custom language dedupe are covered elsewhere; focusing on stable UI bits here.

  test("age range select updates value", async () => {
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    await screen.findByText(baseProfile.username);

    const selects = screen.getAllByRole('combobox');
    const ageSelect = selects[0];

    fireEvent.change(ageSelect, { target: { value: '18 - 24' } });
    expect(ageSelect).toHaveValue('18 - 24');
  });

  test("shows Loading first, then content after delay", async () => {
    render(<UserProfile />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    await act(async () => { jest.advanceTimersByTime(600); });
    expect(await screen.findByText(baseProfile.username)).toBeInTheDocument();
  });

  test("renders with unauthenticated user (no profile fetch)", async () => {
    const authModule = require("../app/firebase/auth");
    authModule.auth.currentUser = null;
    const { onAuthStateChanged } = require("firebase/auth");
    onAuthStateChanged.mockImplementation((_auth, cb) => { cb(null); return () => {}; });

    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(10); });
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test("normalizes profile language from string to array", async () => {
    setupDefaultFetch({ language: 'English' });
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    const englishNodes = await screen.findAllByText('English');
    expect(englishNodes.some(n => n.tagName.toLowerCase() !== 'option')).toBe(true);
  });

  test("prevent duplicate language from dropdown", async () => {
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    await screen.findByText(baseProfile.username);

    const initialNodes = screen.getAllByText('English');
    const initialChipCount = initialNodes.filter(n => n.tagName.toLowerCase() !== 'option').length;

    const selects = screen.getAllByRole('combobox');
    const languagesSelect = selects[1];
    fireEvent.change(languagesSelect, { target: { value: 'English' } });

    const afterNodes = screen.getAllByText('English');
    const afterChipCount = afterNodes.filter(n => n.tagName.toLowerCase() !== 'option').length;
    expect(afterChipCount).toBe(initialChipCount);
  });

  test("save button shows spinner, then Saved!, then returns to Save Changes", async () => {
    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    await screen.findByText(baseProfile.username);

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();

    await act(async () => {});
    expect(await screen.findByText(/Saved!/i)).toBeInTheDocument();

    await act(async () => { jest.advanceTimersByTime(1600); });
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test("handles profile fetch error gracefully (catch path)", async () => {
    const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000';
    global.fetch = jest.fn((url, options) => {
      const u = typeof url === 'string' ? url : url.url;
      if (u.includes('/assets/timezones.json')) {
        return Promise.resolve({ ok: true, json: async () => mockTimezones });
      }
      if (u.startsWith('https://restcountries.com')) {
        return Promise.resolve({ ok: true, json: async () => [{ languages: { eng: 'English' } }] });
      }
      if (u.startsWith(`${API_BASE}/api/profile`) && (!options || options.method === undefined)) {
        return Promise.reject(new Error('network fail'));
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test("handles languages/timezones fetch errors (catch paths)", async () => {
    const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000';
    global.fetch = jest.fn((url, options) => {
      const u = typeof url === 'string' ? url : url.url;
      if (u.includes('/assets/timezones.json')) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      if (u.startsWith('https://restcountries.com')) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      if (u.startsWith(`${API_BASE}/api/profile`) && (!options || options.method === undefined)) {
        return Promise.resolve({ ok: true, json: async () => baseProfile });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<UserProfile />);
    await act(async () => { jest.advanceTimersByTime(600); });
    expect(screen.getByText(baseProfile.username)).toBeInTheDocument();
    const selects2 = screen.getAllByRole('combobox');
    expect(selects2.length).toBeGreaterThanOrEqual(3);
  });
});
