/**
 * @file Sidebar.test.jsx
 */
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../app/components/Sidebar";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Sidebar component", () => {
  let pushMock;

  beforeEach(() => {
    pushMock = jest.fn();
    useRouter.mockReturnValue({ push: pushMock });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders sidebar with logo and menu items", () => {
    render(<Sidebar />);

    expect(screen.getByAltText("GlobeTalk Logo")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Cultural Explorer")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Find new Pal")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("closes sidebar when close button is clicked", () => {
    render(<Sidebar />);
    const closeBtn = screen.getByTitle("Close sidebar");

    fireEvent.click(closeBtn);

    // Sidebar should collapse to just ☰ button
    expect(screen.getByTitle("Open sidebar")).toBeInTheDocument();
  });

  test("reopens sidebar when ☰ button is clicked", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByTitle("Close sidebar"));

    const openBtn = screen.getByTitle("Open sidebar");
    fireEvent.click(openBtn);

    expect(screen.getByTitle("Close sidebar")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("navigates to correct pages when menu items clicked", () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByText("Dashboard"));
    expect(pushMock).toHaveBeenCalledWith("/pages/dashboard");

    fireEvent.click(screen.getByText("Profile"));
    expect(pushMock).toHaveBeenCalledWith("/pages/userprofile");

    fireEvent.click(screen.getByText("Cultural Explorer"));
    expect(pushMock).toHaveBeenCalledWith("/pages/explore");

    fireEvent.click(screen.getByText("Inbox"));
    expect(pushMock).toHaveBeenCalledWith("/pages/inbox");

    fireEvent.click(screen.getByText("Find new Pal"));
    expect(pushMock).toHaveBeenCalledWith("/pages/matchmaking");

    fireEvent.click(screen.getByText("Logout"));
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
