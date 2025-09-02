import { render, screen, fireEvent } from "@testing-library/react";
import Dashboard from "../app/pages/dashboard/page";

// Mock next/navigation
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("Dashboard component", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  test("renders main content and sidebar", () => {
    render(<Dashboard />);
    
    // Check main heading
    expect(screen.getByText(/WELCOME TO GLOBETALK/i)).toBeInTheDocument();

    // Sidebar elements
    expect(screen.getByText(/GlobeTalk/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  test("toggles sidebar", () => {
    render(<Dashboard />);
    
    // Initially sidebar is open
    expect(screen.queryByText(/Profile/i)).toBeInTheDocument();

    // Click toggle button to close sidebar
    fireEvent.click(screen.getByText("☰"));
    expect(screen.queryByText(/Profile/i)).not.toBeInTheDocument();

    // Show sidebar button should appear
    const showButton = screen.getByText("☰", { selector: "button" });
    fireEvent.click(showButton);
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });

  test("navigates on button clicks", () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByText("Profile"));
    expect(pushMock).toHaveBeenCalledWith("/pages/userprofile");

    fireEvent.click(screen.getByText("Letters"));
    expect(pushMock).toHaveBeenCalledWith("/pages/letters");

    fireEvent.click(screen.getByText("Logout"));
    expect(pushMock).toHaveBeenCalledWith("/");
    
    fireEvent.click(screen.getByText(/Find A Pal/i));
    expect(pushMock).toHaveBeenCalledWith("/pages/matchmaking");
  });

  test("renders journey and letters cards", () => {
    render(<Dashboard />);
    
    expect(screen.getByText(/Your Journey/i)).toBeInTheDocument();
    expect(screen.getByText(/Countries Connected/i)).toBeInTheDocument();
    expect(screen.getByText(/Letters Sent/i)).toBeInTheDocument();
    expect(screen.getByText(/Longest Friendship/i)).toBeInTheDocument();
    
    expect(screen.getByText(/2 New Letters/i)).toBeInTheDocument();
  });

  test("renders safety reminder", () => {
    render(<Dashboard />);
    expect(screen.getByText(/Safety reminder/i)).toBeInTheDocument();
  });
});
