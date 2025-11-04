import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Redirect to login if not authenticated
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    console.log("User is logged in:", user.email);
  }
});

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) {
    console.error("Logout button not found!");
    return;
  }

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      console.log("User logged out successfully!");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed: " + error.message);
    }
  });
});
