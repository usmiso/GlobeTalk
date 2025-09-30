import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "../app/components/Navbar";

// Mock next/navigation
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ push: pushMock }),
}));

// Mock Firebase auth & app-level auth export to avoid Firestore init
jest.mock("firebase/auth", () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));
jest.mock("../app/firebase/auth", () => ({
  auth: {},
}));

// Ensure firebase/app is not invoked during tests
jest.mock("firebase/app", () => ({ initializeApp: jest.fn(() => ({})) }));

const { usePathname } = require("next/navigation");
const { signOut } = require("firebase/auth");

describe("Navbar", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    pushMock.mockReset();
  });

  it("renders GlobeTalk logo and nav links", () => {
    usePathname.mockReturnValue("/pages/dashboard");
    render(<Navbar />);

    expect(screen.getByText("GlobeTalk")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("highlights the active route", () => {
    usePathname.mockReturnValue("/pages/inbox");
    render(<Navbar />);

    const inboxLink = screen.getByText("Inbox");
    expect(inboxLink).toHaveClass("bg-blue-600 text-white");
  });

  it("does not highlight inactive links", () => {
    usePathname.mockReturnValue("/pages/inbox");
    render(<Navbar />);

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink).not.toHaveClass("bg-blue-600 text-white");
    expect(dashboardLink).toHaveClass("text-gray-700");
  });

  it("renders the logo image", () => {
    usePathname.mockReturnValue("/pages/dashboard");
    render(<Navbar />);
    expect(screen.getByAltText("GlobeTalk Logo")).toBeInTheDocument();
  });

  it("logs out and redirects to home", async () => {
    usePathname.mockReturnValue("/pages/dashboard");
    render(<Navbar />);

    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutBtn);

    // signOut is mocked to resolve; assert it was called once with the auth object
    expect(signOut).toHaveBeenCalledTimes(1);
    // wait for the async handler to push after signOut resolves
    await screen.findByText("GlobeTalk");
    await Promise.resolve();
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("toggles mobile menu open and closes on link click", () => {
    usePathname.mockReturnValue("/pages/inbox");
    render(<Navbar />);

    // Initially only desktop Logout button is present
    expect(screen.getAllByRole("button", { name: /logout/i })).toHaveLength(1);

    // Find the mobile menu toggle button (the button without the 'Logout' name)
    const buttons = screen.getAllByRole("button");
    const toggleBtn = buttons.find((b) => !/logout/i.test(b.textContent || ""));
    expect(toggleBtn).toBeTruthy();

    // Open mobile menu
    fireEvent.click(toggleBtn);
    // Now there should be two Logout buttons (desktop + mobile menu)
    expect(screen.getAllByRole("button", { name: /logout/i })).toHaveLength(2);

  // Clicking a link in the mobile menu should close it - pick the last Inbox link (from mobile menu)
  const inboxLinks = screen.getAllByText("Inbox");
  fireEvent.click(inboxLinks[inboxLinks.length - 1]);
    // After closing, back to one Logout (desktop)
    expect(screen.getAllByRole("button", { name: /logout/i })).toHaveLength(1);
  });
});