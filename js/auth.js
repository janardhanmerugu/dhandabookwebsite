// js/auth.js
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ✅ Check login state when the page loads (no public page logic)
console.log("Checking auth state on page load...");
onAuthStateChanged(auth, (user) => {
  const currentPath = window.location.pathname;

  if (user) {
    console.log("✅ User is logged in:", user.email);

    // Only redirect if user is on login/register/forgot pages
    if (
      currentPath.includes("auth-basic-login.html") ||
      currentPath.includes("auth-basic-register.html") ||
      currentPath.includes("auth-basic-forgot-password.html")
    ) {
      console.log("➡️ Redirecting to dashboard...");
      window.location.href = "dashboard.html";
    }
  } else {
    console.log("❌ User not logged in");

    // Redirect to login only if not already there
    if (!currentPath.includes("auth-basic-login.html")) {
      console.log("➡️ Redirecting to login...");
      window.location.href = "auth-basic-login.html";
    }
  }
});

// ✅ Login function
export function login(email, password) {
  console.log("Attempting login with email:", email);
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("✅ Login successful:", userCredential.user.email);
      window.location.href = "dashboard.html";
      return userCredential;
    })
    .catch((error) => {
      console.error("❌ Login failed:", error.code, error.message);
      throw error; // Pass error back for display
    });
}

// ✅ Logout function
export function logout() {
  console.log("Logging out...");
  return signOut(auth)
    .then(() => {
      console.log("✅ Logout successful");
      window.location.href = "auth-basic-login.html";
    })
    .catch((error) => {
      console.error("❌ Logout failed:", error);
      throw error;
    });
}

// ✅ Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// ✅ Check if user is logged in (synchronous)
export function isUserLoggedIn() {
  return auth.currentUser !== null;
}