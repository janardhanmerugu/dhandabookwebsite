import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyCmaZ_ojXb5Xkg9b5pu4ng0WaNzw42BEwc",
    authDomain: "dhanda-c6f81.firebaseapp.com",
    databaseURL: "https://dhanda-c6f81-default-rtdb.firebaseio.com",
    projectId: "dhanda-c6f81",
    storageBucket: "dhanda-c6f81.firebasestorage.app",
    messagingSenderId: "1078087902179",
    appId: "1:1078087902179:web:7291c62f89528e732176d6",
    measurementId: "G-QG764Y58JM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
