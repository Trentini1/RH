import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// Configurações do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAC0pXLKWOfsRQGIn2HbuDsul7cPOVAvUQ",
  authDomain: "rhad-414b7.firebaseapp.com",
  projectId: "rhad-414b7",
  storageBucket: "rhad-414b7.firebasestorage.app",
  messagingSenderId: "335824474556",
  appId: "1:335824474556:web:fa7a931a9729196f611bb9"
};

// Inicializa o App Principal
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicializa um App Secundário.
// Isso é um truque para permitir que o Admin crie contas para outros usuários
// sem ser deslogado da própria conta no processo.
export const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);