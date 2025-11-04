import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Redirect if user not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html"; // login page
  } else {
    console.log("User logged in:", user.email);
  }
});

// Logout button
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) {
    console.error("Logout button not found!");
    return;
  }

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // prevent default <a> behavior
    try {
      await signOut(auth);
      console.log("User logged out");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout error:", error);
    }
  });
});
