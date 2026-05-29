import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, isFirebaseConfigured } from "./firebase-init.js";
import { redirectToLogin } from "./auth-paths.js";

document.documentElement.classList.add("auth-pending");

function liberarPagina() {
  document.documentElement.classList.remove("auth-pending");
}

function bloquearNaoConfigurado() {
  document.documentElement.classList.remove("auth-pending");
  const msg =
    "Firebase não configurado. Copie js/firebase-config.example.js para js/firebase-config.js e preencha com os dados do Console.";
  document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif;color:#fff;background:#090B10;min-height:100vh"><h1>Configuração necessária</h1><p>${msg}</p></div>`;
}

if (!isFirebaseConfigured() || !auth) {
  bloquearNaoConfigurado();
} else {
  onAuthStateChanged(
    auth,
    (user) => {
      if (!user) {
        redirectToLogin();
        return;
      }
      liberarPagina();
    },
    () => {
      redirectToLogin();
    }
  );
}
