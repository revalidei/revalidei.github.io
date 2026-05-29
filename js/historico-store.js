/**
 * Registro e agregação do histórico de estudos (questões + flashcards).
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "revalida_historico";
  const BOOT_KEY = "revalida_historico_boot_v1";
  const MAX_EVENTOS = 8000;

  function lerEventos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function salvarEventos(lista) {
    const cortada =
      lista.length > MAX_EVENTOS
        ? lista.slice(lista.length - MAX_EVENTOS)
        : lista;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cortada));
  }

  function parseDataLocale(str) {
    if (!str) return null;
    const direto = new Date(str);
    if (!Number.isNaN(direto.getTime())) return direto;
    const m = String(str).match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[^\d]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
    );
    if (!m) return null;
    return new Date(
      +m[3],
      +m[2] - 1,
      +m[1],
      +(m[4] || 0),
      +(m[5] || 0),
      +(m[6] || 0)
    );
  }

  function inicioDia(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function inicioSemana(d) {
    const x = inicioDia(d);
    const dia = x.getDay();
    const diff = dia === 0 ? 6 : dia - 1;
    x.setDate(x.getDate() - diff);
    return x;
  }

  function inicioMes(d) {
    const x = inicioDia(d);
    x.setDate(1);
    return x;
  }

  function noPeriodo(ts, periodo) {
    const t = new Date(ts);
    if (Number.isNaN(t.getTime())) return false;
    const agora = new Date();
    if (periodo === "hoje") return t >= inicioDia(agora);
    if (periodo === "semana") return t >= inicioSemana(agora);
    if (periodo === "mes") return t >= inicioMes(agora);
    return true;
  }

  function uid(evt) {
    return [
      evt.tipo,
      evt.ts,
      evt.nomeProva || "",
      evt.numero ?? "",
      evt.acertou ?? "",
    ].join("|");
  }

  function registrar(partial) {
    const evt = {
      id: partial.id || `e_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ts: partial.ts || Date.now(),
      tipo: partial.tipo,
      nomeProva: partial.nomeProva || "",
      numero: partial.numero,
      acertou: partial.acertou,
      acertos: partial.acertos,
      erros: partial.erros,
      total: partial.total,
      quantidade: partial.quantidade,
      titulo: partial.titulo || "",
    };
    const lista = lerEventos();
    lista.push(evt);
    salvarEventos(lista);
    return evt;
  }

  function importarLegado() {
    if (localStorage.getItem(BOOT_KEY)) return;

    const existentes = new Set(lerEventos().map(uid));
    const novos = [];

    function add(evt) {
      if (!existentes.has(uid(evt))) {
        novos.push(evt);
        existentes.add(uid(evt));
      }
    }

    let provas = [];
    try {
      provas = JSON.parse(localStorage.getItem("provas_salvas") || "[]");
    } catch {
      provas = [];
    }

    provas.forEach((prova) => {
      const ts = parseDataLocale(prova.data)?.getTime() || Date.now();
      const ac = Number(prova.acertos) || 0;
      const er = Number(prova.erros) || 0;
      const total = ac + er;

      if (total > 0) {
        add({
          id: `leg_prova_${ts}_${prova.nomeProva}`,
          tipo: "prova_salva",
          ts,
          nomeProva: prova.nomeProva || "Prova",
          acertos: ac,
          erros: er,
          total,
        });
      }

      (prova.questoesErradas || []).forEach((erro) => {
        if (erro.flashcard?.pergunta) {
          const tsFc =
            parseDataLocale(erro.flashcard.atualizadoEm)?.getTime() || ts;
          add({
            id: `leg_fc_${tsFc}_${prova.nomeProva}_${erro.numero}`,
            tipo: "flashcard_criado",
            ts: tsFc,
            nomeProva: prova.nomeProva || "Prova",
            numero: erro.numero,
            titulo: String(erro.flashcard.pergunta).slice(0, 80),
          });
        }
      });
    });

    if (novos.length) {
      salvarEventos(lerEventos().concat(novos));
    }
    localStorage.setItem(BOOT_KEY, "1");
  }

  function sincronizarComProvasSalvas() {
    if (typeof window !== "undefined" && window.__syncHistoricoProvas) {
      window.__syncHistoricoProvas();
      return;
    }
    importarLegado();
  }

  function filtrar(periodo) {
    return lerEventos()
      .filter((e) => noPeriodo(e.ts, periodo))
      .sort((a, b) => b.ts - a.ts);
  }

  function resumo(periodo) {
    const eventos = filtrar(periodo);
    let questoes = 0;
    let acertos = 0;
    let erros = 0;
    let flashcardsCriados = 0;
    let flashcardsRevisados = 0;
    let provasSalvas = 0;

    const temQuestoesIndividuais = eventos.some(
      (e) => e.tipo === "questao_respondida"
    );

    eventos.forEach((e) => {
      if (e.tipo === "questao_respondida") {
        questoes += 1;
        if (e.acertou) acertos += 1;
        else erros += 1;
      }
      if (e.tipo === "prova_salva") {
        provasSalvas += 1;
        if (!temQuestoesIndividuais) {
          questoes += Number(e.total) || 0;
          acertos += Number(e.acertos) || 0;
          erros += Number(e.erros) || 0;
        }
      }
      if (e.tipo === "flashcard_criado") flashcardsCriados += 1;
      if (e.tipo === "flashcards_lote_criado") {
        flashcardsCriados += Number(e.quantidade) || 0;
      }
      if (e.tipo === "flashcard_revisado") flashcardsRevisados += 1;
    });

    const taxa =
      questoes > 0 ? ((acertos / questoes) * 100).toFixed(1) : "0";

    return {
      questoes,
      acertos,
      erros,
      flashcardsCriados,
      flashcardsRevisados,
      provasSalvas,
      taxaAcerto: taxa,
      eventos,
    };
  }

  function dadosGraficoProvas(periodo) {
    const eventos = filtrar(periodo).filter((e) => e.tipo === "prova_salva");
    const porData = new Map();

    eventos
      .slice()
      .sort((a, b) => a.ts - b.ts)
      .forEach((e) => {
        const d = new Date(e.ts);
        const chave = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        });
        const total = Number(e.total) || 0;
        const ac = Number(e.acertos) || 0;
        const pct = total > 0 ? (ac / total) * 100 : 0;
        porData.set(chave, pct);
      });

    return {
      labels: [...porData.keys()],
      valores: [...porData.values()],
    };
  }

  function rotuloPeriodo(periodo) {
    if (periodo === "hoje") return "Hoje";
    if (periodo === "semana") return "Esta semana";
    if (periodo === "mes") return "Este mês";
    return "Total";
  }

  global.RevalidaHistorico = {
    STORAGE_KEY,
    registrar,
    importarLegado,
    sincronizarComProvasSalvas,
    filtrar,
    resumo,
    dadosGraficoProvas,
    rotuloPeriodo,
    noPeriodo,
  };
})(typeof window !== "undefined" ? window : globalThis);
