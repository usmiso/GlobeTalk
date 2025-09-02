// __tests__/firebaseConfig.test.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Mock Firebase functions
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [])
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ mockAuth: true }))
}));

jest.mock("firebase/firestore", () => ({
  initializeFirestore: jest.fn(() => ({ mockFirestore: true })),
  persistentLocalCache: jest.fn(() => "persistentCache"),
  persistentMultipleTabManager: jest.fn(() => "tabManager"),
  CACHE_SIZE_UNLIMITED: 999999
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({ mockStorage: true }))
}));

// Import the actual config after mocks
import { app, auth, db, storage } from "../firebase/firebaseConfig";

describe("Firebase Configuration", () => {
  it("should initialize the Firebase app", () => {
    expect(initializeApp).toHaveBeenCalled();
    expect(app).toBeDefined();
  });

  it("should initialize Firebase Auth", () => {
    expect(getAuth).toHaveBeenCalledWith(app);
    expect(auth.mockAuth).toBe(true);
  });

  it("should initialize Firestore with multi-tab persistence", () => {
    expect(initializeFirestore).toHaveBeenCalled();
    expect(db.mockFirestore).toBe(true);
  });

  it("should initialize Firebase Storage", () => {
    expect(getStorage).toHaveBeenCalledWith(app);
    expect(storage.mockStorage).toBe(true);
  });
});
