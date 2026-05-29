import { SITE_CONFIG } from "./site-config.js";

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOg(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function applySiteConfig() {
  const c = SITE_CONFIG;
  const fullTitle = c.meta.title;
  const brandLine = `${c.brand.emoji} ${c.brand.name}`;

  if (document.title.includes("•")) {
    const suffix = document.title.split("•").pop().trim();
    document.title = `${suffix} • ${fullTitle}`;
  } else if (!document.title || document.title === "Revalida 2026") {
    document.title = fullTitle;
  }

  setMeta("theme-color", c.meta.themeColor);
  setMeta("description", c.meta.description);
  setOg("og:title", `${c.brand.name} — ${c.brand.product}`);
  setOg("og:description", c.meta.description);
  setOg("og:url", c.meta.siteUrl);
  setOg("og:type", "website");

  document.querySelectorAll("[data-site='brand']").forEach((el) => {
    el.innerHTML = `${c.brand.emoji} <span style="color:#7CFFB2">${c.brand.name}</span>`;
  });

  document.querySelectorAll("[data-site='login-brand']").forEach((el) => {
    el.textContent = `${c.brand.emoji} ${c.brand.product}`;
  });

  document.querySelectorAll("[data-site='product']").forEach((el) => {
    el.textContent = c.brand.product;
  });

  document.querySelectorAll("[data-site='instagram']").forEach((el) => {
    el.textContent = c.contact.instagram;
    if (c.contact.instagramUrl) {
      if (el.tagName === "A") {
        el.href = c.contact.instagramUrl;
      } else {
        const link = document.createElement("a");
        link.href = c.contact.instagramUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = c.contact.instagram;
        link.style.color = "inherit";
        el.replaceChildren(link);
      }
    }
  });

  document.querySelectorAll("[data-site='stat-simulados']").forEach((el) => {
    el.textContent = String(c.stats.simulados);
  });

  document.querySelectorAll("[data-site='stat-questoes']").forEach((el) => {
    el.textContent = c.stats.questoesPorEdicao;
  });

  document.querySelectorAll("[data-site='stat-mobile']").forEach((el) => {
    el.textContent = c.stats.mobileLabel;
  });

  const googleBtn = document.getElementById("btn-google");
  if (googleBtn && !c.features.googleLogin) {
    googleBtn.hidden = true;
    document.querySelector(".auth-divider")?.setAttribute("hidden", "");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applySiteConfig);
} else {
  applySiteConfig();
}
