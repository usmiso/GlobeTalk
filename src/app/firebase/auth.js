import { auth, db } from "./config";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";


//const auth = getAuth(app);

// Email/password signup
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential; // Return full UserCredential
  } catch (error) {
    throw error;
  }
}

// Google signup
export async function signUpWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result; // Return full UserCredential
  } catch (error) {
    throw error;
  }
}

// Email/password signin
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential; // Return full UserCredential
  } catch (error) {
    throw error;
  }
}


export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // New user → Store minimal data including userId
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: user.email,
        createdAt: new Date(),
      });
      return { isNewUser: true, user };
    }

    return { isNewUser: false, user };
  } catch (error) {
    throw error;
  }
}


// Forgot password
export async function forgotPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw error;
  }
}

export { auth, onAuthStateChanged };
// Mock auth
    jest.mock('../app/firebase/auth', () => ({
        auth: {
            currentUser: { uid: 'user123' },
        },
    }));

