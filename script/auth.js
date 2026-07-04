import { auth } from './firebase-config.js';
import { 
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const errorMessageEl = document.getElementById('error-message');

function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.classList.add('show');
    setTimeout(() => {
        errorMessageEl.classList.remove('show');
    }, 5000);
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = './dashboard.html';
    }
});

// Google Sign-In
const googleProvider = new GoogleAuthProvider();
const googleSigninBtn = document.getElementById('google-signin-btn');

googleSigninBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error('Google Sign-In error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            showError('Sign-in cancelled.');
        } else if (error.code === 'auth/popup-blocked') {
            showError('Sign-in popup was blocked. Please check your browser settings.');
        } else {
            showError(error.message);
        }
    }
});


