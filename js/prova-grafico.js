/**
 * Gráfico de acertos/erros ao finalizar prova (Chart.js).
 */
(function (global) {
  let instancia = null;

  function destruir() {
    if (instancia) {
      instancia.destroy();
      instancia = null;
    }
  }

  /**
   * @param {object} opts
   * @param {string} [opts.canvasId]
   * @param {number} opts.acertos
   * @param {number} opts.erros
   * @param {number} [opts.naoRespondidas]
   */
  function render(opts) {
    const canvasId = opts.canvasId || "graficoResultado";
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const box = canvas.closest(".grafico-box");
    const vazioId = canvasId + "-vazio";

    destruir();

    const acertos = Math.max(0, Number(opts.acertos) || 0);
    const erros = Math.max(0, Number(opts.erros) || 0);
    const naoRespondidas = Math.max(0, Number(opts.naoRespondidas) || 0);
    const total = acertos + erros + naoRespondidas;

    let vazioEl = document.getElementById(vazioId);
    if (vazioEl) vazioEl.remove();
    canvas.style.display = "";

    if (typeof global.Chart === "undefined") {
      if (box && !document.getElementById(vazioId)) {
        vazioEl = document.createElement("p");
        vazioEl.id = vazioId;
        vazioEl.className = "grafico-vazio";
        vazioEl.textContent = "Gráfico indisponível (Chart.js não carregou).";
        box.appendChild(vazioEl);
      }
      canvas.style.display = "none";
      return null;
    }

    if (total === 0) {
      canvas.style.display = "none";
      if (box) {
        vazioEl = document.createElement("p");
        vazioEl.id = vazioId;
        vazioEl.className = "grafico-vazio";
        vazioEl.textContent = "Nenhuma questão respondida para exibir.";
        box.appendChild(vazioEl);
      }
      return null;
    }

    const labels = ["Acertos", "Erros"];
    const data = [acertos, erros];
    const cores = ["rgba(124, 255, 178, 0.9)", "rgba(255, 123, 123, 0.9)"];
    const bordas = ["#7cffb2", "#ff7b7b"];

    if (naoRespondidas > 0) {
      labels.push("Não respondidas");
      data.push(naoRespondidas);
      cores.push("rgba(148, 163, 184, 0.85)");
      bordas.push("#94a3b8");
    }

    const ctx = canvas.getContext("2d");
    instancia = new global.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: cores,
            borderColor: bordas,
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "58%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#e2e8f0",
              padding: 14,
              font: { size: 13, weight: "600" },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const val = context.parsed;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return context.label + ": " + val + " (" + pct + "%)";
              },
            },
          },
        },
      },
      plugins: [
        {
          id: "centroAproveitamento",
          beforeDraw: function (chart) {
            const respondidas = acertos + erros;
            const pct =
              respondidas > 0
                ? ((acertos / respondidas) * 100).toFixed(1)
                : "0";
            const { width, height, ctx: c } = chart;
            c.save();
            c.font = "bold 26px Inter, sans-serif";
            c.fillStyle = "#7cffb2";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText(pct + "%", width / 2, height / 2 - 8);
            c.font = "600 12px Inter, sans-serif";
            c.fillStyle = "#94a3b8";
            c.fillText("de acerto", width / 2, height / 2 + 16);
            c.restore();
          },
        },
      ],
    });

    return instancia;
  }

  global.ProvaGrafico = {
    render: render,
    destroy: destruir,
  };
})(typeof window !== "undefined" ? window : globalThis);
