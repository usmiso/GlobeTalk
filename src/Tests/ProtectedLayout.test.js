/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import ProtectedLayout from "../app/components/ProtectedLayout";

// Mock the custom hook
jest.mock("../useAuthRedirect", () => ({
  useAuthRedirect: jest.fn(),
}));

import { useAuthRedirect } from "../app/components/useAuthRedirect";

describe("ProtectedLayout", () => {
  it("renders loading screen when loading is true", () => {
    useAuthRedirect.mockReturnValue(true); // Simulate loading
    render(
      <ProtectedLayout>
        <div>Secret Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("renders children when loading is false", () => {
    useAuthRedirect.mockReturnValue(false); // Not loading
    render(
      <ProtectedLayout>
        <div>Secret Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByText("Secret Content")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("accepts a redirectTo prop", () => {
    useAuthRedirect.mockReturnValue(false); // Not loading
    render(
      <ProtectedLayout redirectTo="/login">
        <div>Secret Content</div>
      </ProtectedLayout>
    );

    // The redirectTo prop is passed to the hook; we can test if hook called correctly
    expect(useAuthRedirect).toHaveBeenCalledWith("/login");
    expect(screen.getByText("Secret Content")).toBeInTheDocument();
  });
});
