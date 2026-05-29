import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, isFirebaseConfigured } from "./firebase-init.js";

const googleProvider = new GoogleAuthProvider();

export function ensureConfigured() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(
      "Firebase não configurado. Copie js/firebase-config.example.js para js/firebase-config.js e preencha com os dados do Console."
    );
  }
}

export function mensagemErroAuth(code) {
  const mensagens = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/account-exists-with-different-credential":
      "Já existe uma conta com este e-mail usando outro método de login.",
    "auth/operation-not-allowed":
      "Este método de login não está habilitado no Firebase Console.",
    "auth/network-request-failed": "Erro de rede. Verifique sua conexão."
  };

  return mensagens[code] || "Não foi possível concluir a autenticação. Tente novamente.";
}

export async function signInEmail(email, password) {
  ensureConfigured();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpEmail(email, password) {
  ensureConfigured();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInGoogle() {
  ensureConfigured();
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  ensureConfigured();
  return signOut(auth);
}

export { auth };
