import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, isFirebaseConfigured } from "./firebase-init.js";
import {
  signInEmail,
  signUpEmail,
  signInGoogle,
  mensagemErroAuth
} from "./auth-service.js";
import { redirectAfterLogin, isLoginPage } from "./auth-paths.js";

let modoCadastro = false;

function el(id) {
  return document.getElementById(id);
}

function mostrarErro(texto) {
  const box = el("auth-erro");
  if (!box) return;
  box.textContent = texto;
  box.hidden = !texto;
}

function setLoading(ativo) {
  const btnPrimario = el("btn-primario");
  const btnGoogle = el("btn-google");
  if (btnPrimario) btnPrimario.disabled = ativo;
  if (btnGoogle) btnGoogle.disabled = ativo;
}

function atualizarModoUI() {
  const titulo = el("auth-titulo");
  const subtitulo = el("auth-subtitulo");
  const btnPrimario = el("btn-primario");
  const linkModo = el("link-modo");

  if (modoCadastro) {
    if (titulo) titulo.textContent = "CRIAR CONTA 🩺";
    if (subtitulo) subtitulo.textContent = "Cadastre-se para começar a estudar";
    if (btnPrimario) btnPrimario.textContent = "✨ CRIAR CONTA";
    if (linkModo) {
      linkModo.textContent = "Já tem conta? Entrar";
    }
  } else {
    if (titulo) titulo.textContent = "ENTRAR 🩺";
    if (subtitulo) subtitulo.textContent = "Bem-vindo de volta 👨‍⚕️";
    if (btnPrimario) btnPrimario.textContent = "🚀 ENTRAR";
    if (linkModo) {
      linkModo.textContent = "Não tem conta? Criar conta";
    }
  }
}

function alternarModo() {
  modoCadastro = !modoCadastro;
  mostrarErro("");
  atualizarModoUI();
}

async function executarAuth(acao) {
  if (!isFirebaseConfigured()) {
    mostrarErro(
      "Configure o Firebase: copie js/firebase-config.example.js para js/firebase-config.js e preencha com os dados do Console."
    );
    return;
  }

  const email = el("email")?.value.trim() || "";
  const senha = el("senha")?.value || "";

  if (!email || !senha) {
    mostrarErro("Preencha e-mail e senha.");
    return;
  }

  if (modoCadastro && senha.length < 6) {
    mostrarErro("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  setLoading(true);
  mostrarErro("");

  try {
    if (modoCadastro) {
      await signUpEmail(email, senha);
    } else {
      await signInEmail(email, senha);
    }
    window.location.href = redirectAfterLogin();
  } catch (error) {
    mostrarErro(mensagemErroAuth(error.code));
  } finally {
    setLoading(false);
  }
}

async function entrarComGoogle() {
  if (!isFirebaseConfigured()) {
    mostrarErro(
      "Configure o Firebase: copie js/firebase-config.example.js para js/firebase-config.js e preencha com os dados do Console."
    );
    return;
  }

  setLoading(true);
  mostrarErro("");

  try {
    await signInGoogle();
    window.location.href = redirectAfterLogin();
  } catch (error) {
    if (error.code !== "auth/popup-closed-by-user") {
      mostrarErro(mensagemErroAuth(error.code));
    }
  } finally {
    setLoading(false);
  }
}

function initLoginPage() {
  atualizarModoUI();

  el("btn-primario")?.addEventListener("click", () => executarAuth());
  el("btn-google")?.addEventListener("click", () => entrarComGoogle());
  el("link-modo")?.addEventListener("click", (e) => {
    e.preventDefault();
    alternarModo();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      executarAuth();
    }
  });

  if (auth && isFirebaseConfigured()) {
    onAuthStateChanged(auth, (user) => {
      if (user && isLoginPage()) {
        window.location.href = redirectAfterLogin();
      }
    });
  }
}

if (isLoginPage()) {
  initLoginPage();
}
