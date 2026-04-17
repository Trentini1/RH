import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { auth, db, secondaryAuth } from "./firebase-config.js";

// Verifica se o usuário está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('user-email').textContent = user.email;
    } else {
        // Se não tiver logado, expulsa para o index
        window.location.href = 'index.html';
    }
});

// Lógica de Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});

// Lógica para Cadastrar Novo Funcionário
const addUserForm = document.getElementById('add-user-form');
const addBtn = document.getElementById('add-btn');

addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addBtn.textContent = 'Cadastrando...';

    const name = document.getElementById('new-name').value;
    const email = document.getElementById('new-email').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    try {
        // 1. Cria o usuário na autenticação usando a instância secundária
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUserUid = userCredential.user.uid;

        // 2. Salva os dados dele no Banco de Dados (Firestore)
        await setDoc(doc(db, "funcionarios", newUserUid), {
            nome: name,
            email: email,
            cargo: role,
            dataCadastro: new Date().toISOString()
        });

        alert('Funcionário cadastrado com sucesso!');
        addUserForm.reset();
    } catch (error) {
        alert('Erro ao cadastrar funcionário: ' + error.message);
    } finally {
        addBtn.textContent = 'Cadastrar Funcionário';
        // Desloga do app secundário para limpar a sessão cacheada dele
        await signOut(secondaryAuth);
    }
});