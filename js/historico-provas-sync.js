/**
 * Mantém revalida_historico alinhado com provas_salvas (caderno de erros).
 */
const STORAGE_KEY = "revalida_historico";
const BOOT_KEY = "revalida_historico_boot_v1";
const MAX_EVENTOS = 8000;

function parseJson(raw, fallback) {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
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

function lerEventos() {
  return parseJson(localStorage.getItem(STORAGE_KEY), []);
}

function salvarEventos(lista) {
  const cortada =
    lista.length > MAX_EVENTOS
      ? lista.slice(lista.length - MAX_EVENTOS)
      : lista;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cortada));
}

function flashcardAindaExiste(evt, provas) {
  const nome = evt.nomeProva || "";
  const numero = evt.numero;
  return provas.some(
    (p) =>
      (p.nomeProva || "") === nome &&
      (p.questoesErradas || []).some(
        (q) => q.numero === numero && q.flashcard?.pergunta
      )
  );
}

function eventoProvaFromProva(prova) {
  const ts = parseDataLocale(prova.data)?.getTime() || Date.now();
  const ac = Number(prova.acertos) || 0;
  const er = Number(prova.erros) || 0;
  const total = ac + er;
  if (total <= 0) return null;

  return {
    id: `leg_prova_${ts}_${prova.nomeProva || "Prova"}`,
    tipo: "prova_salva",
    ts,
    nomeProva: prova.nomeProva || "Prova",
    acertos: ac,
    erros: er,
    total,
  };
}

function eventosFlashcardFromProva(prova) {
  const tsBase = parseDataLocale(prova.data)?.getTime() || Date.now();
  const lista = [];

  (prova.questoesErradas || []).forEach((erro) => {
    if (!erro.flashcard?.pergunta) return;
    const tsFc =
      parseDataLocale(erro.flashcard.atualizadoEm)?.getTime() || tsBase;
    lista.push({
      id: `leg_fc_${tsFc}_${prova.nomeProva || "Prova"}_${erro.numero}`,
      tipo: "flashcard_criado",
      ts: tsFc,
      nomeProva: prova.nomeProva || "Prova",
      numero: erro.numero,
      titulo: String(erro.flashcard.pergunta).slice(0, 80),
    });
  });

  return lista;
}

export function syncHistoricoFromProvasSalvas() {
  const provas = parseJson(localStorage.getItem("provas_salvas"), []);

  let eventos = lerEventos().filter((e) => {
    if (e.tipo === "prova_salva") return false;
    if (e.tipo === "flashcard_criado") {
      if (e.id?.startsWith("leg_fc_")) return false;
      return flashcardAindaExiste(e, provas);
    }
    return true;
  });

  const ids = new Set(eventos.map((e) => e.id));

  provas.forEach((prova) => {
    const evtProva = eventoProvaFromProva(prova);
    if (evtProva && !ids.has(evtProva.id)) {
      eventos.push(evtProva);
      ids.add(evtProva.id);
    }
    eventosFlashcardFromProva(prova).forEach((evtFc) => {
      if (!ids.has(evtFc.id)) {
        eventos.push(evtFc);
        ids.add(evtFc.id);
      }
    });
  });

  salvarEventos(eventos);
  localStorage.setItem(BOOT_KEY, "1");

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("revalida-provas-salvas-changed"));
  }
}

if (typeof window !== "undefined") {
  window.__syncHistoricoProvas = syncHistoricoFromProvasSalvas;
}
