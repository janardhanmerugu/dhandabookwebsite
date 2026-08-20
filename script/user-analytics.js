import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// ------------------------------
// Basic rules for "Highly Active" users
// Example: a user is highly active if they have:
// - 5 or more lots
// - 10 or more buy transactions
// - 10 or more sell transactions
// ------------------------------
const DEFAULT_ACTIVITY_THRESHOLD = {
  lots: 5,
  buys: 10,
  sells: 10
};

// ------------------------------
// Global app state for this page
// This keeps the current users, filtered users, and page state in one place.
// ------------------------------
const STATE = {
  users: [],
  filteredUsers: [],
  page: 1,
  pageSize: 10,
  selectedUser: null,
  analyticsByUser: []
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('en-IN');

const summaryCardsContainer = document.getElementById('analytics-summary-cards');
const activitySummaryContainer = document.getElementById('activity-summary-cards');
const analyticsTableBody = document.getElementById('analytics-table-body');
const searchInput = document.getElementById('analytics-search');
const activityFilter = document.getElementById('activity-filter');
const lotFilter = document.getElementById('lot-filter');
const buyFilter = document.getElementById('buy-filter');
const sellFilter = document.getElementById('sell-filter');
const dateFilter = document.getElementById('date-filter');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');
const customDateGroup = document.getElementById('custom-date-group');
const prevPageButton = document.getElementById('analytics-prev-page');
const nextPageButton = document.getElementById('analytics-next-page');
const pageIndicator = document.getElementById('analytics-page-indicator');
const modalBackdrop = document.getElementById('analytics-modal-backdrop');
const closeModalButton = document.getElementById('close-analytics-modal');
const modalUserTitle = document.getElementById('modal-user-title');
const modalUserBadge = document.getElementById('modal-user-badge');
const userInfoGrid = document.getElementById('user-info-grid');
const userActivityGrid = document.getElementById('user-activity-grid');
const recentTransactionsList = document.getElementById('recent-transactions-list');
const mostActiveUsersBody = document.getElementById('most-active-users-body');

const safeNumber = (value) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
};

const formatDate = (value, fallback = '-') => {
  if (!value) return fallback;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return fallback;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (value, fallback = '-') => {
  if (!value) return fallback;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return fallback;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const normalizeString = (value) => (value ?? '').toString().trim();

const toDisplayName = (user) => {
  if (!user) return 'Unknown User';
  const value = user.name || user.businessName || user.business_name || user.username || user.email || user.userName || user.uid;
  return normalizeString(value) || user.uid || 'Unknown User';
};

const getUserId = (user) => user && (user.uid || user.userId || user.id || user.user_id || 'unknown');

// ------------------------------
// FIX: your Realtime Database data model is:
//   users/{uid}/lot/{lotId}
//   users/{uid}/buy_transactions/{txId}   (has a "clientId" = the shop's customer, NOT the app user)
//   users/{uid}/sell_transactions/{txId}  (has a "customerId" = the shop's customer, NOT the app user)
//
// The previous version tried to guess a "real owner" for every record by
// checking fields like clientId/customerId/createdBy/etc. Those fields are
// business-entity IDs (who the sale was made to), not Firebase Auth user IDs.
// That caused every distinct clientId/customerId to spawn a *phantom user*
// in the analytics (39 real users -> 209 "users" once transactions were
// scanned). Ownership under Realtime Database is 100% determined by the
// path itself: whichever {uid} the record lives under is the owner. Full stop.
// ------------------------------

// ------------------------------
// FIX: profile is a FLAT object directly under users/{uid}/profile, e.g.
//   { businessName, email, phoneNumber, username, ... }
// The previous code did `Object.values(profile)[0]`, assuming profile was
// keyed by some inner id (like { someId: { businessName, email, ... } }).
// That grabbed the wrong field entirely (often the empty "address" string),
// which is why names/emails/phones were showing blank or wrong.
// ------------------------------
const getUserProfileInfo = (userNode, uid) => {
  const profile = userNode?.profile || {};

  return {
    uid,
    userId: uid,
    name: normalizeString(profile.username || profile.name || profile.fullName || profile.displayName),
    businessName: normalizeString(profile.businessName || profile.business_name || profile.companyName),
    phone: normalizeString(profile.phoneNumber || profile.phone || profile.mobile || profile.contact),
    email: normalizeString(profile.email),
    createdAt: safeNumber(profile.transactionId || profile.createdAt || profile.created_at || profile.registrationDate || profile.registeredAt)
  };
};

function classifyUser(userAnalytics) {
  const { lots, buys, sells } = userAnalytics;

  if (lots === 0 && buys === 0 && sells === 0) return 'No Activity';
  if (lots > 0 && buys === 0 && sells === 0) return 'Lot Creator';
  if (buys > 0 && sells === 0) return 'Buyer';
  if (sells > 0 && buys === 0) return 'Seller';
  if (buys > 0 && sells > 0) {
    return userAnalytics.isHighlyActive ? 'Highly Active' : 'Active Trader';
  }
  return 'Active';
}

function isHighlyActive(userAnalytics) {
  const lots = userAnalytics.lots || 0;
  const buys = userAnalytics.buyTransactions || 0;
  const sells = userAnalytics.sellTransactions || 0;

  return lots >= DEFAULT_ACTIVITY_THRESHOLD.lots || buys >= DEFAULT_ACTIVITY_THRESHOLD.buys || sells >= DEFAULT_ACTIVITY_THRESHOLD.sells;
}

function createUserEntry(uid, userNode) {
  const profile = getUserProfileInfo(userNode, uid);

  return {
    uid,
    ...profile,
    name: profile.name || userNode?.business_name || userNode?.username || uid,
    businessName: profile.businessName || userNode?.business_name || '',
    lots: 0,
    buyTransactions: 0,
    sellTransactions: 0,
    buyQuantity: 0,
    sellQuantity: 0,
    buyValue: 0,
    sellValue: 0,
    lotIds: [],
    buyIds: [],
    sellIds: [],
    firstActivity: null,
    lastActivity: null,
    activityLabel: 'No Activity'
  };
}

// ------------------------------
// This is the heart of the analytics page.
// We read all users once and build a summary for each user.
// Total Users == users.children.count (Object.keys(STATE.users).length),
// exactly like `snapshot.child('users').numChildren()` in Firebase terms.
// Every lot/buy/sell record is always attributed to the {uid} it's nested
// under - no more owner-guessing, no more phantom users.
// ------------------------------
function buildAnalytics() {
  const usersMap = new Map();
  const lotsByUser = new Map();
  const buysByUser = new Map();
  const sellsByUser = new Map();

  const allUserEntries = Object.entries(STATE.users || {});

  // Total Users = users.children.count, i.e. exactly the number of top-level
  // nodes under `users/` - nothing added, nothing removed.
  const totalUsers = allUserEntries.length;

  allUserEntries.forEach(([uid, userNode]) => {
    const user = createUserEntry(uid, userNode);
    usersMap.set(uid, user);

    // ---- Lots ----
    const lotEntries = Object.entries(userNode?.lot || {});
    lotEntries.forEach(([lotId, lot]) => {
      const date = safeNumber(lot.date || lot.createdAt || lot.updatedAt || 0);
      user.lots += 1;
      user.lotIds.push(String(lotId));
      user.firstActivity = user.firstActivity ? Math.min(user.firstActivity, date) : date;
      user.lastActivity = user.lastActivity ? Math.max(user.lastActivity, date) : date;

      const arr = lotsByUser.get(uid) || [];
      arr.push({ lotId, ...lot });
      lotsByUser.set(uid, arr);
    });

    // ---- Buy transactions ----
    const buyEntries = Object.entries(userNode?.buy_transactions || {});
    buyEntries.forEach(([txId, tx]) => {
      const quantity = safeNumber(tx.quantity || tx.qty || 0);
      const total = safeNumber(tx.total || tx.amount || tx.value || 0);
      const date = safeNumber(tx.date || tx.createdAt || tx.transactionDate || tx.timestamp || 0);

      user.buyTransactions += 1;
      user.buyQuantity += quantity;
      user.buyValue += total;
      user.firstActivity = user.firstActivity ? Math.min(user.firstActivity, date) : date;
      user.lastActivity = user.lastActivity ? Math.max(user.lastActivity, date) : date;

      const arr = buysByUser.get(uid) || [];
      arr.push({ txId, ...tx });
      buysByUser.set(uid, arr);
    });

    // ---- Sell transactions ----
    const sellEntries = Object.entries(userNode?.sell_transactions || {});
    sellEntries.forEach(([txId, tx]) => {
      const quantity = safeNumber(tx.quantity || tx.qty || 0);
      const total = safeNumber(tx.total || tx.amount || tx.value || 0);
      const date = safeNumber(tx.date || tx.createdAt || tx.transactionDate || tx.timestamp || 0);

      user.sellTransactions += 1;
      user.sellQuantity += quantity;
      user.sellValue += total;
      user.firstActivity = user.firstActivity ? Math.min(user.firstActivity, date) : date;
      user.lastActivity = user.lastActivity ? Math.max(user.lastActivity, date) : date;

      const arr = sellsByUser.get(uid) || [];
      arr.push({ txId, ...tx });
      sellsByUser.set(uid, arr);
    });
  });

  // Final per-user analytics object used by the table, cards, charts, and modal.
  const analytics = [...usersMap.values()].map((user) => {
    const lots = user.lots || 0;
    const buys = user.buyTransactions || 0;
    const sells = user.sellTransactions || 0;
    const highlyActive = isHighlyActive({ lots, buys, sells });

    return {
      ...user,
      totalTransactions: buys + sells,
      isHighlyActive: highlyActive,
      activityLabel: classifyUser({ lots, buys, sells, isHighlyActive: highlyActive }),
      recentTransactions: [...(buysByUser.get(user.uid) || []), ...(sellsByUser.get(user.uid) || []), ...(lotsByUser.get(user.uid) || [])]
        .sort((a, b) => (Number(b.date || b.createdAt || b.timestamp || 0) || 0) - (Number(a.date || a.createdAt || a.timestamp || 0) || 0))
        .slice(0, 8)
    };
  });

  analytics.forEach((user) => {
    if (!user.firstActivity && user.recentTransactions.length) {
      user.firstActivity = Number(Math.min(...user.recentTransactions.map((item) => Number(item.date || item.createdAt || item.timestamp || 0)))) || null;
    }
    if (!user.lastActivity && user.recentTransactions.length) {
      user.lastActivity = Number(Math.max(...user.recentTransactions.map((item) => Number(item.date || item.createdAt || item.timestamp || 0)))) || null;
    }
  });

  // ---- Summary numbers, all derived from the SAME 39-user (or however many
  // you actually have) analytics array - no double counting possible now ----
  const usersWithLots = analytics.filter((u) => u.lots > 0).length;
  const usersWithBuys = analytics.filter((u) => u.buyTransactions > 0).length;
  const usersWithSells = analytics.filter((u) => u.sellTransactions > 0).length;
  const activeUsers = analytics.filter((u) => u.lots > 0 || u.buyTransactions > 0 || u.sellTransactions > 0).length;
  const inactiveUsers = analytics.filter((u) => u.lots === 0 && u.buyTransactions === 0 && u.sellTransactions === 0).length;
  const usersWithBuyAndSell = analytics.filter((u) => u.buyTransactions > 0 && u.sellTransactions > 0).length;
  const usersWithLotsOnly = analytics.filter((u) => u.lots > 0 && u.buyTransactions === 0 && u.sellTransactions === 0).length;
  const usersWithBuyOnly = analytics.filter((u) => u.buyTransactions > 0 && u.sellTransactions === 0 && u.lots === 0).length;
  const usersWithSellOnly = analytics.filter((u) => u.sellTransactions > 0 && u.buyTransactions === 0 && u.lots === 0).length;
  const highlyActiveUsers = analytics.filter((u) => u.isHighlyActive).length;

  const summaryCards = [
    { label: 'Total Users', value: totalUsers, icon: '👥', tone: 'positive' },
    { label: 'Users With Lots', value: usersWithLots, icon: '🏷️', tone: 'positive' },
    { label: 'Users With Buy Transactions', value: usersWithBuys, icon: '🛒', tone: 'positive' },
    { label: 'Users With Sell Transactions', value: usersWithSells, icon: '💰', tone: 'positive' },
    { label: 'Active Users', value: activeUsers, icon: '✅', tone: 'positive' },
    { label: 'Inactive Users', value: inactiveUsers, icon: '⭕', tone: 'warning' }
  ];

  const summaryActivity = [
    { label: 'Users with Lots', value: usersWithLots },
    { label: 'Users with Buys', value: usersWithBuys },
    { label: 'Users with Sells', value: usersWithSells },
    { label: 'Users with Buy + Sell', value: usersWithBuyAndSell },
    { label: 'Users with Lots Only', value: usersWithLotsOnly },
    { label: 'Highly Active Users', value: highlyActiveUsers }
  ];

  renderSummaryCards(summaryCards);
  renderActivitySummary(summaryActivity);
  renderTopUsers(analytics);

  STATE.analyticsByUser = analytics;
  applyFilters();

  renderDistributionChart({
    noActivity: inactiveUsers,
    lotsOnly: usersWithLotsOnly,
    buyOnly: usersWithBuyOnly,
    sellOnly: usersWithSellOnly,
    buyAndSell: usersWithBuyAndSell
  });

  renderActivityTimeline(analytics);
}

function renderSummaryCards(items) {
  summaryCardsContainer.innerHTML = items.map((item) => `
    <div class="stat-card">
      <div class="stat-header">
        <h3>${item.label}</h3>
        <span class="stat-icon">${item.icon}</span>
      </div>
      <div class="stat-value">${numberFormatter.format(item.value)}</div>
      <div class="stat-change ${item.tone === 'warning' ? 'warning' : 'positive'}">Updated</div>
    </div>
  `).join('');
}

function renderActivitySummary(items) {
  activitySummaryContainer.innerHTML = items.map((item) => `
    <div class="summary-card">
      <div class="summary-label">${item.label}</div>
      <div class="summary-value">${numberFormatter.format(item.value)}</div>
    </div>
  `).join('');
}

function getFilteredUsers() {
  const searchTerm = normalizeString(searchInput?.value || '').toLowerCase();
  const activityValue = activityFilter?.value || 'all';
  const lotValue = lotFilter?.value || 'all';
  const buyValue = buyFilter?.value || 'all';
  const sellValue = sellFilter?.value || 'all';
  const dateValue = dateFilter?.value || 'all-time';

  const lowerBoundDate = resolveDateRange(dateValue);

  return STATE.analyticsByUser.filter((user) => {
    const matchesSearch = !searchTerm || [
      user.uid,
      user.name,
      user.businessName,
      user.phone,
      user.email
    ].some((field) => normalizeString(field).toLowerCase().includes(searchTerm));

    const matchesActivity = matchesActivityFilter(user, activityValue);
    const matchesLots = matchesThreshold(user.lots, lotValue);
    const matchesBuys = matchesThreshold(user.buyTransactions, buyValue);
    const matchesSells = matchesThreshold(user.sellTransactions, sellValue);
    const matchesDate = matchesDateFilter(user, lowerBoundDate, dateValue);

    return matchesSearch && matchesActivity && matchesLots && matchesBuys && matchesSells && matchesDate;
  });
}

function matchesActivityFilter(user, value) {
  if (value === 'all') return true;

  switch (value) {
    case 'no-activity':
      return user.lots === 0 && user.buyTransactions === 0 && user.sellTransactions === 0;
    case 'has-lots':
      return user.lots > 0;
    case 'has-buys':
      return user.buyTransactions > 0;
    case 'has-sells':
      return user.sellTransactions > 0;
    case 'has-buy-sell':
      return user.buyTransactions > 0 && user.sellTransactions > 0;
    case 'highly-active':
      return user.isHighlyActive;
    default:
      return true;
  }
}

function matchesThreshold(value, threshold) {
  const count = safeNumber(value);
  if (threshold === 'all') return true;
  if (threshold === '0') return count === 0;
  if (threshold === '1+') return count >= 1;
  if (threshold === '5+') return count >= 5;
  if (threshold === '10+') return count >= 10;
  return true;
}

function matchesDateFilter(user, startDate, dateValue) {
  if (dateValue === 'all-time') return true;
  if (dateValue === 'custom') {
    if (!dateFrom.value || !dateTo.value) return true;
    const from = new Date(dateFrom.value).getTime();
    const to = new Date(dateTo.value).getTime();
    const lastActivity = Number(user.lastActivity || 0);
    return lastActivity >= from && lastActivity <= to + 86400000;
  }

  const lastActivity = Number(user.lastActivity || 0);
  if (!lastActivity || !startDate) return true;
  return lastActivity >= startDate;
}

function resolveDateRange(dateValue) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (dateValue === 'today') return now - dayMs;
  if (dateValue === 'last-7-days') return now - (7 * dayMs);
  if (dateValue === 'last-30-days') return now - (30 * dayMs);
  if (dateValue === 'last-3-months') return now - (90 * dayMs);
  if (dateValue === 'last-6-months') return now - (180 * dayMs);
  if (dateValue === 'this-year') {
    return new Date(new Date().getFullYear(), 0, 1).getTime();
  }
  return null;
}

function applyFilters() {
  const filteredUsers = getFilteredUsers();
  STATE.filteredUsers = filteredUsers;
  STATE.page = 1;
  renderUserTable(filteredUsers);
}

function renderUserTable(users) {
  const startIndex = (STATE.page - 1) * STATE.pageSize;
  const pageItems = users.slice(startIndex, startIndex + STATE.pageSize);

  analyticsTableBody.innerHTML = '';

  if (!pageItems.length) {
    analyticsTableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">No matching users found.</td></tr>';
    pageIndicator.textContent = 'Page 0';
    prevPageButton.disabled = true;
    nextPageButton.disabled = true;
    return;
  }

  pageItems.forEach((user) => {
    const row = document.createElement('tr');
    row.classList.add('analytics-row');
    row.innerHTML = `
      <td><button class="table-user-button" data-user-id="${user.uid}">${toDisplayName(user)}</button></td>
      <td>${numberFormatter.format(user.lots)}</td>
      <td>${numberFormatter.format(user.buyTransactions)}</td>
      <td>${numberFormatter.format(user.sellTransactions)}</td>
      <td>${numberFormatter.format(user.buyQuantity)}</td>
      <td>${numberFormatter.format(user.sellQuantity)}</td>
      <td>${currencyFormatter.format(user.buyValue)}</td>
      <td>${currencyFormatter.format(user.sellValue)}</td>
      <td>${formatDate(user.lastActivity)}</td>
      <td><span class="badge ${user.isHighlyActive ? 'badge--high' : ''}">${user.activityLabel}</span></td>
    `;

    row.querySelector('.table-user-button').addEventListener('click', () => openUserModal(user.uid));
    analyticsTableBody.appendChild(row);
  });

  const totalPages = Math.max(1, Math.ceil(users.length / STATE.pageSize));
  pageIndicator.textContent = `Page ${Math.min(STATE.page, totalPages)} of ${totalPages}`;
  prevPageButton.disabled = STATE.page <= 1;
  nextPageButton.disabled = STATE.page >= totalPages;
}

// ------------------------------
// Top 10 users by activity score
// Formula:
// activityScore = (lots * 3) + (buyTransactions * 2) + (sellTransactions * 2)
// ------------------------------
function renderTopUsers(analytics) {
  const topUsers = [...analytics]
    .map((user) => ({
      ...user,
      activityScore: (user.lots * 3) + (user.buyTransactions * 2) + (user.sellTransactions * 2)
    }))
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 10);

  mostActiveUsersBody.innerHTML = topUsers.map((user, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><button class="table-user-button" data-user-id="${user.uid}">${toDisplayName(user)}</button></td>
      <td>${numberFormatter.format(user.lots)}</td>
      <td>${numberFormatter.format(user.buyTransactions)}</td>
      <td>${numberFormatter.format(user.sellTransactions)}</td>
      <td>${numberFormatter.format(user.activityScore)}</td>
    </tr>
  `).join('');

  mostActiveUsersBody.querySelectorAll('.table-user-button').forEach((button) => {
    button.addEventListener('click', () => openUserModal(button.dataset.userId));
  });
}

function renderDistributionChart(distribution) {
  const chart = document.getElementById('user-distribution-chart');
  if (!chart) return;

  const series = [
    distribution.noActivity,
    distribution.lotsOnly,
    distribution.buyOnly,
    distribution.sellOnly,
    distribution.buyAndSell
  ];

  const labels = ['No Activity', 'Lots Only', 'Buy Only', 'Sell Only', 'Buy + Sell'];

  if (window.userAnalyticsDistributionChart) {
    window.userAnalyticsDistributionChart.destroy();
  }

  window.userAnalyticsDistributionChart = new ApexCharts(chart, {
    chart: { type: 'donut', height: 320 },
    series,
    labels,
    colors: ['#6c757d', '#4285f4', '#34a853', '#fbbc05', '#ea4335'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: true }
  });

  window.userAnalyticsDistributionChart.render();
}

function renderActivityTimeline(analytics) {
  const chart = document.getElementById('activity-over-time-chart');
  if (!chart) return;

  const byDate = new Map();

  analytics.forEach((user) => {
    const recent = user.recentTransactions || [];
    recent.forEach((transaction) => {
      const timestamp = Number(transaction.date || transaction.createdAt || transaction.timestamp || 0);
      if (!timestamp) return;
      const date = new Date(timestamp);
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const entry = byDate.get(key) || { date: key, lots: 0, buys: 0, sells: 0, activeUsers: new Set() };

      if (transaction.lotId && !transaction.transactionType) entry.lots += 1;
      if (transaction.transactionType === 'BUY') entry.buys += 1;
      if (transaction.transactionType === 'SELL') entry.sells += 1;
      entry.activeUsers.add(user.uid);
      byDate.set(key, entry);
    });
  });

  const sortedDates = [...byDate.values()].sort((a, b) => a.date - b.date).slice(-30);
  const categories = sortedDates.map((entry) => new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
  const lotsSeries = sortedDates.map((entry) => entry.lots);
  const buysSeries = sortedDates.map((entry) => entry.buys);
  const sellsSeries = sortedDates.map((entry) => entry.sells);
  const activeUsersSeries = sortedDates.map((entry) => entry.activeUsers.size);

  if (window.userAnalyticsTimelineChart) {
    window.userAnalyticsTimelineChart.destroy();
  }

  window.userAnalyticsTimelineChart = new ApexCharts(chart, {
    chart: { type: 'line', height: 320, stacked: false },
    stroke: { width: 3 },
    series: [
      { name: 'Lots Created', data: lotsSeries },
      { name: 'Buy Transactions', data: buysSeries },
      { name: 'Sell Transactions', data: sellsSeries },
      { name: 'Active Users', data: activeUsersSeries }
    ],
    xaxis: { categories },
    yaxis: { min: 0 },
    legend: { position: 'bottom' },
    colors: ['#4285f4', '#34a853', '#fbbc05', '#ea4335']
  });

  window.userAnalyticsTimelineChart.render();
}

function openUserModal(userId) {
  const user = STATE.analyticsByUser.find((entry) => entry.uid === userId);
  if (!user) return;

  STATE.selectedUser = user;
  modalUserTitle.textContent = toDisplayName(user);
  modalUserBadge.textContent = user.activityLabel;
  modalUserBadge.className = 'badge';
  if (user.isHighlyActive) modalUserBadge.classList.add('badge--high');

  userInfoGrid.innerHTML = `
    <div><strong>User ID</strong><span>${user.uid}</span></div>
    <div><strong>Name</strong><span>${user.name || 'Not available'}</span></div>
    <div><strong>Business Name</strong><span>${user.businessName || 'Not available'}</span></div>
    <div><strong>Phone</strong><span>${user.phone || 'Not available'}</span></div>
    <div><strong>Registration Date</strong><span>${formatDate(user.createdAt || user.firstActivity || user.lastActivity)}</span></div>
  `;

  userActivityGrid.innerHTML = `
    <div><strong>Lots</strong><span>${numberFormatter.format(user.lots)}</span></div>
    <div><strong>Buy Transactions</strong><span>${numberFormatter.format(user.buyTransactions)}</span></div>
    <div><strong>Sell Transactions</strong><span>${numberFormatter.format(user.sellTransactions)}</span></div>
    <div><strong>Buy Quantity</strong><span>${numberFormatter.format(user.buyQuantity)}</span></div>
    <div><strong>Sell Quantity</strong><span>${numberFormatter.format(user.sellQuantity)}</span></div>
    <div><strong>Buy Value</strong><span>${currencyFormatter.format(user.buyValue)}</span></div>
    <div><strong>Sell Value</strong><span>${currencyFormatter.format(user.sellValue)}</span></div>
    <div><strong>First Activity</strong><span>${formatDateTime(user.firstActivity)}</span></div>
    <div><strong>Last Activity</strong><span>${formatDateTime(user.lastActivity)}</span></div>
  `;

  recentTransactionsList.innerHTML = user.recentTransactions.length
    ? user.recentTransactions.map((item) => {
        const type = item.transactionType || (item.lotId && !item.transactionType ? 'Lot' : 'Transaction');
        const amount = item.total || item.amount || item.value || 0;
        const quantity = item.quantity || item.qty || 0;
        const when = formatDateTime(item.date || item.createdAt || item.timestamp);
        return `<li><div><strong>${type}</strong><span>${when}</span></div><div>${quantity ? `${quantity} qty` : ''}${amount ? ` • ${currencyFormatter.format(amount)}` : ''}</div></li>`;
      }).join('')
    : '<li class="text-muted">No recent activity found.</li>';

  modalBackdrop.classList.remove('hidden');
}

function closeUserModal() {
  modalBackdrop.classList.add('hidden');
}

async function loadAnalyticsData() {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    STATE.users = {};
    STATE.analyticsByUser = [];
    STATE.filteredUsers = [];
    renderSummaryCards([
      { label: 'Total Users', value: 0, icon: '👥', tone: 'positive' },
      { label: 'Users With Lots', value: 0, icon: '🏷️', tone: 'positive' },
      { label: 'Users With Buy Transactions', value: 0, icon: '🛒', tone: 'positive' },
      { label: 'Users With Sell Transactions', value: 0, icon: '💰', tone: 'positive' },
      { label: 'Active Users', value: 0, icon: '✅', tone: 'positive' },
      { label: 'Inactive Users', value: 0, icon: '⭕', tone: 'warning' }
    ]);
    renderUserTable([]);
    return;
  }

  // snapshot.val() gives us exactly users/{uid}/... - Object.keys(...).length
  // on this is the true "users.children.count".
  STATE.users = snapshot.val() || {};
  buildAnalytics();
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('user-email').textContent = user.email || 'Admin';
  loadAnalyticsData();
});

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Logout failed: ' + error.message);
      }
    });
  }

  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const closeSidebar = document.getElementById('close-sidebar');
  const overlay = document.getElementById('overlay');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  const bindFilter = (control, handler) => {
    if (control) control.addEventListener('change', handler);
  };

  bindFilter(searchInput, () => applyFilters());
  bindFilter(activityFilter, () => applyFilters());
  bindFilter(lotFilter, () => applyFilters());
  bindFilter(buyFilter, () => applyFilters());
  bindFilter(sellFilter, () => applyFilters());
  bindFilter(dateFilter, () => {
    customDateGroup.classList.toggle('hidden', dateFilter.value !== 'custom');
    applyFilters();
  });
  bindFilter(dateFrom, () => applyFilters());
  bindFilter(dateTo, () => applyFilters());

  prevPageButton.addEventListener('click', () => {
    if (STATE.page > 1) {
      STATE.page -= 1;
      renderUserTable(STATE.filteredUsers);
    }
  });

  nextPageButton.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(STATE.filteredUsers.length / STATE.pageSize));
    if (STATE.page < totalPages) {
      STATE.page += 1;
      renderUserTable(STATE.filteredUsers);
    }
  });

  closeModalButton.addEventListener('click', closeUserModal);
  modalBackdrop.addEventListener('click', (event) => {
    if (event.target === modalBackdrop) closeUserModal();
  });
});

window.addEventListener('error', (event) => {
  console.error('User Analytics error:', event.error || event.message);
});