// js/auth.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// List of public pages that don't require authentication
const publicPages = [
    'auth-basic-login.html',
    'auth-basic-register.html',
    'auth-basic-forgot-password.html'
];

// Check if current page is a public page
function isPublicPage() {
    const currentPath = window.location.pathname;
    return publicPages.some(page => currentPath.includes(page));
}

// Check login state when the page loads
console.log("Checking auth state on page load...");
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const isPublic = isPublicPage();
    
    if (user) {
        // User is logged in
        console.log("User is logged in:", user.email);
        
        window.location.href = "dashboard.html";

    } else {
        // User is not logged in
        window.location.href = "auth-basic-login.html";
    }
});

// Login function
export function login(email, password) {
    console.log("Attempting login with email:", email);
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login successful:", userCredential.user.email);
            window.location.href = "dashboard.html";
            return userCredential;
        })
        .catch((error) => {
            console.error("Login failed:", error.code, error.message);
            throw error; // Re-throw so calling code can handle it
        });
}

// Logout function
export function logout() {
    console.log("Logging out...");
    return signOut(auth)
        .then(() => {
            console.log("Logout successful");
            window.location.href = "auth-basic-login.html";
        })
        .catch((error) => {
            console.error("Logout failed:", error);
            throw error;
        });
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Check if user is logged in (synchronous)
export function isUserLoggedIn() {
    return auth.currentUser !== null;
}