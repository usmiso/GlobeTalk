import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Inbox from "../app/pages/inbox/page";

// Mock Next.js router & search params
const mockPush = jest.fn();
let searchParams = new URLSearchParams("");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (k) => searchParams.get(k) }),
}));

// Mock Firebase auth & onAuthStateChanged
const mockOnAuthStateChanged = jest.fn();
jest.mock("firebase/auth", () => ({ onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args) }));

jest.mock("../app/firebase/auth", () => ({
  auth: {
    currentUser: { uid: "user-123" },
  },
}));

// Mock Navbar and LoadingScreen to simplify DOM
jest.mock("../app/components/Navbar", () => () => <div data-testid="navbar" />);
jest.mock("../app/components/LoadingScreen", () => () => <div>Loading...</div>);

// Mock jsPDF used for downloads
jest.mock("jspdf", () => ({ jsPDF: jest.fn().mockImplementation(() => ({
  setFont: jest.fn(),
  setFontSize: jest.fn(),
  text: jest.fn(),
  splitTextToSize: jest.fn((t) => [t]),
  setTextColor: jest.fn(),
  addPage: jest.fn(),
  save: jest.fn(),
})) }));

// Helpers
const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe("Inbox Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default fetch mock
    global.fetch = jest.fn((url, opts) => {
      // profile fetch
      if (typeof url === "string" && url.startsWith(`${apiBase}/api/profile`)) {
        return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  test("shows empty state and navigates to matchmaking", async () => {
    // Auth callback with user
    mockOnAuthStateChanged.mockImplementation((authObj, cb) => {
      cb({ uid: "user-123" });
      return () => {};
    });

    render(<Inbox />);

    // Loading then empty state
    expect(await screen.findByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/you don't have any pen pals yet/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/find a pen pal/i));
    expect(mockPush).toHaveBeenCalledWith("/pages/matchmaking");
  });

  test("loads chats, opens a chat, shows messages and allows chat download", async () => {
    const now = Date.now();
    const chat = {
      chatId: "chat-1",
      users: ["user-123", "friend-456"],
      messages: [
        { sender: "friend-456", text: "Hi!", sentAt: now - 100000, deliveryTime: now - 50000, delaySeconds: 60 },
        { sender: "user-123", text: "Hello back", sentAt: now - 90000, deliveryTime: now - 1000, delaySeconds: 120 },
      ],
    };

    // Mock fetch profile and chat and friend profile
    global.fetch = jest.fn((url) => {
      const s = String(url);
      if (s.startsWith(`${apiBase}/api/profile?userID=user-123`)) {
        return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-1"] }) });
      }
      if (s.startsWith(`${apiBase}/api/chat?chatId=chat-1`)) {
        return Promise.resolve({ ok: true, json: async () => chat });
      }
      if (s.startsWith(`${apiBase}/api/profile?userID=friend-456`)) {
        return Promise.resolve({ ok: true, json: async () => ({ userID: "friend-456", username: "Alex", avatarUrl: "/avatar.png", country: "US" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    // Auth callback with user
    mockOnAuthStateChanged.mockImplementation((authObj, cb) => {
      cb({ uid: "user-123" });
      return () => {};
    });

    render(<Inbox />);

    // Sidebar item shows friend username and preview
    await waitFor(() => expect(screen.getByText("Alex")).toBeInTheDocument());

    // Click chat to open
    fireEvent.click(screen.getByText("Alex"));

    // Messages should appear with text content because deliveryTime <= now
    await waitFor(() => {
      expect(screen.getByText("Hi!")).toBeInTheDocument();
      expect(screen.getByText("Hello back")).toBeInTheDocument();
    });

    // Download chat button visible
    expect(screen.getByText(/download chat/i)).toBeInTheDocument();
  });

  test("compose and send a letter updates UI and POSTs", async () => {
    const now = Date.now();
    const chat = {
      chatId: "chat-1",
      users: ["user-123", "friend-456"],
      messages: [],
    };

    const postMock = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true }) }));

    global.fetch = jest.fn((url, opts) => {
      const s = String(url);
      if (s.startsWith(`${apiBase}/api/profile?userID=user-123`)) {
        return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-1"] }) });
      }
      if (s.startsWith(`${apiBase}/api/chat?chatId=chat-1`)) {
        return Promise.resolve({ ok: true, json: async () => chat });
      }
      if (s.startsWith(`${apiBase}/api/profile?userID=friend-456`)) {
        return Promise.resolve({ ok: true, json: async () => ({ userID: "friend-456", username: "Alex" }) });
      }
      if (s.startsWith(`${apiBase}/api/chat/send`)) {
        return postMock(url, opts);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((authObj, cb) => {
      cb({ uid: "user-123" });
      return () => {};
    });

    render(<Inbox />);

    // Open the first chat
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByText("Alex"));

    // Click Start Chatting button to open composer
    fireEvent.click(screen.getByRole("button", { name: /start chatting|reply to letter/i }));

    // Type message and send
    const textarea = screen.getByPlaceholderText(/dear pen pal/i);
    fireEvent.change(textarea, { target: { value: "This is a test message" } });
    fireEvent.click(screen.getByRole("button", { name: /send letter/i }));

    await waitFor(() => expect(postMock).toHaveBeenCalled());

    // Composer should close and message text cleared
    await waitFor(() => expect(screen.queryByPlaceholderText(/dear pen pal/i)).not.toBeInTheDocument());
  });

  test("report a message flow", async () => {
    const now = Date.now();
    const chat = {
      chatId: "chat-1",
      users: ["user-123", "friend-456"],
      messages: [
        { sender: "friend-456", text: "Rude msg", sentAt: now - 1000, deliveryTime: now - 10, delaySeconds: 60 },
      ],
    };

    const reportMock = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true }) }));

    global.fetch = jest.fn((url, opts) => {
      const s = String(url);
      if (s.startsWith(`${apiBase}/api/profile?userID=user-123`)) {
        return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-1"] }) });
      }
      if (s.startsWith(`${apiBase}/api/chat?chatId=chat-1`)) {
        return Promise.resolve({ ok: true, json: async () => chat });
      }
      if (s.startsWith(`${apiBase}/api/profile?userID=friend-456`)) {
        return Promise.resolve({ ok: true, json: async () => ({ userID: "friend-456", username: "Alex" }) });
      }
      if (s.startsWith(`${apiBase}/api/chat/report`)) {
        return reportMock(url, opts);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((authObj, cb) => {
      cb({ uid: "user-123" });
      return () => {};
    });

    // Stub alert to avoid noisy logs
    window.alert = jest.fn();

    render(<Inbox />);

    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByText("Alex"));

    // Open report modal from message
    fireEvent.click(screen.getByRole("button", { name: /report/i }));

    // Choose a reason and submit
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Harassment or bullying" } });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

    await waitFor(() => expect(reportMock).toHaveBeenCalled());
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/message reported/i));
  });

  test("unauthenticated user shows error", async () => {
    mockOnAuthStateChanged.mockImplementation((authObj, cb) => {
      cb(null);
      return () => {};
    });

    render(<Inbox />);

    await waitFor(() => screen.getByText(/error: user not logged in/i));
  });
});
