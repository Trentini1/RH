import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { auth, db, secondaryAuth } from "./firebase-config.js";

// DOM Elements - Header
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// DOM Elements - Nav
const navHome = document.getElementById('nav-home');
const navEmployees = document.getElementById('nav-employees');
const navAdmin = document.getElementById('nav-admin');

// DOM Elements - Sections
const sectionHome = document.getElementById('section-home');
const sectionEmployees = document.getElementById('section-employees');
const sectionAdmin = document.getElementById('section-admin');

// Verifica Autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmailSpan.textContent = user.email;
        // Ao iniciar, carrega a contagem total de funcionários na tela principal
        loadEmployeesCount();
    } else {
        // Usuário não está logado, redireciona para a página de login
        window.location.href = 'index.html'; // ajuste se sua página de login tiver outro nome
    }
});

// Lógica de Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        alert('Erro ao sair: ' + error.message);
    }
});

// Controle de Navegação de Abas
function hideAllSections() {
    sectionHome.classList.add('hidden');
    sectionEmployees.classList.add('hidden');
    sectionAdmin.classList.add('hidden');
}

navHome.addEventListener('click', () => {
    hideAllSections();
    sectionHome.classList.remove('hidden');
    loadEmployeesCount();
});

navEmployees.addEventListener('click', () => {
    hideAllSections();
    sectionEmployees.classList.remove('hidden');
    loadEmployeesData(); // Busca do Firestore quando a aba for clicada
});

navAdmin.addEventListener('click', () => {
    hideAllSections();
    sectionAdmin.classList.remove('hidden');
});

// Funções do Firestore (Leitura)
async function loadEmployeesCount() {
    try {
        const querySnapshot = await getDocs(collection(db, "funcionarios"));
        document.getElementById('total-employees-count').textContent = querySnapshot.size;
    } catch (error) {
        console.error("Erro ao buscar a contagem de funcionários: ", error);
    }
}

async function loadEmployeesData() {
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '<p>Carregando...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "funcionarios"));
        if (querySnapshot.empty) {
            employeesList.innerHTML = '<p>Nenhum funcionário encontrado.</p>';
            return;
        }

        let html = '<table style="width: 100%; border-collapse: collapse; text-align: left; background: #fff;">';
        html += '<tr style="border-bottom: 2px solid #ccc;"><th style="padding: 10px;">Nome</th><th style="padding: 10px;">Email</th><th style="padding: 10px;">Cargo</th></tr>';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            html += `<tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${data.nome || 'N/A'}</td>
                        <td style="padding: 10px;">${data.email || 'N/A'}</td>
                        <td style="padding: 10px;">${data.cargo || 'N/A'}</td>
                     </tr>`;
        });
        html += '</table>';
        employeesList.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar tabela: ", error);
        employeesList.innerHTML = '<p>Erro ao carregar dados do servidor.</p>';
    }
}

// Função para Cadastrar Novo Funcionário (Admins)
const registerForm = document.getElementById('register-employee-form');
const registerBtn = document.getElementById('register-btn');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerBtn.textContent = 'Cadastrando...';
    registerBtn.disabled = true;

    const name = document.getElementById('new-name').value;
    const email = document.getElementById('new-email').value;
    const role = document.getElementById('new-role').value;
    const password = document.getElementById('new-password').value;

    try {
        // 1. Cria conta de auth no aplicativo secundário (Admin continua logado no app principal)
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUserId = userCredential.user.uid;

        // 2. Grava os dados adicionais no banco Firestore associando com a UID
        await setDoc(doc(db, "funcionarios", newUserId), {
            nome: name,
            email: email,
            cargo: role,
            dataCadastro: new Date().toISOString()
        });

        alert('Funcionário cadastrado com sucesso!');
        registerForm.reset();
        
        // Limpa senha logada no Auth Secundário, para segurança
        await signOut(secondaryAuth);
        
    } catch (error) {
        console.error(error);
        alert('Erro ao cadastrar funcionário: ' + error.message);
    } finally {
        registerBtn.textContent = 'Cadastrar Funcionário';
        registerBtn.disabled = false;
    }
});