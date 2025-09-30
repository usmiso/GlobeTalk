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
});
