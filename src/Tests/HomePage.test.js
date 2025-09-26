// __tests__/HomePage.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "../app/page"; // adjust path if needed

// Mock Index component to isolate test
jest.mock("../app/pages/index", () => () => <div data-testid="index-component">Index Component</div>);

describe("HomePage component", () => {
  test("renders the Index component inside main", () => {
    render(<HomePage />);
    const indexComponent = screen.getByTestId("index-component");
    expect(indexComponent).toBeInTheDocument();

    // Check if wrapped in a <main>
    const main = indexComponent.closest("main");
    expect(main).toBeInTheDocument();
  });
});
