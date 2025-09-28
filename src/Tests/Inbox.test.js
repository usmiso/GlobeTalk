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
const saveSpyList = [];
jest.mock("jspdf", () => ({
  jsPDF: jest.fn().mockImplementation(() => {
    const inst = {
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      text: jest.fn(),
      splitTextToSize: jest.fn((t) => [t]),
      setTextColor: jest.fn(),
      addPage: jest.fn(),
      save: jest.fn(),
    };
    saveSpyList.push(inst.save);
    return inst;
  }),
}));

// Helpers
const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe("Inbox Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to desktop viewport to avoid mobile branches unless explicitly changed
    window.innerWidth = 1200;
    window.dispatchEvent(new Event("resize"));
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
    // Success UI shows a confirmation popup rather than an alert
    expect(await screen.findByText(/report submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/message reported/i)).toBeInTheDocument();
    // Close the popup to clean up UI state
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
  });

  test("unauthenticated user shows error", async () => {
    mockOnAuthStateChanged.mockImplementation((authObj, cb) => {
      cb(null);
      return () => {};
    });

    render(<Inbox />);

    await waitFor(() => screen.getByText(/error: user not logged in/i));
  });

  // New tests
  test("locked messages show placeholder and no per-message download", async () => {
    const now = Date.now();
    const chat = {
      chatId: "chat-2",
      users: ["user-123", "friend-789"],
      messages: [
        { sender: "friend-789", text: "Locked msg", sentAt: now, deliveryTime: now + 60_000, delaySeconds: 60 },
      ],
    };

    global.fetch = jest.fn((url) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-2"] }) });
      if (s.includes(`/api/chat?chatId=chat-2`)) return Promise.resolve({ ok: true, json: async () => chat });
      if (s.includes(`/api/profile?userID=friend-789`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "friend-789", username: "Sam" }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    await waitFor(() => screen.getByText("Sam"));
    fireEvent.click(screen.getByText("Sam"));

    // Message content locked
    expect(await screen.findByText(/this letter will unlock soon/i)).toBeInTheDocument();
    // Per-message download not present for locked
    expect(screen.queryByTitle(/download letter/i)).not.toBeInTheDocument();
  });

  test("per-message download triggers PDF save for unlocked message", async () => {
    const now = Date.now();
    const chat = {
      chatId: "chat-3",
      users: ["user-123", "friend-999"],
      messages: [
        { sender: "friend-999", text: "Open msg", sentAt: now - 2000, deliveryTime: now - 1000, delaySeconds: 60 },
      ],
    };

    global.fetch = jest.fn((url) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-3"] }) });
      if (s.includes(`/api/chat?chatId=chat-3`)) return Promise.resolve({ ok: true, json: async () => chat });
      if (s.includes(`/api/profile?userID=friend-999`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "friend-999", username: "Lee" }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    await waitFor(() => screen.getByText("Lee"));
    fireEvent.click(screen.getByText("Lee"));

    const btn = await screen.findByTitle(/download letter/i);
    fireEvent.click(btn);

    // Check any mocked save was called
    await waitFor(() => {
      expect(saveSpyList.some((spy) => spy.mock.calls.length > 0)).toBe(true);
    });
  });

  test("reply button label reflects chat state", async () => {
    const now = Date.now();
    const chatEmpty = { chatId: "chat-empty", users: ["user-123", "f1"], messages: [] };
    const chatWithMsg = { chatId: "chat-has", users: ["user-123", "f2"], messages: [{ sender: "f2", text: "Hello", sentAt: now - 2e3, deliveryTime: now - 1e3, delaySeconds: 60 }] };

    // Return two chats; open first then second
    global.fetch = jest.fn((url) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-empty", "chat-has"] }) });
      if (s.includes(`/api/chat?chatId=chat-empty`)) return Promise.resolve({ ok: true, json: async () => chatEmpty });
      if (s.includes(`/api/chat?chatId=chat-has`)) return Promise.resolve({ ok: true, json: async () => chatWithMsg });
      if (s.includes(`/api/profile?userID=f1`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "f1", username: "A" }) });
      if (s.includes(`/api/profile?userID=f2`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "f2", username: "B" }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    await waitFor(() => screen.getByText("A"));
    fireEvent.click(screen.getByText("A"));
    expect(await screen.findByRole("button", { name: /start chatting/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText("B"));
    expect(await screen.findByRole("button", { name: /reply to letter/i })).toBeInTheDocument();
  });

  test("composer delay selection sets delaySeconds in POST", async () => {
    const chat = { chatId: "chat-4", users: ["user-123", "f4"], messages: [] };

    const postBodies = [];
    global.fetch = jest.fn((url, opts) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-4"] }) });
      if (s.includes(`/api/chat?chatId=chat-4`)) return Promise.resolve({ ok: true, json: async () => chat });
      if (s.includes(`/api/profile?userID=f4`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "f4", username: "C" }) });
      if (s.includes(`/api/chat/send`)) {
        postBodies.push(JSON.parse(opts.body));
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    await waitFor(() => screen.getByText("C"));
    fireEvent.click(screen.getByText("C"));

    fireEvent.click(screen.getByRole("button", { name: /start chatting|reply to letter/i }));

  // Change delay to 1 hour (select is the only combobox in composer)
  const delaySelect = screen.getByRole("combobox");
  fireEvent.change(delaySelect, { target: { value: "3600" } });

    fireEvent.change(screen.getByPlaceholderText(/dear pen pal/i), { target: { value: "Hi" } });
    fireEvent.click(screen.getByRole("button", { name: /send letter/i }));

    await waitFor(() => expect(postBodies.length).toBeGreaterThan(0));
    expect(postBodies[0].message.delaySeconds).toBe(3600);
  });

  test("report 'Other' requires text and then submits", async () => {
    const now = Date.now();
    const chat = { chatId: "chat-5", users: ["user-123", "f5"], messages: [{ sender: "f5", text: "Msg", sentAt: now - 2e3, deliveryTime: now - 1e3, delaySeconds: 60 }] };

    const reportCalls = [];
    global.fetch = jest.fn((url, opts) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-5"] }) });
      if (s.includes(`/api/chat?chatId=chat-5`)) return Promise.resolve({ ok: true, json: async () => chat });
      if (s.includes(`/api/profile?userID=f5`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "f5", username: "D" }) });
      if (s.includes(`/api/chat/report`)) { reportCalls.push(JSON.parse(opts.body)); return Promise.resolve({ ok: true, json: async () => ({ ok: true }) }); }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    window.alert = jest.fn();

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    await waitFor(() => screen.getByText("D"));
    fireEvent.click(screen.getByText("D"));

    fireEvent.click(await screen.findByRole("button", { name: /report/i }));

    // Select Other with empty description
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Other" } });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/please provide a reason/i));

    // Fill details and submit
    fireEvent.change(screen.getByLabelText(/describe your complaint/i), { target: { value: "Offensive" } });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    await waitFor(() => expect(reportCalls.length).toBe(1));
    expect(reportCalls[0].reason).toBe("Offensive");
  });

  test("initialChatId opens chat on mobile and hides list", async () => {
    // Force mobile
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));

    searchParams = new URLSearchParams("chatId=chat-6");

    const chat = { chatId: "chat-6", users: ["user-123", "f6"], messages: [] };

    global.fetch = jest.fn((url) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-6"] }) });
      if (s.includes(`/api/chat?chatId=chat-6`)) return Promise.resolve({ ok: true, json: async () => chat });
      if (s.includes(`/api/profile?userID=f6`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "f6", username: "M" }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    // Should be in chat view with back button visible
    expect(await screen.findByRole("button", { name: /back to pen pals/i })).toBeInTheDocument();
    // Sidebar list title should not be visible in mobile chat view
    expect(screen.queryByText(/your pen pals/i)).not.toBeInTheDocument();
  });

  test("polls for messages every 3 seconds when chat open", async () => {
    jest.useFakeTimers();
    // Ensure desktop layout for sidebar
    window.innerWidth = 1200;
    window.dispatchEvent(new Event("resize"));
    const now = Date.now();
    const chat = { chatId: "chat-7", users: ["user-123", "f7"], messages: [{ sender: "f7", text: "hi", sentAt: now - 2e3, deliveryTime: now - 1e3, delaySeconds: 60 }] };

    const fetchMock = jest.fn((url) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-7"] }) });
      if (s.includes(`/api/chat?chatId=chat-7`)) return Promise.resolve({ ok: true, json: async () => chat });
      if (s.includes(`/api/profile?userID=f7`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "f7", username: "N" }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    await waitFor(() => screen.getByText("N"));
    fireEvent.click(screen.getByText("N"));

    // Initial calls happen for profile + chat + friend profile + open chat poll once
    fetchMock.mockClear();
    // Advance 9 seconds => expect ~3 polls
    act(() => { jest.advanceTimersByTime(9000); });

    // Count of chat endpoint calls
    const chatCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes(`/api/chat?chatId=chat-7`)).length;
    expect(chatCalls).toBeGreaterThanOrEqual(3);

    jest.useRealTimers();
  });

  test("sidebar preview shows locked label when no unlocked messages", async () => {
    // Ensure desktop layout for sidebar
    window.innerWidth = 1200;
    window.dispatchEvent(new Event("resize"));
    const now = Date.now();
    const chat = { chatId: "chat-8", users: ["user-123", "f8"], messages: [{ sender: "f8", text: "soon", sentAt: now, deliveryTime: now + 60_000, delaySeconds: 60 }] };

    global.fetch = jest.fn((url) => {
      const s = String(url);
      if (s.includes(`/api/profile?userID=user-123`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "user-123", chats: ["chat-8"] }) });
      if (s.includes(`/api/chat?chatId=chat-8`)) return Promise.resolve({ ok: true, json: async () => chat });
      if (s.includes(`/api/profile?userID=f8`)) return Promise.resolve({ ok: true, json: async () => ({ userID: "f8", username: "P" }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    mockOnAuthStateChanged.mockImplementation((_, cb) => { cb({ uid: "user-123" }); return () => {}; });

    render(<Inbox />);

    // In sidebar list, preview should show the locked label
    expect(await screen.findByText(/locked message \(coming soon…\)/i)).toBeInTheDocument();
  });
});
