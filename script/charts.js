import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

let lineChart;
let barChart;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = './login.html';
    } else {
        document.getElementById('user-email').textContent = user.email;
        initCharts();
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

function initCharts() {
    const lineChartCtx = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(lineChartCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'User Activity',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#4285f4',
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const barChartCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barChartCtx, {
        type: 'bar',
        data: {
            labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
            datasets: [{
                label: 'Revenue ($)',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4285f4',
                    '#34a853',
                    '#fbbc05',
                    '#ea4335',
                    '#9c27b0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const lineChartDataRef = ref(database, 'charts/userActivity');
    onValue(lineChartDataRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            lineChart.data.datasets[0].data = data;
            lineChart.update();
        }
    }, (error) => {
        console.error('Error reading line chart data:', error);
    });

    const barChartDataRef = ref(database, 'charts/revenueBreakdown');
    onValue(barChartDataRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            barChart.data.datasets[0].data = data;
            barChart.update();
        }
    }, (error) => {
        console.error('Error reading bar chart data:', error);
    });
}
