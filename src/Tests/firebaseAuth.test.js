/**
 * Tests for src/app/firebase/auth.js
 * Mocks Firebase SDKs to avoid any real network or SDK initialization.
 */

// Reset between tests
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// Mock firebase/app (initializeApp)
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ __tag: 'app' })),
}));

// Mock firebase/auth (Auth API)
jest.mock('firebase/auth', () => {
  // Use function/class so `new GoogleAuthProvider()` works
  const GoogleAuthProvider = jest.fn(function GoogleAuthProvider() {
    this.__tag = 'GoogleAuthProvider';
  });

  return {
    // Instance providers
    GoogleAuthProvider,

    // Auth instance getter – return a simple stub object
    getAuth: jest.fn(() => ({ __tag: 'auth' })),

    // Auth flows
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendEmailVerification: jest.fn(),
    signOut: jest.fn(),

    // Listener
    onAuthStateChanged: jest.fn(),
  };
});

// Mock firebase/firestore (DB API)
jest.mock('firebase/firestore', () => {
  return {
    // Firestore initialization APIs (used in config.js)
    initializeFirestore: jest.fn(() => ({ __tag: 'db' })),
    persistentLocalCache: jest.fn((opts) => opts),
    persistentMultipleTabManager: jest.fn(() => ({})),
    CACHE_SIZE_UNLIMITED: 1048576,

    // Query helpers (not used directly here, but safe to provide)
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),

    // Doc helpers used by auth.js
    doc: jest.fn((_db, coll, id) => ({ coll, id })),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
  };
});

// Mock firebase/storage (used in config.js)
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({ __tag: 'storage' })),
}));

// Import after mocks are defined
const firebaseAuthSdk = require('firebase/auth');
const firestoreSdk = require('firebase/firestore');

// Module under test
import {
  signUp,
  signUpWithGoogle,
  signIn,
  signInWithGoogle,
  forgotPassword,
} from '@/app/firebase/auth';


describe('firebase auth.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signUp calls createUserWithEmailAndPassword and sendEmailVerification', async () => {
    const userCredential = { user: { uid: 'u1', email: 'a@b.com' } };
    firebaseAuthSdk.createUserWithEmailAndPassword.mockResolvedValueOnce(userCredential);

    const result = await signUp('a@b.com', 'secret');

    expect(firebaseAuthSdk.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      'a@b.com',
      'secret'
    );
    expect(firebaseAuthSdk.sendEmailVerification).toHaveBeenCalledWith(userCredential.user);
    expect(result).toBe(userCredential);
  });

  test('signUp propagates errors', async () => {
    const err = new Error('signup failed');
    firebaseAuthSdk.createUserWithEmailAndPassword.mockRejectedValueOnce(err);
    await expect(signUp('a@b.com', 'secret')).rejects.toThrow('signup failed');
  });

  test('signIn calls signInWithEmailAndPassword', async () => {
    const userCredential = { user: { uid: 'u2' } };
    firebaseAuthSdk.signInWithEmailAndPassword.mockResolvedValueOnce(userCredential);

    const result = await signIn('b@b.com', 'pw');

    expect(firebaseAuthSdk.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      'b@b.com',
      'pw'
    );
    expect(result).toBe(userCredential);
  });

  test('signIn propagates errors', async () => {
    const err = new Error('signin failed');
    firebaseAuthSdk.signInWithEmailAndPassword.mockRejectedValueOnce(err);
    await expect(signIn('x@y.com', 'pw')).rejects.toThrow('signin failed');
  });

  test('signUpWithGoogle uses GoogleAuthProvider and signInWithPopup', async () => {
    const userCredential = { user: { uid: 'g1' } };
    firebaseAuthSdk.signInWithPopup.mockResolvedValueOnce(userCredential);

    const result = await signUpWithGoogle();

    // Constructor was invoked
    expect(firebaseAuthSdk.GoogleAuthProvider).toHaveBeenCalledTimes(1);

    // signInWithPopup called with auth and provider
    expect(firebaseAuthSdk.signInWithPopup).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    );

    expect(result).toBe(userCredential);
  });

  test('signUpWithGoogle propagates errors', async () => {
    const err = new Error('popup blocked');
    firebaseAuthSdk.signInWithPopup.mockRejectedValueOnce(err);
    await expect(signUpWithGoogle()).rejects.toThrow('popup blocked');
  });

  test('signInWithGoogle creates Firestore doc for new user and returns isNewUser=true', async () => {
    const user = { uid: 'newbie', email: 'new@user.com' };
    firebaseAuthSdk.signInWithPopup.mockResolvedValueOnce({ user });
    firestoreSdk.getDoc.mockResolvedValueOnce({ exists: () => false });

    const res = await signInWithGoogle('1.2.3.4');

    expect(firestoreSdk.getDoc).toHaveBeenCalled();
    expect(firestoreSdk.setDoc).toHaveBeenCalledTimes(1);
    const [docRef, data] = firestoreSdk.setDoc.mock.calls[0];
    expect(docRef).toEqual({ coll: 'users', id: 'newbie' });
    expect(data).toEqual(
      expect.objectContaining({
        userId: 'newbie',
        email: 'new@user.com',
        ipAddress: '1.2.3.4',
      })
    );
    // createdAt is Date
    expect(data.createdAt).toBeInstanceOf(Date);

    expect(res).toEqual({ isNewUser: true, user });
  });

  test('signInWithGoogle updates Firestore for existing user and returns isNewUser=false', async () => {
    const user = { uid: 'oldie', email: 'old@user.com' };
    firebaseAuthSdk.signInWithPopup.mockResolvedValueOnce({ user });
    firestoreSdk.getDoc.mockResolvedValueOnce({ exists: () => true });

    const res = await signInWithGoogle('5.6.7.8');

    expect(firestoreSdk.updateDoc).toHaveBeenCalledTimes(1);
    const [docRef, patch] = firestoreSdk.updateDoc.mock.calls[0];
    expect(docRef).toEqual({ coll: 'users', id: 'oldie' });
    expect(patch).toEqual({ ipAddress: '5.6.7.8' });

    expect(res).toEqual({ isNewUser: false, user });
  });

  test('forgotPassword delegates to sendPasswordResetEmail and returns true', async () => {
    firebaseAuthSdk.sendPasswordResetEmail.mockResolvedValueOnce(undefined);
    const ok = await forgotPassword('who@ever.com');
    expect(firebaseAuthSdk.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.any(Object),
      'who@ever.com'
    );
    expect(ok).toBe(true);
  });

  test('forgotPassword propagates errors', async () => {
    const err = new Error('throttled');
    firebaseAuthSdk.sendPasswordResetEmail.mockRejectedValueOnce(err);
    await expect(forgotPassword('a@b.com')).rejects.toThrow('throttled');
  });
});
