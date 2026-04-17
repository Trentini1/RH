import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.textContent = 'Carregando...';
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'dashboard.html'; // Redireciona se o login for sucesso
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
        loginBtn.textContent = 'Entrar';
    }
});