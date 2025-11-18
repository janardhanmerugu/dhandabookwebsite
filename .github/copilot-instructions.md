# Copilot Instructions for FirebaseDashboard

## Project Overview
- This is a Firebase-powered dashboard web app using only HTML, CSS, and JavaScript (no frameworks).
- Main features: user authentication, user listing/search, activity charts, and session management.
- All business logic is in the `script/` directory, with one JS file per major feature.
- UI is split across multiple HTML files: `login.html`, `dashboard.html`, `userdata.html`, `charts.html`.

## Architecture & Data Flow
- Uses Firebase Auth and Realtime Database (see `script/firebase-config.js`).
- Auth state is checked on every page load; unauthenticated users are redirected to `index.html`.
- User data is fetched from the `users` node in the database and rendered dynamically.
- Charts are initialized after auth and fetch data from Firebase.
- Sidebar and logout logic is repeated across dashboard, charts, and userdata scripts for consistency.

## Key Patterns & Conventions
- All Firebase imports use CDN URLs (v9 modular syntax).
- DOMContentLoaded is used for event binding to ensure elements exist.
- Sidebar toggling and overlay logic is consistent across pages.
- User search/filter is always case-insensitive and works on both email and UID.
- Error messages are shown in-page (not via alert) except for logout failures.
- All navigation is handled via `window.location.href`.

## Developer Workflows
- No build step: edit HTML/CSS/JS directly and reload in browser.
- To test locally, open HTML files in a browser (Firebase config is hardcoded for the project).
- For deployment, see `vercel.json` (Vercel is used for hosting; no server code).
- No automated tests or CI/CD scripts are present.

## Integration Points
- Firebase Auth and Realtime Database are the only external dependencies.
- All configuration is in `script/firebase-config.js`.
- No third-party charting library is included in the code snippets above, but if present, it would be loaded via CDN in the HTML.

## Examples
- See `script/userdata.js` for user list fetching and filtering.
- See `script/dashboard.js` for main dashboard logic and user session handling.
- See `script/charts.js` for chart initialization and auth checks.

## Special Notes
- Do not add build tools, package managers, or frameworks unless explicitly requested.
- Keep all logic modular and page-specific; avoid global variables across files.
- Follow the existing pattern for sidebar, logout, and auth checks when adding new features.
