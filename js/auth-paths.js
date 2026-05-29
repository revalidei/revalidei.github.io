export function loginUrl() {
  const path = window.location.pathname;

  if (path.includes("/pages/PROVAS/")) {
    return new URL("../../login.html", window.location.href);
  }

  if (path.includes("/pages/")) {
    return new URL("../login.html", window.location.href);
  }

  return new URL("login.html", window.location.href);
}

export function dashboardUrl() {
  const path = window.location.pathname;

  if (path.includes("/pages/")) {
    return new URL("../dashboard.html", window.location.href);
  }

  return new URL("dashboard.html", window.location.href);
}

export function redirectAfterLogin() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  if (redirect) {
    try {
      const target = new URL(redirect, window.location.origin);
      if (target.origin === window.location.origin) {
        return target.href;
      }
    } catch {
      /* ignora redirect inválido */
    }
  }

  return dashboardUrl().href;
}

export function redirectToLogin() {
  const login = loginUrl();
  const returnTo =
    window.location.pathname +
    window.location.search +
    window.location.hash;

  login.searchParams.set("redirect", returnTo);
  window.location.replace(login.href);
}

export function isLoginPage() {
  return /\/login(\.html)?$/i.test(window.location.pathname);
}
