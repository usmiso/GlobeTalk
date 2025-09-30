import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Dashboard from "../app/pages/dashboard/page";

// Mock next/navigation
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock Navbar to avoid external dependencies and focus on Dashboard logic
jest.mock("../app/components/Navbar", () => {
  function MockNavbar() {
    return <div data-testid="mock-navbar">Navbar</div>;
  }
  MockNavbar.displayName = "MockNavbar";
  return MockNavbar;
});

// Mock Firebase auth and app auth export
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((auth, cb) => {
    // Immediately invoke callback with a mock user
    cb({ uid: "user-123" });
    return () => {};
  }),
}));
jest.mock("../app/firebase/auth", () => ({
  auth: { currentUser: { uid: "user-123" } },
}));

describe("Dashboard component", () => {
  beforeEach(() => {
    pushMock.mockClear();
    // Default API responses for profile and stats
    global.fetch = jest.fn((url) => {
      const s = String(url);
      if (s.includes("/api/profile?userID=user-123")) {
        return Promise.resolve({ ok: true, json: async () => ({
          userID: "user-123",
          username: "TestUser",
          timezone: "UTC",
          language: ["English"],
          hobbies: ["Reading"],
        }) });
      }
      if (s.includes("/api/stats?userID=user-123")) {
        return Promise.resolve({ ok: true, json: async () => ({
          totalLetters: 5,
          activePenPals: 2,
          countriesConnected: 3,
          averageResponseTime: "2d",
          lettersThisMonth: 2,
          favoriteLetters: 1,
          activity: [],
        }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  test("renders main content and profile overview", async () => {
    render(<Dashboard />);
    // Wait for profile load
    await waitFor(() => expect(screen.getByText(/Welcome back, TestUser/i)).toBeInTheDocument());
    // Quick sanity checks
    expect(screen.getByText(/Your Profile/i)).toBeInTheDocument();
  });

  test("quick actions navigate", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText(/Your Profile/i)).toBeInTheDocument());
    // Click the explicit Edit Profile button (not the quick action link)
    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editBtn);
    expect(pushMock).toHaveBeenCalledWith("/pages/userprofile");
  });

  test("renders stats and activity placeholders", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText(/Your Profile/i)).toBeInTheDocument());
    expect((await screen.findAllByText(/Total Letters/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Active Pen Pals/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Countries/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Avg Response/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Recent Activity/i)).length).toBeGreaterThan(0);
  });

  // Removed journey/safety tests not present in current UI structure
});
