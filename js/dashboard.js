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

// Helper function to format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fetch users from Firebase
async function fetchAndDisplayUsers() {
  const usersRef = ref(db, "users");
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

    console.log("=== Starting User Analysis ===");
    console.log(`Current time: ${formatDate(now)}`);
    console.log(`Total users in database: ${totalUsersYear}`);
    console.log("---");

    allUserIds.forEach((uid) => {
      const user = usersData[uid];

      // Check if user has subscription with trial data
      if (user.subscription && user.subscription.trial && user.subscription.trial.productStart) {
        const subscriptionData = user.subscription;
        const productStartTime = Number(subscriptionData.trial.productStart);

        // FIX 2: Validate that productStartTime is a valid number
        if (isNaN(productStartTime) || productStartTime <= 0) {
          console.log(`UserID: ${uid} - Invalid productStart value: ${subscriptionData.trial.productStart}`);
          return;
        }

        const daysSinceStart = (now - productStartTime) / (1000 * 60 * 60 * 24);

        console.log(`UserID: ${uid}`);
        console.log(`Product Start: ${formatDate(productStartTime)} (${productStartTime}ms)`);
        console.log(`Days since start: ${daysSinceStart.toFixed(2)} days`);

        // FIX 3: Check if productStart is in the PAST (not future)
        if (productStartTime > now) {
          console.log("⚠️ Product start is in the future - skipping");
          console.log("---");
          return;
        }

        // Count for last 30 days
        if (now - productStartTime <= THIRTY_DAYS_MS) {
          totalUsersMonth++;
          console.log("✅ Counted for last 30 days");
        }

        // Count for last 7 days
        if (now - productStartTime <= SEVEN_DAYS_MS) {
          totalUsersWeek++;
          console.log("✅ Counted for last 7 days");
        }

        console.log("---");

      } else {
        // FIX 4: Better logging for users without trial data
        console.log(`UserID: ${uid} - No trial productStart found`);
        console.log("---");
      }
    });

    console.log("=== Summary ===");
    console.log(`Total users (all time): ${totalUsersYear}`);
    console.log(`Users with trial in last 30 days: ${totalUsersMonth}`);
    console.log(`Users with trial in last 7 days: ${totalUsersWeek}`);

    // Update dashboard cards
    const yearElement = document.getElementById("totalUsersYear");
    const monthElement = document.getElementById("totalUsersMonth");
    const weekElement = document.getElementById("totalUsersWeek");

    if (yearElement) yearElement.innerText = totalUsersYear;
    if (monthElement) monthElement.innerText = totalUsersMonth;
    if (weekElement) weekElement.innerText = totalUsersWeek;

    // FIX 5: Log if elements are missing
    if (!yearElement || !monthElement || !weekElement) {
      console.warn("⚠️ Some dashboard elements not found:");
      if (!yearElement) console.warn("- #totalUsersYear not found");
      if (!monthElement) console.warn("- #totalUsersMonth not found");
      if (!weekElement) console.warn("- #totalUsersWeek not found");
    }

  } catch (error) {
    console.error("Error fetching users:", error);
    console.error("Error details:", error.message);
  }
}