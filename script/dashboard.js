import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { ref, onValue, get } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = './login.html';
    } else {
        document.getElementById('user-email').textContent = user.email;
        initDashboard();
    }
});

const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeSidebar = document.getElementById('close-sidebar');

menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = './login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
});

document.getElementById('user-data-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('User Data page - This feature is planned for future development. Currently displays user authentication status.');
});

function initDashboard() {
    const totalUsersRef = ref(database, 'dashboard/totalUsers');
    onValue(totalUsersRef, (snapshot) => {
        const value = snapshot.val();
        document.getElementById('total-users').textContent = value || 0;
    }, (error) => {
        console.error('Error reading totalUsers:', error);
    });

    const activeSessionsRef = ref(database, 'dashboard/activeSessions');
    onValue(activeSessionsRef, (snapshot) => {
        const value = snapshot.val();
        document.getElementById('active-sessions').textContent = value || 0;
    }, (error) => {
        console.error('Error reading activeSessions:', error);
    });

    const totalRevenueRef = ref(database, 'dashboard/totalRevenue');
    onValue(totalRevenueRef, (snapshot) => {
        const value = snapshot.val();
        document.getElementById('total-revenue').textContent = value ? `$${value}` : '$0';
    }, (error) => {
        console.error('Error reading totalRevenue:', error);
    });

    const serverStatusRef = ref(database, 'dashboard/serverStatus');
    onValue(serverStatusRef, (snapshot) => {
        const value = snapshot.val();
        document.getElementById('server-status').textContent = value || 'Online';
    }, (error) => {
        console.error('Error reading serverStatus:', error);
    });

    fetchAndDisplayUserActivity();
    
    setInterval(() => {
        fetchAndDisplayUserActivity();
    }, 60000);
}

async function fetchAndDisplayUserActivity() {
    const usersRef = ref(database, 'users');
    const logsContainer = document.getElementById('logs-container');
    
    try {
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            console.log('No users found in database');
            logsContainer.innerHTML = '<div class="log-item"><span class="log-time">--:--:--</span><span class="log-message">No user activity data available. Add users to /users in Firebase.</span></div>';
            return;
        }
        
        const usersData = snapshot.val();
        const allUserIds = Object.keys(usersData);
        const now = Date.now();
        const activities = [];
        
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        
        let activeUsersWeek = 0;
        let activeUsersMonth = 0;
        
        allUserIds.forEach((uid) => {
            const user = usersData[uid];
            let email = '';
            let username = '';
            
            if (user.profile) {
                const profileKeys = Object.keys(user.profile);
                if (profileKeys.length > 0) {
                    const firstProfileKey = profileKeys[0];
                    const profileData = user.profile[firstProfileKey];
                    email = profileData.email || '';
                    username = profileData.username || uid.substring(0, 8);
                }
            }
            
            if (!username) {
                username = uid.substring(0, 8);
            }
            
            const sections = [
                { name: 'lot', label: 'Lot transaction' },
                { name: 'buy_transactions', label: 'Purchase' },
                { name: 'sell_transactions', label: 'Sale' },
                { name: 'due_transactions', label: 'Due payment' },
                { name: 'expenses', label: 'Expense' }
            ];
            
            sections.forEach((section) => {
                if (user[section.name]) {
                    Object.values(user[section.name]).forEach((tx) => {
                        if (tx.transactionId) {
                            const timestamp = Number(tx.transactionId);
                            if (!isNaN(timestamp)) {
                                activities.push({
                                    timestamp,
                                    username,
                                    email,
                                    action: section.label,
                                    amount: tx.amount || tx.total || 0
                                });
                                
                                if (now - timestamp <= SEVEN_DAYS_MS) {
                                    activeUsersWeek++;
                                }
                                if (now - timestamp <= THIRTY_DAYS_MS) {
                                    activeUsersMonth++;
                                }
                            }
                        }
                    });
                }
            });
        });
        
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        const recentActivities = activities.slice(0, 15);
        
        logsContainer.innerHTML = '';
        
        if (recentActivities.length === 0) {
            logsContainer.innerHTML = '<div class="log-item"><span class="log-time">--:--:--</span><span class="log-message">No recent activity. User transactions will appear here.</span></div>';
            return;
        }
        
        recentActivities.forEach(activity => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            
            const date = new Date(activity.timestamp);
            const logTime = document.createElement('span');
            logTime.className = 'log-time';
            logTime.textContent = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            
            const logMessage = document.createElement('span');
            logMessage.className = 'log-message';
            const userDisplay = activity.username || activity.email || 'User';
            const amountDisplay = activity.amount ? ` - $${activity.amount}` : '';
            logMessage.textContent = `${userDisplay}: ${activity.action}${amountDisplay}`;
            
            logItem.appendChild(logTime);
            logItem.appendChild(logMessage);
            logsContainer.appendChild(logItem);
        });
        
        console.log(`📊 Activity Summary:`);
        console.log(`Total users: ${allUserIds.length}`);
        console.log(`Recent activities: ${activities.length}`);
        console.log(`Active last 7 days: ${activeUsersWeek} transactions`);
        console.log(`Active last 30 days: ${activeUsersMonth} transactions`);
        
    } catch (error) {
        console.error('Error fetching user activity:', error);
        logsContainer.innerHTML = '<div class="log-item"><span class="log-time">Error</span><span class="log-message">Failed to load activity. Check Firebase database configuration.</span></div>';
    }
}
