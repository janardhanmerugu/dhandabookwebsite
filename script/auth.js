import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
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

document.getElementById('email-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            showError('Invalid email or password. Please try again.');
        } else if (error.code === 'auth/wrong-password') {
            showError('Incorrect password. Please try again.');
        } else {
            showError(error.message);
        }
    }
});
