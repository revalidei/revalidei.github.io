(function () {
  "use strict";

  const DECK_KEY = "flashcards_deck";
  const META_KEY = "flashcards_deck_meta";

  function buildDeckFromErros(questoesErradas) {
    if (!Array.isArray(questoesErradas) || !questoesErradas.length) {
      return [];
    }

    return questoesErradas.map((erro) => ({
      pergunta:
        (erro.enunciado && String(erro.enunciado).trim()) ||
        `Questão ${erro.numero ?? "?"}`,
      resposta: erro.respostaCorreta || "—",
      numero: erro.numero,
      comentario: erro.comentario || "",
    }));
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

  window.RevalidaFlashcards = {
    DECK_KEY,
    META_KEY,
    buildDeckFromErros,
    saveDeck,
    goToFlashcards,
  };
})();
