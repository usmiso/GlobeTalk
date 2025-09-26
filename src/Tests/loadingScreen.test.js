// __tests__/LoadingScreen.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import LoadingScreen from "../app/components/LoadingScreen"; // adjust path if needed

describe("LoadingScreen component", () => {
  test("renders the loading container", () => {
    render(<LoadingScreen />);
    const container = screen.getByText(/Loading.../i).parentElement.parentElement;
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle("min-height: 100vh");
    expect(container).toHaveStyle("position: fixed");
  });

  test("renders the loading image", () => {
    render(<LoadingScreen />);
    const img = screen.getByAltText(/Loading/i);
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("/images/globe.png");
  });

  test("renders the loading text", () => {
    render(<LoadingScreen />);
    const text = screen.getByText(/Loading.../i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveStyle("color: #6492BD");
    expect(text).toHaveStyle("fontWeight: 600");
  });
});
