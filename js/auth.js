// js/auth.js
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ✅ Check login state when the page loads
console.log("Checking auth state on page load...");
onAuthStateChanged(auth, (user) => {
  const currentPath = window.location.pathname;

  if (user) {
    console.log("✅ User is logged in:", user.email);

    // Redirect to dashboard.html if user is on a login/register page
    if (
      currentPath.includes("index.html") || // login page renamed
      currentPath.includes("auth-basic-forgot-password.html")
    ) {
      console.log("➡️ Redirecting to dashboard.html...");
      window.location.href = "dashboard.html";
    }
  } else {
    console.log("❌ User not logged in");

    // Redirect to login page if not logged in
    if (!currentPath.includes("index.html")) { // login page renamed
      console.log("➡️ Redirecting to login...");
      window.location.href = "index.html";
    }
  }
});

// ✅ Login function
export function login(email, password) {
  console.log("Attempting login with email:", email);
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("✅ Login successful:", userCredential.user.email);
      window.location.href = "dashboard.html"; // redirect after login
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
      window.location.href = "index.html"; // redirect after logout
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
