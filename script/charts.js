import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// ✅ AUTH CHECK
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        document.getElementById('user-email').textContent = user.email;
        initCharts();
    }
});

// ✅ Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
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

    // ✅ Logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Failed to logout. Please try again.');
            }
        });
    }
});

// ✅ WEEKLY ACTIVE USERS BAR CHART
function initWeeklyUsersChart(containerId = 'monthlyUsersChart', weeksBack = 12) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`weekly-users-chart: container with id "${containerId}" not found`);
        return;
    }

    const weeks = buildLastNWeeks(weeksBack);
    const initialData = weeks.map(() => 0);

    const options = {
        chart: {
            type: 'bar',
            height: 400,
            zoom: { enabled: false },
            toolbar: { show: true }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4,
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: { enabled: false },
        series: [{ name: 'Active Users', data: initialData }],
        xaxis: { categories: weeks.map(w => w.label) },
        yaxis: { title: { text: 'Number of Users' }, min: 0 },
        tooltip: {
            y: { formatter: (val) => Math.floor(val) }
        },
        colors: ['#4285f4'],
        fill: { opacity: 0.9 }
    };

    const chart = new ApexCharts(container, options);
    chart.render().catch((err) => console.warn('ApexCharts render error', err));

    console.log("✅ Weekly users chart initialized");

    const usersRef = ref(database, 'users');

    // ✅ REAL-TIME LISTENER
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val() || {};
        console.log("📊 Weekly chart: Firebase received");

        const counts = {};
        weeks.forEach(w => counts[w.key] = 0);

        const sections = [
            'lot',
            'buy_transactions',
            'sell_transactions',
            'due_transactions',
            'expenses'
        ];

        // For every user
        Object.entries(users).forEach(([uid, user]) => {
            const times = [];

            // 1) Collect transaction timestamps (transactionId)
            sections.forEach((sec) => {
                if (user && user[sec]) {
                    Object.values(user[sec]).forEach((tx) => {
                        if (tx && tx.transactionId) {
                            const t = Number(tx.transactionId);
                            if (!isNaN(t) && t > 0) times.push(t);
                        }
                    });
                }
            });

            // 2) Collect subscription timestamps
            if (user.subscription) {
                Object.values(user.subscription).forEach((sub) => {
                    // Normal subscription start
                    if (sub.productStart) {
                        const t = Number(sub.productStart);
                        if (!isNaN(t) && t > 0) times.push(t);
                    }

                    // Trial start
                    if (sub.trial && sub.trial.productStart) {
                        const t2 = Number(sub.trial.productStart);
                        if (!isNaN(t2) && t2 > 0) times.push(t2);
                    }
                });
            }

            if (times.length === 0) return;

            const lastActivity = Math.max(...times);
            if (!lastActivity) return;

            const date = new Date(lastActivity);
            const weekKey = getWeekKey(date);

            if (counts.hasOwnProperty(weekKey)) {
                counts[weekKey] += 1;
            }
        });

        const data = weeks.map(w => counts[w.key] || 0);
        console.log("📈 Weekly bar chart data:", data);

        try {
            chart.updateSeries([{ name: 'Active Users', data }], true);
        } catch (err) {
            console.error("weekly-users-chart: updateSeries failed", err);
        }
    });
}

// ✅ CUMULATIVE USERS CHART
function initCumulativeWeeklyUsersChart(containerId = "cumulativeUsersChart", weeksBack = 12) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`cumulative-users-chart: container with id "${containerId}" not found`);
        return;
    }

    const weeks = buildLastNWeeks(weeksBack);
    const initialData = weeks.map(() => 0);

    const options = {
        chart: {
            type: "line",
            height: 400,
            zoom: { enabled: false },
            toolbar: { show: true },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 3, colors: ["#34a853"] },
        series: [{ name: "Total Users (Cumulative)", data: initialData }],
        xaxis: { categories: weeks.map(w => w.label) },
        yaxis: { title: { text: "Total Users" }, min: 0 },
        tooltip: { y: { formatter: (val) => Math.floor(val) } },
        colors: ['#34a853']
    };

    const chart = new ApexCharts(container, options);
    chart.render();

    const usersRef = ref(database, "users");

    onValue(usersRef, (snapshot) => {
        const users = snapshot.val() || {};
        console.log("📊 Cumulative chart: Firebase received");

        const userFirstActivity = {};

        // For each user
        Object.entries(users).forEach(([uid, user]) => {
            const times = [];

            if (user.subscription) {
                Object.values(user.subscription).forEach((sub) => {
                    if (sub.productStart) {
                        const t = Number(sub.productStart);
                        if (!isNaN(t) && t > 0) times.push(t);
                    }
                    if (sub.trial && sub.trial.productStart) {
                        const t2 = Number(sub.trial.productStart);
                        if (!isNaN(t2) && t2 > 0) times.push(t2);
                    }
                });
            }

            if (times.length > 0) {
                userFirstActivity[uid] = Math.min(...times); // FIRST activity ever
            }
        });

        const cumulativeCounts = {};
        weeks.forEach(w => cumulativeCounts[w.key] = 0);

        const userIds = Object.keys(userFirstActivity);

        weeks.forEach((week, idx) => {
            const weekEnd = new Date();
            weekEnd.setHours(0, 0, 0, 0);
            weekEnd.setDate(
                weekEnd.getDate() -
                (weekEnd.getDay() || 7) -
                (weeksBack - idx - 1) * 7 +
                7
            );

            const weekEndTime = weekEnd.getTime();

            let count = 0;
            userIds.forEach(uid => {
                if (userFirstActivity[uid] <= weekEndTime) count++;
            });

            cumulativeCounts[week.key] = count;
        });

        const data = weeks.map(w => cumulativeCounts[w.key] || 0);
        console.log("📈 Cumulative chart data:", data);

        chart.updateSeries([{ name: "Total Users (Cumulative)", data }]);
    });
}

// ✅ HELPER FUNCTIONS
function getWeekKey(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function buildLastNWeeks(n) {
    const out = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (d.getDay() || 7) - (i * 7) + 1);

        const weekEnd = new Date(d);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const key = getWeekKey(d);
        const label =
            d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) +
            " - " +
            weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

        out.push({ key, label });
    }

    return out;
}

// ✅ Initialize charts
function initCharts() {
    initWeeklyUsersChart('monthlyUsersChart', 12);
    initCumulativeWeeklyUsersChart('cumulativeUsersChart', 12);
}
