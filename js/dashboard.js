import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Initialize database
const db = getDatabase();

// ✅ Check login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    console.log("User is logged in:", user.email);
    fetchAndDisplayUsers();
  }
});

// Logout
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
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
  }
});

// Fetch users from Firebase
async function fetchAndDisplayUsers() {
  const usersRef = ref(db, "users"); // change "users" to your Firebase node
  try {
    const snapshot = await get(usersRef);
    let totalUsers = 0;
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      totalUsers = Object.keys(usersData).length;
      console.log("Total Users:", totalUsers);
    }

    // Display in dashboard cards
    document.getElementById("totalUsersYear").innerText = totalUsers;  // Year
    document.getElementById("totalUsersMonth").innerText = totalUsers; // Month
    document.getElementById("totalUsersWeek").innerText = totalUsers;  // Week

  } catch (error) {
    console.error("Error fetching users:", error);
  }
}
