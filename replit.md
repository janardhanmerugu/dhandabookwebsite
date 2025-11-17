# Overview

This is a Firebase Dashboard web application built with vanilla HTML, CSS, and JavaScript (no frameworks). It provides a complete authentication system with Google Sign-In and email/password login, a real-time dashboard with live data cards and activity logs, and interactive analytics charts. The application uses Firebase v9 modular SDK for authentication and Firebase Realtime Database for data synchronization, with Chart.js for data visualization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- Pure JavaScript implementation without any frontend frameworks
- ES6 module system for code organization (`import`/`export` statements)
- Static file serving with simple HTML pages
- Client-side routing through direct page navigation (login.html, dashboard.html, charts.html)

**UI Components**:
- Responsive sidebar navigation with mobile-friendly collapsible drawer
- Top navigation bar with user information display
- Tab-based login interface (Email/Google authentication options)
- Real-time data cards and activity logs
- Interactive charts using Chart.js library

**Styling Approach**:
- CSS custom properties (CSS variables) for theming
- Mobile-first responsive design
- CSS animations for smooth transitions
- No CSS preprocessors or frameworks

## Authentication & Authorization

**Firebase Authentication (v9 SDK)**:
- Multiple authentication methods: Google OAuth and Email/Password
- `onAuthStateChanged` listener for session management across all protected pages
- Route protection: Automatic redirects to login.html for unauthenticated users
- Automatic redirect to dashboard.html for authenticated users on login page
- Sign-out functionality available from sidebar menu

**Protected Routes**:
- dashboard.html and charts.html require authentication
- Authentication state checked on page load before rendering content
- User email displayed in top navigation bar on authenticated pages

## Real-time Data Synchronization

**Firebase Realtime Database Integration**:
- `onValue()` listeners for live dashboard metrics (Total Users, Revenue, Active Sessions, Server Status)
- Activity logs use `get()` to analyze user transaction data across the entire `/users` tree
- Tracks transactions from: lot, buy_transactions, sell_transactions, due_transactions, expenses
- Each transaction must have `transactionId` (Unix timestamp) for activity tracking
- Automatically calculates active users in last 7/30 days based on transaction timestamps
- Chart data synchronized in real-time from database

**Data Flow**:
- Dashboard cards use `onValue()` listeners for real-time stats updates
- Activity logs use `get()` to fetch user transaction data
- Activity tracking scans user transaction sections: lot, buy_transactions, sell_transactions, due_transactions, expenses
- Each transaction's `transactionId` (timestamp) is used to determine recent activity
- Auto-refresh every 60 seconds for activity logs
- Displays 15 most recent activities sorted by timestamp

## Data Visualization

**Chart.js Integration**:
- Line chart for user activity trends over time
- Bar chart for revenue analytics
- Charts configured to update dynamically when Firebase data changes
- Responsive chart sizing for different screen sizes

**Chart Update Pattern**:
- Charts initialized on page load
- Database listeners trigger chart data updates
- Chart instances updated using Chart.js update() method

## Page Structure & Navigation

**Entry Point**: index.html redirects to login.html
**Authentication Flow**: login.html → dashboard.html (on successful auth)
**Navigation Pattern**: 
- Sidebar menu for internal navigation between dashboard and charts
- Active state management for current page
- Logout button triggers Firebase signOut and redirects to login

**Mobile Responsiveness**:
- Hamburger menu toggle for small screens
- Overlay for mobile sidebar
- Close button within sidebar
- Click outside sidebar to close

## Code Organization

**Modular JavaScript Structure**:
- `firebase-config.js`: Firebase initialization and exports (auth, database instances)
- `auth.js`: Login page logic (sign-in, sign-up, Google authentication)
- `dashboard.js`: Dashboard page logic (real-time data cards, activity logs)
- `charts.js`: Charts page logic (Chart.js initialization and real-time updates)

**Separation of Concerns**:
- Authentication logic isolated in auth.js
- Page-specific business logic in dedicated files
- Shared Firebase configuration exported from single source
- UI interactions handled within respective page scripts

# External Dependencies

## Firebase Services

**Firebase Authentication**: User authentication and session management
- Google OAuth provider for social login
- Email/Password authentication provider
- Version: Firebase JS SDK v9.22.0 (modular)

**Firebase Realtime Database**: Live data storage and synchronization
- Real-time listeners for automatic UI updates
- Database paths: `dashboard/totalUsers`, `dashboard/activeSessions`, `dashboard/totalRevenue`, `dashboard/serverStatus`, `logs/`
- Requires configuration of `databaseURL` in Firebase config

## Third-Party Libraries

**Chart.js v4.4.0**: Data visualization library
- Loaded via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`
- Used for line charts and bar charts on analytics page
- UMD build for direct browser usage

## Firebase SDK (CDN)

All Firebase modules loaded via CDN from `https://www.gstatic.com/firebasejs/9.22.0/`:
- `firebase-app.js`: Core Firebase app initialization
- `firebase-auth.js`: Authentication methods and state management
- `firebase-database.js`: Realtime Database operations

## Configuration Requirements

**Firebase Project Setup Required**:
- API Key, Auth Domain, Database URL, Project ID
- Storage Bucket, Messaging Sender ID, App ID
- Placeholders in `script/firebase-config.js` must be replaced with actual Firebase project credentials
- Google Sign-In must be enabled in Firebase Console
- Email/Password authentication must be enabled in Firebase Console

## Deployment Configuration

**Vercel Deployment**:
- `vercel.json` configured for static file serving
- Rewrite rules for proper routing
- No server-side rendering or API routes

# Recent Changes (November 17, 2025)

## Navigation & Deployment Fixes
- Fixed all navigation paths from absolute to relative (e.g., `/login.html` → `./login.html`)
- This ensures proper routing when deployed to Vercel or subdirectories
- Updated User Data link alert to indicate it's a future feature
- All authentication redirects now work correctly across hosting environments

## User Activity Tracking Implementation
- Implemented intelligent activity log system that scans user transaction data
- Activity logs now show real user transactions instead of static log entries
- Tracks 5 transaction types: lot, purchases, sales, due payments, and expenses
- Displays username/email, action type, timestamp, and transaction amount
- Auto-refreshes every 60 seconds
- Shows 15 most recent activities sorted by newest first
- Calculates active users in last 7 and 30 days based on transaction timestamps

# Future Features

- User Data page (currently a placeholder in sidebar navigation)
- User profile editing and avatar management
- Data export functionality (CSV/JSON)
- Date range filters for charts
- Admin panel for user management
