import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, isFirebaseConfigured } from "./firebase-init.js";
import { SITE_CONFIG } from "./site-config.js";

function nomeExibicao(user) {
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }
  const email = user.email || "";
  const local = email.split("@")[0];
  if (local) {
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Doutor(a)";
}

function aplicarBoasVindas(user) {
  const titulo = document.querySelector(".titulo");
  if (titulo) {
    titulo.textContent = `Bem-vindo, ${nomeExibicao(user)}`;
  }

  const marca = `${SITE_CONFIG.brand.name} ${SITE_CONFIG.brand.emoji}`.trim();
  const sidebarLogo = document.querySelector(".sidebar .logo");
  if (sidebarLogo) {
    sidebarLogo.textContent = marca;
  }
  const mobileBrand = document.querySelector(".dash-mobile-brand");
  if (mobileBrand) {
    mobileBrand.textContent = marca;
  }
}

if (isFirebaseConfigured() && auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) aplicarBoasVindas(user);
  });
}
