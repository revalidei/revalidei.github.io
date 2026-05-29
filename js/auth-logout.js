import { signOutUser } from "./auth-service.js";

window.sair = async function sair() {
  const confirmar = confirm("Deseja realmente sair?");

  if (!confirmar) {
    return;
  }

  try {
    if (window.RevalidaSync?.flushSync) {
      await window.RevalidaSync.flushSync();
    }
    await signOutUser();
  } catch {
    /* segue para a home mesmo se falhar o signOut remoto */
  }

  localStorage.removeItem("logado");
  sessionStorage.removeItem("revalida_sync_uid");

  const path = window.location.pathname;
  const indexUrl = path.includes("/pages/")
    ? new URL("../index.html", window.location.href)
    : new URL("index.html", window.location.href);

  window.location.href = indexUrl.href;
};
