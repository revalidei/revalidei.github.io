(function () {
  "use strict";

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.RevalidaApp = {
    escapeHtml,
    loginWithRedirect(path) {
      const login = new URL("login.html", window.location.href);
      login.searchParams.set("redirect", path);
      window.location.href = login.href;
    }
  };

  if ("serviceWorker" in navigator) {
    const swUrl = new URL("sw.js", document.baseURI || window.location.href).href;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  }
})();
