// __tests__/Index.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Index from "../app/pages/index/index";
import { useRouter } from "next/navigation";

// Mock next/image (omit non-HTML boolean attributes like `fill` and `priority`)
jest.mock("next/image", () => {
  function MockNextImage({ src, alt, fill, priority, ...rest }) {
    return <img src={src} alt={alt} {...rest} />;
  }
  MockNextImage.displayName = "MockNextImage";
  return {
    __esModule: true,
    default: MockNextImage,
  };
});

// Mock next/router
jest.mock("next/navigation");

describe("Index Page", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithPath = (pathname) => {
    useRouter.mockReturnValue({ push: pushMock, pathname });
    render(<Index />);
  };

  test("renders main heading and subheading", () => {
    renderWithPath("/");
    // Heading text is split by an <em>, so use the accessible name on the h1
    expect(
      screen.getByRole("heading", { level: 1, name: /Say\s*Hello\s*to your/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/One message away from your new favourite human/i)
    ).toBeInTheDocument();
  });

  test("renders Start Chatting button and triggers navigation", () => {
    renderWithPath("/");
    const startButton = screen.getByRole("button", { name: /Start Chatting!/i });
    fireEvent.click(startButton);
    expect(pushMock).toHaveBeenCalledWith("/pages/signin");
  });

  test("renders Login button and triggers navigation", () => {
    renderWithPath("/");
    const loginButton = screen.getAllByRole("button", { name: /Login/i })[0];
    fireEvent.click(loginButton);
    expect(pushMock).toHaveBeenCalledWith("/pages/signin");
  });

  test("renders Sign Up button and triggers navigation", () => {
    renderWithPath("/");
    const signUpButton = screen.getAllByRole("button", { name: /Sign Up/i })[0];
    fireEvent.click(signUpButton);
    // Implementation navigates with a query to indicate signup intent
    expect(pushMock).toHaveBeenCalledWith("/pages/signin?signup=true");
  });

  test("renders the background image", () => {
    renderWithPath("/");
    const bgImage = screen.getByAltText(/background image/i);
    expect(bgImage).toBeInTheDocument();
    expect(bgImage.getAttribute("src")).toBe("/images/backgroundImage.avif");
  });

  test("renders at least one chat bubble image", () => {
    renderWithPath("/");
    const chatBubbles = screen.getAllByAltText(/typing bubble/i);
    expect(chatBubbles.length).toBeGreaterThan(0);
  });

  // Nav links removed from Index page per updated design; related tests removed.
});
