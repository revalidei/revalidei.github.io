/**
 * UI da página de histórico.
 */
(function () {
  "use strict";

  let periodoAtual = "hoje";
  let chartDonut = null;
  let chartLinha = null;

  function ic(name, size, cls) {
    return window.RevalidaIcons?.icon(name, { size: size || 18, class: cls || "" }) || "";
  }

  function formatarData(ts) {
    const d = new Date(ts);
    const hoje = new Date();
    const ini = new Date(hoje);
    ini.setHours(0, 0, 0, 0);
    if (d >= ini) {
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function descricaoEvento(e) {
    const prova = e.nomeProva ? ` · ${e.nomeProva}` : "";
    switch (e.tipo) {
      case "questao_respondida":
        return {
          titulo: e.acertou ? "Questão acertada" : "Questão errada",
          detalhe: `Questão ${e.numero || "—"}${prova}`,
          icon: e.acertou ? "check" : "x",
          classe: e.acertou ? "ok" : "erro",
        };
      case "prova_salva":
        return {
          titulo: "Prova salva",
          detalhe: `${e.acertos || 0} acertos, ${e.erros || 0} erros${prova}`,
          icon: "clipboard",
          classe: "prova",
        };
      case "flashcard_criado":
        return {
          titulo: "Flashcard criado",
          detalhe: (e.titulo || `Questão ${e.numero || ""}`) + prova,
          icon: "brain",
          classe: "fc",
        };
      case "flashcards_lote_criado":
        return {
          titulo: "Flashcards criados",
          detalhe: `${e.quantidade || 0} cards${prova}`,
          icon: "brain",
          classe: "fc",
        };
      case "flashcard_revisado":
        return {
          titulo: "Flashcard revisado",
          detalhe: (e.titulo || "Revisão SRS") + prova,
          icon: "book-open",
          classe: "fc",
        };
      default:
        return {
          titulo: "Atividade",
          detalhe: prova.slice(3) || "Estudo",
          icon: "sparkles",
          classe: "prova",
        };
    }
  }

  function renderStats(r) {
    const el = document.getElementById("historicoStats");
    if (!el) return;
    el.innerHTML = `
      <article class="hist-stat hist-stat--questoes">
        <div class="hist-stat-label icon-wrap">${ic("file-text", 16)} Questões</div>
        <strong>${r.questoes}</strong>
        <span class="hist-stat-sub">respondidas</span>
      </article>
      <article class="hist-stat hist-stat--acertos">
        <div class="hist-stat-label icon-wrap">${ic("check", 16, "icon--accent")} Acertos</div>
        <strong>${r.acertos}</strong>
        <span class="hist-stat-sub">${r.erros} erros</span>
      </article>
      <article class="hist-stat hist-stat--flash-criados">
        <div class="hist-stat-label icon-wrap">${ic("brain", 16)} Cards criados</div>
        <strong>${r.flashcardsCriados}</strong>
        <span class="hist-stat-sub">no período</span>
      </article>
      <article class="hist-stat hist-stat--flash-revisados">
        <div class="hist-stat-label icon-wrap">${ic("book-open", 16)} Revisões</div>
        <strong>${r.flashcardsRevisados}</strong>
        <span class="hist-stat-sub">flashcards</span>
      </article>`;
    window.RevalidaIcons?.mount(el);
  }

  function renderFeed(eventos) {
    const el = document.getElementById("historicoFeed");
    if (!el) return;

    const lista = eventos.slice(0, 80);
    if (!lista.length) {
      el.innerHTML = `
        <div class="hist-vazio">
          <h3>Nenhuma atividade ainda</h3>
          <p>Responda questões em uma prova ou crie flashcards para ver seu histórico aqui.</p>
        </div>`;
      return;
    }

    el.innerHTML = `<ul class="hist-feed">${lista
      .map((e) => {
        const d = descricaoEvento(e);
        return `
          <li class="hist-item">
            <div class="hist-item-icone hist-item-icone--${d.classe}">${ic(d.icon, 20)}</div>
            <div class="hist-item-body">
              <strong>${d.titulo}</strong>
              <p>${d.detalhe}</p>
            </div>
            <time class="hist-item-data">${formatarData(e.ts)}</time>
          </li>`;
      })
      .join("")}</ul>`;
    window.RevalidaIcons?.mount(el);
  }

  function renderTaxa(r) {
    const el = document.getElementById("historicoTaxa");
    if (!el) return;
    el.innerHTML = `
      <span>Taxa de acerto no período</span>
      <strong>${r.taxaAcerto}%</strong>`;
  }

  function destruirCharts() {
    if (chartDonut) {
      chartDonut.destroy();
      chartDonut = null;
    }
    if (chartLinha) {
      chartLinha.destroy();
      chartLinha = null;
    }
  }

  function renderCharts(r) {
    if (typeof Chart === "undefined") return;

    const canvasDonut = document.getElementById("graficoAcertos");
    const canvasLinha = document.getElementById("graficoEvolucao");

    destruirCharts();

    if (canvasDonut && (r.acertos > 0 || r.erros > 0)) {
      chartDonut = new Chart(canvasDonut.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Acertos", "Erros"],
          datasets: [
            {
              data: [r.acertos, r.erros],
              backgroundColor: ["rgba(124,255,178,0.9)", "rgba(255,123,123,0.9)"],
              borderColor: ["#7cffb2", "#ff7b7b"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#e2e8f0", padding: 12 },
            },
          },
        },
      });
    }

    const linha = window.RevalidaHistorico.dadosGraficoProvas(periodoAtual);
    if (canvasLinha && linha.labels.length > 0) {
      chartLinha = new Chart(canvasLinha.getContext("2d"), {
        type: "line",
        data: {
          labels: linha.labels,
          datasets: [
            {
              label: "Aproveitamento (%)",
              data: linha.valores,
              borderColor: "#7cffb2",
              backgroundColor: "rgba(124,255,178,0.12)",
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointBackgroundColor: "#7cffb2",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: "#94a3b8", maxRotation: 45 },
              grid: { color: "rgba(255,255,255,0.05)" },
            },
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(255,255,255,0.05)" },
            },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    }
  }

  function atualizar() {
    const H = window.RevalidaHistorico;
    if (!H) return;

    H.importarLegado();
    const r = H.resumo(periodoAtual);

    const sub = document.getElementById("historicoSubtitulo");
    if (sub) {
      sub.textContent = `Resumo de ${H.rotuloPeriodo(periodoAtual).toLowerCase()} · ${r.eventos.length} registro(s)`;
    }

    renderStats(r);
    renderTaxa(r);
    renderFeed(r.eventos);
    renderCharts(r);

    document.querySelectorAll(".historico-tab").forEach((btn) => {
      btn.classList.toggle("ativo", btn.dataset.periodo === periodoAtual);
    });
  }

  async function init() {
    if (window.RevalidaSync?.whenReady) {
      await window.RevalidaSync.whenReady();
    }
    document.querySelectorAll(".historico-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        periodoAtual = btn.dataset.periodo || "total";
        atualizar();
      });
    });
    window.addEventListener("revalida-provas-salvas-changed", () => {
      atualizar();
    });
    window.addEventListener("storage", (e) => {
      if (e.key === "provas_salvas" || e.key === "revalida_historico") {
        atualizar();
      }
    });
    atualizar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
    });
  } else {
    init();
  }
})();
