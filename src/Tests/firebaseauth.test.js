import * as firebaseAuth from "firebase/auth";
import * as firestore from "firebase/firestore";
import * as authModule from "../auth"; // adjust path if needed

jest.mock("firebase/auth");
jest.mock("firebase/firestore");

describe("auth.js", () => {
  const mockUserCredential = { user: { uid: "123", email: "test@example.com" } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signUp", () => {
    it("should sign up a user and send verification email", async () => {
      firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      firebaseAuth.sendEmailVerification.mockResolvedValue(true);

      const result = await authModule.signUp("test@example.com", "password123");
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(authModule.auth, "test@example.com", "password123");
      expect(firebaseAuth.sendEmailVerification).toHaveBeenCalledWith(mockUserCredential.user);
      expect(result).toEqual(mockUserCredential);
    });

    it("should throw an error if signup fails", async () => {
      const error = new Error("Signup failed");
      firebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(authModule.signUp("fail@example.com", "123")).rejects.toThrow("Signup failed");
    });
  });

  describe("signIn", () => {
    it("should sign in a user with email and password", async () => {
      firebaseAuth.signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await authModule.signIn("test@example.com", "password123");
      expect(result).toEqual(mockUserCredential);
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(authModule.auth, "test@example.com", "password123");
    });

    it("should throw an error if sign in fails", async () => {
      const error = new Error("Sign in failed");
      firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(authModule.signIn("fail@example.com", "123")).rejects.toThrow("Sign in failed");
    });
  });

  describe("signUpWithGoogle / signInWithGoogle", () => {
    const mockProvider = {};
    const mockResult = { user: { uid: "123", email: "test@example.com" } };

    beforeEach(() => {
      firebaseAuth.GoogleAuthProvider.mockImplementation(() => mockProvider);
    });

    it("should sign up/sign in with Google popup", async () => {
      firebaseAuth.signInWithPopup.mockResolvedValue(mockResult);
      firestore.getDoc.mockResolvedValue({ exists: () => false });
      firestore.setDoc.mockResolvedValue(true);

      const result = await authModule.signInWithGoogle();
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalledWith(authModule.auth, mockProvider);
      expect(firestore.setDoc).toHaveBeenCalled();
      expect(result.isNewUser).toBe(true);
      expect(result.user).toEqual(mockResult.user);
    });

    it("should return existing user if document exists", async () => {
      firebaseAuth.signInWithPopup.mockResolvedValue(mockResult);
      firestore.getDoc.mockResolvedValue({ exists: () => true });

            const result = await authModule.signInWithGoogle();
            expect(firebaseAuth.signInWithPopup).toHaveBeenCalledWith(authModule.auth, mockProvider);
            expect(result.isNewUser).toBe(false);
            expect(result.user).toEqual(mockResult.user);
          });
        });
      });
