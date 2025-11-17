import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

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

const tabBtns = document.querySelectorAll('.tab-btn');
const emailTab = document.getElementById('email-tab');
const googleTab = document.getElementById('google-tab');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.getAttribute('data-tab');
        if (tab === 'email') {
            emailTab.classList.add('active');
            googleTab.classList.remove('active');
        } else {
            googleTab.classList.add('active');
            emailTab.classList.remove('active');
        }
    });
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

document.getElementById('create-account-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('Please enter email and password to create an account.');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
    }
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
            showError('This email is already registered. Please sign in instead.');
        } else if (error.code === 'auth/weak-password') {
            showError('Password is too weak. Please use a stronger password.');
        } else if (error.code === 'auth/invalid-email') {
            showError('Invalid email address format.');
        } else {
            showError(error.message);
        }
    }
});

document.getElementById('google-signin-btn').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Google sign-in error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            showError('Sign-in popup was closed. Please try again.');
        } else if (error.code === 'auth/cancelled-popup-request') {
            showError('Sign-in was cancelled.');
        } else {
            showError(error.message);
        }
    }
});
