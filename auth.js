// js/auth.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Check login state when the page loads
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User logged in → go to dashboard if not already there
        if (!window.location.href.includes("dashboard.html")) {
            window.location.href = "dashboard.html";
        }
    } else {
        // User not logged in → stay on login page
        if (!window.location.href.includes("auth-basic-login.html")) {
            window.location.href = "auth-basic-login.html";
        }
    }
});

// Login function
export function login(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}

// Logout function
export function logout() {
    signOut(auth).then(() => {
        window.location.href = "auth-basic-login.html";
    });
}
