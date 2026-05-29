(function () {
  "use strict";

  const DECK_KEY = "flashcards_deck";
  const META_KEY = "flashcards_deck_meta";
  const CRIAR_SESSAO_KEY = "flashcards_criar_sessao";

  function saveCreateSession(payload) {
    sessionStorage.setItem(CRIAR_SESSAO_KEY, JSON.stringify(payload));
  }

  function loadCreateSession() {
    const raw = sessionStorage.getItem(CRIAR_SESSAO_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearCreateSession() {
    sessionStorage.removeItem(CRIAR_SESSAO_KEY);
  }

  function isValidUserCard(card) {
    const frente = String(card?.pergunta ?? "").trim();
    const verso = String(card?.resposta ?? "").trim();
    return frente.length >= 3 && verso.length >= 3;
  }

  function buildDeckFromUserCards(cards, metaExtra) {
    const deck = (cards || [])
      .filter(isValidUserCard)
      .map((c) => ({
        pergunta: String(c.pergunta).trim(),
        resposta: String(c.resposta).trim(),
        numero: c.numero,
        origem: "usuario",
        nomeProva: metaExtra?.titulo || c.nomeProva || "",
      }));

    return deck;
  }

  function saveDeck(deck, meta) {
    localStorage.setItem(DECK_KEY, JSON.stringify(deck));
    if (meta) {
      sessionStorage.setItem(META_KEY, JSON.stringify(meta));
    } else {
      sessionStorage.removeItem(META_KEY);
    }
  }

  function goToFlashcards(flashcardsPath) {
    const base = flashcardsPath || "flashcards.html";
    const url = new URL(base, window.location.href);
    url.searchParams.set("from", "prova");
    window.location.href = url.href;
  }

  function goToCriar(criarPath, params) {
    const base = criarPath || "criar_flashcards.html";
    const url = new URL(base, window.location.href);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
    window.location.href = url.href;
  }

  window.RevalidaFlashcards = {
    DECK_KEY,
    META_KEY,
    CRIAR_SESSAO_KEY,
    saveCreateSession,
    loadCreateSession,
    clearCreateSession,
    isValidUserCard,
    buildDeckFromUserCards,
    saveDeck,
    goToFlashcards,
    goToCriar,
  };
})();
