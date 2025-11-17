import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Initialize database
const db = getDatabase();

// Cached current visible users for client-side search/filter
let currentUsers = [];

// Full unfiltered list (all users with activity) to support 'All Users' view
let fullUserList = [];

// ✅ Auth check
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    console.log("User is logged in:", user.email);
    document.getElementById("user-email").textContent = user.email;
    fetchAndDisplayUsers();
  }
});

// ✅ Logout handler
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
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

  // Sidebar toggle
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const closeSidebar = document.getElementById("close-sidebar");
  const overlay = document.getElementById("overlay");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }
});

// ✅ Helper: format timestamp to readable date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ✅ Fetch users from Firebase
async function fetchAndDisplayUsers(customDays = 7) {
  const usersRef = ref(db, "users");
  try {
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      console.log("No users found");
      updateTable([]);
      return;
    }

    const usersData = snapshot.val();
    const allUserIds = Object.keys(usersData);
    const now = Date.now();

    let totalUsersYear = allUserIds.length;
    let totalUsersMonth = 0;
    let totalUsersWeek = 0;

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const userList = [];

    allUserIds.forEach((uid) => {
      const user = usersData[uid];
      let email = "";
      let username = "";
      let lastUpdate = 0;

      // ✅ Extract profile data
      if (user.profile) {
        const profileKeys = Object.keys(user.profile);
        if (profileKeys.length > 0) {
          const firstProfileKey = profileKeys[0];
          const profileData = user.profile[firstProfileKey];
          email = profileData.email || "";
          username = profileData.username || "";
        }
      }

      // Sections containing transactions
      const sections = [
        "lot",
        "buy_transactions",
        "sell_transactions",
        "due_transactions",
        "expenses",
      ];

      const times = [];

      sections.forEach((section) => {
        if (user[section]) {
          Object.values(user[section]).forEach((tx) => {
            if (tx.transactionId) {
              const t = Number(tx.transactionId);
              if (!isNaN(t)) times.push(t);
            }
          });
        }
      });

      lastUpdate = Math.max(...times, 0);
      if (!lastUpdate) return;

      // Count for 7 / 30 days
      if (now - lastUpdate <= THIRTY_DAYS_MS) totalUsersMonth++;
      if (now - lastUpdate <= SEVEN_DAYS_MS) totalUsersWeek++;

      userList.push({
        uid,
        email,
        username,
        lastUpdate,
      });
    });

    // Update dashboard summary
    document.getElementById("totalUsersYear").innerText = totalUsersYear;
    document.getElementById("totalUsersMonth").innerText = totalUsersMonth;
    document.getElementById("totalUsersWeek").innerText = totalUsersWeek;

    // ✅ Sort by most recent activity
    userList.sort((a, b) => b.lastUpdate - a.lastUpdate);

    const CUSTOM_DAYS_MS = customDays * 24 * 60 * 60 * 1000;
    const filteredUsers = userList.filter(user => (now - user.lastUpdate) <= CUSTOM_DAYS_MS);

    document.getElementById("userTitle").innerText = "Users = " + filteredUsers.length;
    
    // cache for search and full list
    currentUsers = filteredUsers;
    fullUserList = userList;
    updateTable(filteredUsers);

    console.log("=== Summary ===");
    console.log(`Total users (all time): ${totalUsersYear}`);
    console.log(`Users active in last 30 days: ${totalUsersMonth}`);
    console.log(`Users active in last 7 days: ${totalUsersWeek}`);
  } catch (error) {
    console.error("Error fetching users:", error);
    alert("Error loading users: " + error.message);
  }
}

// ✅ Refresh button click handler
const btnRefresh = document.getElementById("btnRefresh");
if (btnRefresh) {
  btnRefresh.addEventListener("click", () => {
    const daysInput = document.getElementById("daysInput").value.trim();
    const days = parseInt(daysInput) || 7; // default 7 if invalid
    fetchAndDisplayUsers(days);
  });
}

// ✅ Live search: filter currentUsers by input
const userSearchEl = document.getElementById('userSearch');
if (userSearchEl) {
  userSearchEl.addEventListener('input', (e) => {
    const q = (e.target.value || '').trim().toLowerCase();
    if (!q) {
      // empty -> show all cached users
      updateTable(currentUsers);
      document.getElementById("userTitle").innerText = "Users = " + currentUsers.length;
      return;
    }

    const matched = currentUsers.filter(u => {
      const email = (u.email || '').toLowerCase();
      const uid = (u.uid || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      const last = formatDate(u.lastUpdate).toLowerCase();
      return email.includes(q) || uid.includes(q) || username.includes(q) || last.includes(q);
    });

    updateTable(matched);
    document.getElementById("userTitle").innerText = "Users = " + matched.length;
  });
}

// ✅ All Users button: show the complete unfiltered user list
const btnAllUsers = document.getElementById('btnAllUsers');
if (btnAllUsers) {
  btnAllUsers.addEventListener('click', () => {
    // show full list (sorted)
    currentUsers = fullUserList.slice();
    updateTable(currentUsers);
    document.getElementById("userTitle").innerText = "Users = " + currentUsers.length;
    // clear search input
    if (userSearchEl) userSearchEl.value = '';
    // reset days to 7
    document.getElementById("daysInput").value = '7';
  });
}

// ✅ Render user data in table
function updateTable(users) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  if (!users.length) {
    tbody.innerHTML = `
      <tr><td colspan="4" class="text-center py-4 text-muted">No users found</td></tr>
    `;
    return;
  }

  users.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.email || "-"}</td>
      <td>${user.uid}</td>
      <td>${user.username || "-"}</td>
      <td>${formatDate(user.lastUpdate)}</td>
    `;
    tbody.appendChild(row);
  });
}
