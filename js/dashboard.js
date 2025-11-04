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
  const usersRef = ref(db, "users"); // your users node
  try {
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      console.log("No users found");
      return;
    }

    const usersData = snapshot.val();
    const allUserIds = Object.keys(usersData);
    const now = Date.now();

    let totalUsersYear = allUserIds.length; // total users
    let totalUsersMonth = 0;
    let totalUsersWeek = 0;

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    allUserIds.forEach((uid) => {
  const user = usersData[uid];

  if (user.subcription) {
    const productStartTime = Number(user.subcription.trial.productStart);

    const daysSinceStart = (now - productStartTime) / (1000 * 60 * 60 * 24); // convert ms to days

    console.log(`UserID: ${uid}`);
    console.log(`Product Start Timestamp: ${productStartTime}`);
    console.log(`Days since product start: ${daysSinceStart.toFixed(2)}`);

    if (now - productStartTime <= THIRTY_DAYS_MS) {
      totalUsersMonth++;
      console.log("✅ User counted for last 30 days");
    }

    if (now - productStartTime <= SEVEN_DAYS_MS) {
      totalUsersWeek++;
      console.log("✅ User counted for last 7 days");
    }

  } else {
    console.log(`UserID: ${user.subcription} has no trial productStart`);
  }
});


    // Update dashboard cards
    document.getElementById("totalUsersYear").innerText = totalUsersYear;
    document.getElementById("totalUsersMonth").innerText = totalUsersMonth;
    document.getElementById("totalUsersWeek").innerText = totalUsersWeek;

    console.log({
      totalUsersYear,
      totalUsersMonth,
      totalUsersWeek,
    });

  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

