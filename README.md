# Firebase Dashboard Web App

A complete, modern Firebase dashboard application built with vanilla HTML, CSS, and JavaScript. Features real-time data synchronization, authentication, and interactive charts.

## Features

✅ **Firebase Authentication (v9 SDK)**
- Google Sign-In
- Email & Password authentication
- Protected routes with automatic redirects

✅ **Real-time Dashboard**
- Live data cards connected to Firebase Realtime Database
- Activity logs with real-time updates
- Auto-refresh using `onValue()` listeners

✅ **Interactive Charts**
- Line charts and bar charts using Chart.js
- Real-time data updates from Firebase
- Responsive and animated visualizations

✅ **Responsive Design**
- Mobile-friendly collapsible sidebar
- Clean, modern UI with smooth animations
- Works on all device sizes

## Setup Instructions

### 1. Firebase Configuration

Open `script/firebase-config.js` and replace the placeholder values with your Firebase project credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // Replace with your API key
    authDomain: "YOUR_AUTH_DOMAIN",      // Replace with your auth domain
    databaseURL: "YOUR_DATABASE_URL",    // Replace with your database URL
    projectId: "YOUR_PROJECT_ID",        // Replace with your project ID
    storageBucket: "YOUR_STORAGE_BUCKET",// Replace with your storage bucket
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your sender ID
    appId: "YOUR_APP_ID"                 // Replace with your app ID
};
```

**Where to find your Firebase config:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ > Project Settings
4. Scroll down to "Your apps" section
5. Click the web app icon `</>` or select your existing web app
6. Copy the `firebaseConfig` object

### 2. Enable Firebase Services

In your Firebase Console:

**Enable Authentication:**
1. Go to Authentication > Sign-in method
2. Enable **Email/Password** provider
3. Enable **Google** provider
4. Add your domain to authorized domains

**Enable Realtime Database:**
1. Go to Realtime Database
2. Click "Create Database"
3. Start in test mode (or configure security rules)
4. Your database URL will be shown (use this in config)

### 3. Configure Database Paths

The app reads data from specific Firebase Realtime Database paths. You can customize these in the JavaScript files:

**Dashboard Data** (`script/dashboard.js`):
- `dashboard/totalUsers` - Total user count
- `dashboard/activeSessions` - Active sessions count
- `dashboard/totalRevenue` - Revenue value
- `dashboard/serverStatus` - Server status text
- `logs` - Array of log objects with `time` and `message` fields

**Charts Data** (`script/charts.js`):
- `charts/userActivity` - Array of 7 numbers for line chart (Mon-Sun)
- `charts/revenueBreakdown` - Array of 5 numbers for bar chart (Products A-E)

**Example Firebase Data Structure:**
```json
{
  "dashboard": {
    "totalUsers": 1250,
    "activeSessions": 342,
    "totalRevenue": 45678,
    "serverStatus": "Online"
  },
  "logs": {
    "log1": {
      "time": "10:30:15",
      "message": "User logged in successfully"
    },
    "log2": {
      "time": "10:31:22",
      "message": "New data uploaded"
    }
  },
  "charts": {
    "userActivity": [120, 150, 180, 220, 190, 250, 300],
    "revenueBreakdown": [12500, 18700, 15300, 22100, 19800]
  }
}
```

## Local Development

To run locally, you need a simple HTTP server (Firebase modules require proper CORS):

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Deployment to Vercel

### Method 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and your site will be live!

### Method 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Click "Deploy"
5. Your site will be live at `https://your-project.vercel.app`

### Method 3: Deploy from Local Directory

1. Create a Git repository:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Push to GitHub/GitLab
3. Import to Vercel from dashboard

## Project Structure

```
firebase-dashboard/
├── index.html              # Redirects to login
├── login.html              # Authentication page
├── dashboard.html          # Main dashboard with stats
├── charts.html             # Charts and analytics
├── style.css               # All styling
├── script/
│   ├── firebase-config.js  # Firebase configuration (EDIT THIS)
│   ├── auth.js            # Authentication logic
│   ├── dashboard.js       # Dashboard functionality
│   └── charts.js          # Charts functionality
├── vercel.json            # Vercel configuration
└── README.md              # This file
```

## Customization

### Change Database Paths

Edit the `ref()` calls in `script/dashboard.js` and `script/charts.js`:

```javascript
// Example: Change dashboard path
const totalUsersRef = ref(database, 'myCustomPath/users');
```

### Add More Stats Cards

In `dashboard.html`, copy a stat card and update the ID:

```html
<div class="stat-card">
    <div class="stat-header">
        <h3>New Metric</h3>
        <span class="stat-icon">🎯</span>
    </div>
    <div class="stat-value" id="new-metric">0</div>
    <div class="stat-change positive">Live</div>
</div>
```

Then add the Firebase listener in `script/dashboard.js`:

```javascript
const newMetricRef = ref(database, 'dashboard/newMetric');
onValue(newMetricRef, (snapshot) => {
    document.getElementById('new-metric').textContent = snapshot.val() || 0;
});
```

### Modify Chart Types

You can change chart types in `script/charts.js`:
- `line` → Line chart
- `bar` → Bar chart
- `pie` → Pie chart
- `doughnut` → Doughnut chart
- `radar` → Radar chart

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit your Firebase config with real credentials to public repositories**
2. **Set up proper Firebase Security Rules** for production:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

3. **Enable App Check** in Firebase Console for production apps
4. **Use environment variables** for sensitive data in production

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

- **Firebase v9 SDK** (Modular)
- **Chart.js v4** for data visualization
- **Vanilla JavaScript** (ES6+ modules)
- **CSS3** with animations
- **HTML5**

## Troubleshooting

**Login not working?**
- Check Firebase Authentication is enabled
- Verify Google Sign-In is configured
- Check browser console for errors

**Data not showing?**
- Verify Firebase Realtime Database is created
- Check database rules allow read access
- Ensure data exists at the specified paths
- Open browser console to see Firebase errors

**Charts not updating?**
- Verify Chart.js is loaded (check network tab)
- Ensure data at `charts/` path is an array
- Check browser console for errors

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For Firebase issues, visit: https://firebase.google.com/support
For Chart.js documentation: https://www.chartjs.org/docs/
