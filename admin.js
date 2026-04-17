import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { auth, db, secondaryAuth } from "./firebase-config.js";

// Verifica se o usuário está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('user-email').textContent = user.email;
    } else {
        // Se não tiver logado, expulsa para o index
        window.location.href = 'login.html';
    }
});

// Lógica de Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    });
});

// Lógica para Cadastrar Novo Funcionário
const addUserForm = document.getElementById('add-user-form');
const addBtn = document.getElementById('add-btn');

addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addBtn.textContent = 'Cadastrando...';
    addBtn.disabled = true; // Impede clique duplo

    const name = document.getElementById('new-name').value;
    const email = document.getElementById('new-email').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    const salary = document.getElementById('new-salary').value;
    const address = document.getElementById('new-address').value;
    const entryTime = document.getElementById('new-entry-time').value;
    const exitTime = document.getElementById('new-exit-time').value;
    const lunchStart = document.getElementById('new-lunch-start').value;
    const lunchEnd = document.getElementById('new-lunch-end').value;
    const startDate = document.getElementById('new-start-date').value;

    try {
        // 1. Cria o usuário na autenticação usando a instância secundária
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUserUid = userCredential.user.uid;

        // 2. Salva os dados dele no Banco de Dados (Firestore)
        await setDoc(doc(db, "funcionarios", newUserUid), {
            nome: name,
            email: email,
            cargo: role,
            salario: parseFloat(salary), // Converte para número
            endereco: address,
            horarioEntrada: entryTime,
            horarioSaida: exitTime,
            horarioAlmocoInicio: lunchStart,
            horarioAlmocoFim: lunchEnd,
            dataEntrada: startDate, // Armazena como string, pode ser convertido para Date se necessário
            dataCadastro: new Date().toISOString() // Data de cadastro no sistema
        });

        alert('Funcionário cadastrado com sucesso!');
        addUserForm.reset();
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            alert('Erro: O e-mail informado já está em uso por outro funcionário.');
        } else {
            alert('Erro ao cadastrar funcionário: ' + error.message);
        }
    } finally {
        addBtn.textContent = 'Cadastrar Funcionário';
        addBtn.disabled = false; // Libera o botão novamente
        // Desloga do app secundário para limpar a sessão cacheada dele
        await signOut(secondaryAuth);
    }
});