import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

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

    const logsRef = ref(database, 'logs');
    onValue(logsRef, (snapshot) => {
        const logsContainer = document.getElementById('logs-container');
        logsContainer.innerHTML = '';
        
        const logs = [];
        snapshot.forEach((childSnapshot) => {
            logs.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        logs.reverse().slice(0, 10).forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            
            const logTime = document.createElement('span');
            logTime.className = 'log-time';
            logTime.textContent = log.time || new Date().toLocaleTimeString();
            
            const logMessage = document.createElement('span');
            logMessage.className = 'log-message';
            logMessage.textContent = log.message || 'No message';
            
            logItem.appendChild(logTime);
            logItem.appendChild(logMessage);
            logsContainer.appendChild(logItem);
        });
        
        if (logs.length === 0) {
            logsContainer.innerHTML = '<div class="log-item"><span class="log-time">--:--:--</span><span class="log-message">No logs available. Add data to /logs in Firebase.</span></div>';
        }
    }, (error) => {
        console.error('Error reading logs:', error);
        document.getElementById('logs-container').innerHTML = '<div class="log-item"><span class="log-time">Error</span><span class="log-message">Failed to load logs. Check your database configuration.</span></div>';
    });
}
