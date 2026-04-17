import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { auth, db, secondaryAuth } from "./firebase-config.js";

// DOM Elements - Header
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// DOM Elements - Nav
const navHome = document.getElementById('nav-home');
const navEmployees = document.getElementById('nav-employees');

// Variável global para armazenar nível de acesso
let isCurrentUserAdmin = false;

// Verifica Autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userEmailSpan.textContent = user.email;
        
        // Busca os dados do usuário logado no Firestore
        try {
            const userDoc = await getDoc(doc(db, "funcionarios", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                document.getElementById('user-name').textContent = data.nome || 'Colaborador';
                isCurrentUserAdmin = data.isAdmin === true;
            } else {
                // Se o documento não existir, presumimos que é o admin mestre (criado manualmente no console)
                document.getElementById('user-name').textContent = 'Administrador';
                isCurrentUserAdmin = true;
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário: ", error);
        }

        if (!isCurrentUserAdmin) {
            // Se for funcionário, esconde todo o resto e mostra só "Minha Área"
            document.getElementById('label-home').style.display = 'none';
            document.getElementById('nav-home').style.display = 'none';
            document.getElementById('nav-employees').style.display = 'none';
            document.getElementById('nav-admin').style.display = 'none';
            document.getElementById('label-admin').style.display = 'none';
            
            // Clica artificialmente para ir direto para Minha Área
            document.getElementById('nav-my-area').click();
        } else {
            // Se for admin, a aba Minha Área fica acessível e o início foca na Visão Geral
            document.getElementById('nav-home').click();
        }

        // Ao iniciar, carrega a contagem total de funcionários na tela principal
        loadEmployeesCount();
    } else {
        // Usuário não está logado, redireciona para a página de login
        window.location.href = 'login.html';
    }
});

// Lógica de Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        alert('Erro ao sair: ' + error.message);
    }
});

// Gatilhos de carregamento de dados ao clicar nas abas
navHome.addEventListener('click', () => {
    loadEmployeesCount();
});

navEmployees.addEventListener('click', () => {
    loadEmployeesData();
});

// Funções do Firestore (Leitura)
async function loadEmployeesCount() {
    try {
        const querySnapshot = await getDocs(collection(db, "funcionarios"));
        document.getElementById('total-employees-count').textContent = querySnapshot.size;
    } catch (error) {
        console.error("Erro ao buscar a contagem de funcionários: ", error);
        document.getElementById('total-employees-count').textContent = "Erro";
    }
}

async function loadEmployeesData() {
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '<p class="text-muted" style="padding: 16px 20px;">Carregando...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "funcionarios"));
        if (querySnapshot.empty) {
            employeesList.innerHTML = '<p class="text-muted" style="padding: 16px 20px;">Nenhum funcionário encontrado.</p>';
            return;
        }

        let html = '<table class="rh-table">';
        html += '<tr><th>Nome</th><th>Email</th><th>Cargo</th><th>Acesso</th><th>Ações</th></tr>';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const badge = data.isAdmin ? '<span class="pill pill-amber">Admin</span>' : '<span class="pill pill-green">Func.</span>';
            
            html += `<tr>
                        <td><div class="emp-name">${data.nome || 'N/A'}</div></td>
                        <td><div class="emp-email">${data.email || 'N/A'}</div></td>
                        <td>${data.cargo || 'N/A'}</td>
                        <td>${badge}</td>
                        <td><button class="btn-secondary btn-edit" data-uid="${doc.id}">Editar</button></td>
                     </tr>`;
        });
        html += '</table>';
        employeesList.innerHTML = html;

        // Adiciona eventos aos botões de editar renderizados
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const uid = e.target.getAttribute('data-uid');
                await openEditModal(uid);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar tabela: ", error);
        employeesList.innerHTML = '<p class="text-muted" style="padding: 16px 20px;">Erro ao carregar dados do servidor.</p>';
    }
}

// Função para Cadastrar Novo Funcionário (Admins)
const registerForm = document.getElementById('register-employee-form');
const registerBtn = document.getElementById('register-btn');

if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isCurrentUserAdmin) {
            alert('Você não tem permissão de Administrador para realizar esta ação.');
            return;
        }

        registerBtn.textContent = 'Cadastrando...';
        registerBtn.disabled = true;

        const name = document.getElementById('new-name').value;
        const email = document.getElementById('new-email').value;
        const role = document.getElementById('new-role').value;
        const accessLevel = document.getElementById('new-access').value;
        const password = document.getElementById('new-password').value;

        try {
            // 1. Cria conta de auth no aplicativo secundário
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUserId = userCredential.user.uid;

            // 2. Grava os dados adicionais no banco Firestore
            await setDoc(doc(db, "funcionarios", newUserId), {
                nome: name,
                email: email,
                cargo: role,
                isAdmin: accessLevel === 'admin',
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
}

// ==============================
// LÓGICA DO MODAL DE EDIÇÃO
// ==============================
async function openEditModal(uid) {
    try {
        const docRef = doc(db, "funcionarios", uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('edit-uid').value = uid;
            document.getElementById('edit-name').value = data.nome || '';
            document.getElementById('edit-role').value = data.cargo || '';
            document.getElementById('edit-access').value = data.isAdmin ? 'admin' : 'funcionario';
            
            document.getElementById('edit-modal').classList.remove('hidden');
        }
    } catch(error) {
        alert("Erro ao buscar dados: " + error.message);
    }
}

document.getElementById('close-edit-modal').addEventListener('click', () => {
    document.getElementById('edit-modal').classList.add('hidden');
});

document.getElementById('edit-employee-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('save-edit-btn').textContent = "Salvando...";
    
    try {
        const uid = document.getElementById('edit-uid').value;
        await updateDoc(doc(db, "funcionarios", uid), {
            nome: document.getElementById('edit-name').value,
            cargo: document.getElementById('edit-role').value,
            isAdmin: document.getElementById('edit-access').value === 'admin'
        });
        
        alert("Colaborador atualizado com sucesso!");
        document.getElementById('edit-modal').classList.add('hidden');
        loadEmployeesData(); // Atualiza a tabela na tela
    } catch(error) {
        alert("Erro ao atualizar: " + error.message);
    } finally {
        document.getElementById('save-edit-btn').textContent = "Salvar Alterações";
    }
});