// Firebase auth helpers: sign up/in flows, Google popup, password reset, and basic user doc wiring.
import { auth, db } from "./config";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Email/password signup
export async function signUp(email, password, ipAddress) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await sendEmailVerification(userCredential.user);
    const userDocRef = doc(db, "users", user.uid);
     const userDoc = await getDoc(userDocRef);
     if (!userDoc.exists()) {
      // New user → Store minimal data including userId and lastIP
      await setDoc(userDocRef, {
        userId: user.uid,
        email: user.email,
        createdAt: new Date(),
        lastIP: ipAddress || null,
        
        
      });
      return { isNewUser: true, user };
    } else {
      // Existing user → Always update lastIP
      await updateDoc(userDocRef, {
        lastIP: ipAddress || null,
      });
      return { isNewUser: false, user };
    }

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


// ...existing code...
export async function signInWithGoogle(ipAddress) {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
  console.log("Auth", ipAddress);

    if (!userDoc.exists()) {
      // New user → Store minimal data including userId and IP
      await setDoc(userDocRef, {
        userId: user.uid,
        email: user.email,
        createdAt: new Date(),
        lastIP: ipAddress || null,
        
        
      });
      return { isNewUser: true, user };
    } else {
      // Existing user → Always update lastIP
      await updateDoc(userDocRef, {
        lastIP: ipAddress || null,
      });
      return { isNewUser: false, user };
    }
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

async function saveUserIP(uid, ip) {
  try {
    await updateDoc(doc(db, "users", uid), {
      lastIP: ip,
      
    });
  } catch (err) {
    console.warn("Could not save user IP:", err);
  }
}

export { auth, onAuthStateChanged };