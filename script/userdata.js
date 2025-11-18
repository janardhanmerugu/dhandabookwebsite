import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase, ref, onValue, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// Protect page
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'index.html';
  else document.getElementById('user-email').textContent = user.email;
});

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await signOut(auth); window.location.href='index.html'; } catch(err){console.error(err);} 
    });
  }

  // Sidebar toggle (mobile)
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const closeSidebar = document.getElementById('close-sidebar');
  const overlay = document.getElementById('overlay');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.add('active');
      if (overlay) overlay.classList.add('active');
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener('click', () => {
      sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  const searchEl = document.getElementById('left-search');
  if (searchEl) searchEl.addEventListener('input', (e)=> filterAndRender((e.target.value||'').toLowerCase()));

  // start listener
  setupUsersListener();
});

let allUsers = [];

function setupUsersListener(){
  const db = getDatabase();
  const usersRef = ref(db, 'users');
  onValue(usersRef, (snap)=>{
    const users = snap.val() || {};
    allUsers = Object.entries(users).map(([uid, u])=>{
      let email='';
      if (u.profile){
        const keys = Object.keys(u.profile);
        if (keys.length>0){ const p=u.profile[keys[0]]; email = p.email||''; }
      }
      return { uid, email };
    }).sort((a,b)=> (a.email||'').localeCompare(b.email||''));

    renderUserList(allUsers);
  }, (err)=> console.error('users listen err', err));
}

function filterAndRender(q){
  if (!q) return renderUserList(allUsers);
  const matched = allUsers.filter(u=> (u.email||'').toLowerCase().includes(q) || u.uid.toLowerCase().includes(q));
  renderUserList(matched);
}

function renderUserList(list){
  const container = document.getElementById('left-user-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length===0){ container.innerHTML = '<li class="text-center text-muted py-4">No users found</li>'; return; }
  const frag = document.createDocumentFragment();
  list.forEach(u=>{
    const li = document.createElement('li');
    li.className = 'user-item';
    li.innerHTML = `<div class="user-email">${u.email || '-'}</div><div class="user-uid">${u.uid}</div>`;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => onUserClick(u.uid, u.email));
    frag.appendChild(li);
  });
  container.appendChild(frag);
}

function onUserClick(uid, email) {
  const db = getDatabase();
  const userLotRef = ref(db, `users/${uid}/lot`);
  const lotListEl = document.getElementById('right-lot-list');
  const selectedUserNameEl = document.getElementById('selected-user-name');
  const selectedUserSubEl = document.getElementById('selected-user-subscription');
  if (selectedUserNameEl) selectedUserNameEl.textContent = email || uid;
  if (lotListEl) lotListEl.innerHTML = '<li class="text-center text-muted py-4">Loading lots...</li>';
  if (selectedUserSubEl) selectedUserSubEl.textContent = 'Loading subscription...';

  // One-time fetch for the full user node (lots + subscription)
  const userRef = ref(db, `users/${uid}`);
  get(userRef).then((snap) => {
    const userData = snap.val() || {};

    // render lots
    const lotsObj = userData.lot;
    if (!lotsObj) {
      if (lotListEl) lotListEl.innerHTML = `<li class="text-center text-muted py-4">No lots found for ${email || uid}</li>`;
    } else {
      const items = Object.entries(lotsObj).map(([lotId, lot]) => ({ lotId, ...lot }));
      renderLotList(items);
    }

    // render subscription summary in header (show trial or first entry)
    const subscription = userData.subscription || null;
    renderSubscription(subscription, selectedUserSubEl);
  }).catch((err) => {
    if (lotListEl) lotListEl.innerHTML = `<li class="text-center text-muted py-4">Error loading lots: ${err.message}</li>`;
    if (selectedUserSubEl) selectedUserSubEl.textContent = 'Error loading subscription';
  });
}

function formatTs(ts){
  if (!ts) return '-';
  const n = Number(ts);
  if (Number.isNaN(n)) return String(ts);
  const d = new Date(n);
  return d.toLocaleString();
}

function renderSubscription(subscription, container){
  if (!container) return;
  if (!subscription || Object.keys(subscription).length===0){
    container.innerHTML = '<div class="subscription-summary"><div class="item text-muted">No subscription</div></div>';
    return;
  }

  // Prefer the `trial` entry if present, otherwise take the first subscription key
  let trial = subscription.trial || null;
  if (!trial) {
    const firstKey = Object.keys(subscription)[0];
    trial = subscription[firstKey] || null;
  }

  if (!trial) {
    container.innerHTML = '<div class="subscription-summary"><div class="item text-muted">No subscription</div></div>';
    return;
  }

  // Build a horizontal summary row for the trial data
  const product = trial.productId || 'trial';
  const order = trial.orderId ? `Order: ${trial.orderId}` : null;
  const start = trial.productStart ? `Start: ${formatTs(trial.productStart)}` : null;
  const end = trial.productEnd ? `End: ${formatTs(trial.productEnd)}` : null;
  const isActive = (() => {
    if (!trial.productEnd) return false;
    const n = Number(trial.productEnd);
    if (Number.isNaN(n)) return false;
    return Date.now() <= n;
  })();

  let html = `<div class="subscription-summary">`;
  html += `<div class="item" style="font-weight:700">${product}</div>`;
  if (order) html += `<div class="item">${order}</div>`;
  if (start) html += `<div class="item">${start}</div>`;
  if (end) html += `<div class="item">${end}</div>`;
  html += `<div class="item status-badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Expired'}</div>`;
  html += `</div>`;

  container.innerHTML = html;
}

function renderLotList(items){
  const container = document.getElementById('right-lot-list');
  if (!container) return;
  container.innerHTML = '';
  if (!items || items.length === 0) { container.innerHTML = '<li class="text-center text-muted py-4">No lots found</li>'; return; }
  const frag = document.createDocumentFragment();
  items.forEach(it => {
    const li = document.createElement('li');
    li.className = 'user-item';
    const statusClass = it.status ? 'active' : 'inactive';
    const statusLabel = it.status ? 'Active' : 'Inactive';
    li.innerHTML = `<div class="user-email">${it.name || '-'}</div><div class="user-uid">${it.lotId} • ${it.date || '-' } • <span class="lot-status ${statusClass}">${statusLabel}</span></div>`;
    frag.appendChild(li);
  });
  container.appendChild(frag);
}
