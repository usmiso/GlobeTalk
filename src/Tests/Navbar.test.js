import { render, screen } from "@testing-library/react";
import Navbar from "../app/components/Navbar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock Firebase auth
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase app
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

const { usePathname } = require("next/navigation");

describe("Navbar", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
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
});