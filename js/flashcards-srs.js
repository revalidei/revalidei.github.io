(function () {
  "use strict";

  const AGAIN_SEC = 60;
  const HARD_SEC = 360;
  const GOOD_SEC = 600;
  const EASY_GRADUATE_DAYS = 5;
  const GRADUATING_INTERVAL_DAYS = 1;
  const DEFAULT_EASE = 2.5;
  const MIN_EASE = 1.3;
  const DAY_MS = 86400000;
  const MIN_MS = 60000;

  function cardId(card, index) {
    if (card.id) return card.id;
    const base = String(card.pergunta || "").slice(0, 40);
    return `c_${index}_${base.length}_${(card.numero ?? index)}`;
  }

  function normalizeCard(card, index) {
    const c = { ...card };
    c.id = cardId(c, index);
    if (!c.sched || typeof c.sched !== "object") {
      c.sched = {
        state: "new",
        step: 0,
        ease: DEFAULT_EASE,
        intervalDays: 0,
        due: Date.now(),
        reps: 0,
        lapses: 0,
      };
    } else {
      c.sched = {
        state: c.sched.state || "new",
        step: c.sched.step ?? 0,
        ease: c.sched.ease ?? DEFAULT_EASE,
        intervalDays: c.sched.intervalDays ?? 0,
        due: typeof c.sched.due === "number" ? c.sched.due : Date.now(),
        reps: c.sched.reps ?? 0,
        lapses: c.sched.lapses ?? 0,
      };
    }
    return c;
  }

  function normalizeDeck(deck) {
    if (!Array.isArray(deck)) return [];
    return deck.map((c, i) => normalizeCard(c, i));
  }

  function isLearning(state) {
    return state === "new" || state === "learning" || state === "relearning";
  }

  function formatDelay(ms) {
    if (ms < MIN_MS) return "<1 min";
    const sec = Math.round(ms / 1000);
    if (sec < 3600) {
      const min = Math.max(1, Math.round(sec / 60));
      return `<${min} min`;
    }
    const hours = Math.round(sec / 3600);
    if (hours < 24) return `<${hours} h`;
    const days = Math.max(1, Math.round(ms / DAY_MS));
    if (days === 1) return "1 dia";
    return `${days} dias`;
  }

  function applyRate(card, rating, now) {
    const s = card.sched;
    const r = Math.min(4, Math.max(1, rating));

    if (r === 1) {
      s.lapses += 1;
      s.state = s.state === "review" ? "relearning" : "learning";
      s.step = 0;
      s.due = now + AGAIN_SEC * 1000;
      if (s.state === "relearning" || s.state === "learning") {
        s.reps = 0;
      }
      return card;
    }

    if (isLearning(s.state) || s.state === "new") {
      s.state = "learning";

      if (r === 2) {
        s.due = now + HARD_SEC * 1000;
      }

      if (r === 3) {
        if ((s.step || 0) < 1) {
          s.step = 1;
          s.due = now + GOOD_SEC * 1000;
        } else {
          s.state = "review";
          s.intervalDays = GRADUATING_INTERVAL_DAYS;
          s.reps = 1;
          s.due = now + s.intervalDays * DAY_MS;
          s.step = 0;
        }
      }

      if (r === 4) {
        s.state = "review";
        s.intervalDays = EASY_GRADUATE_DAYS;
        s.ease = Math.min(3, (s.ease || DEFAULT_EASE) + 0.15);
        s.reps = 1;
        s.due = now + EASY_GRADUATE_DAYS * DAY_MS;
        s.step = 0;
      }

      return card;
    }

    if (r === 2) {
      s.ease = Math.max(MIN_EASE, (s.ease || DEFAULT_EASE) - 0.15);
      s.intervalDays = Math.max(
        1,
        Math.round((s.intervalDays || 1) * 1.2)
      );
      s.reps += 1;
      s.due = now + s.intervalDays * DAY_MS;
    }

    if (r === 3) {
      if (!s.reps) {
        s.intervalDays = GRADUATING_INTERVAL_DAYS;
      } else {
        s.intervalDays = Math.max(
          1,
          Math.round((s.intervalDays || 1) * (s.ease || DEFAULT_EASE))
        );
      }
      s.reps += 1;
      s.due = now + s.intervalDays * DAY_MS;
    }

    if (r === 4) {
      s.ease = Math.min(3, (s.ease || DEFAULT_EASE) + 0.15);
      if (!s.reps) {
        s.intervalDays = EASY_GRADUATE_DAYS;
      } else {
        s.intervalDays = Math.max(
          EASY_GRADUATE_DAYS,
          Math.round((s.intervalDays || 1) * s.ease * 1.3)
        );
      }
      s.reps += 1;
      s.due = now + s.intervalDays * DAY_MS;
    }

    return card;
  }

  function previewDue(card, rating, now) {
    const clone = normalizeCard(
      JSON.parse(JSON.stringify(card)),
      0
    );
    applyRate(clone, rating, now);
    return clone.sched.due - now;
  }

  function previewIntervals(card, now) {
    return {
      1: formatDelay(previewDue(card, 1, now)),
      2: formatDelay(previewDue(card, 2, now)),
      3: formatDelay(previewDue(card, 3, now)),
      4: formatDelay(previewDue(card, 4, now)),
    };
  }

  function rate(card, rating, now) {
    return applyRate(normalizeCard(card, 0), rating, now ?? Date.now());
  }

  function getDueCards(deck, now) {
    const t = now ?? Date.now();
    return deck
      .filter((c) => (c.sched?.due ?? 0) <= t)
      .sort((a, b) => (a.sched?.due ?? 0) - (b.sched?.due ?? 0));
  }

  function getNextDueTime(deck, now) {
    const t = now ?? Date.now();
    const future = deck
      .map((c) => c.sched?.due ?? 0)
      .filter((d) => d > t);
    if (!future.length) return null;
    return Math.min(...future);
  }

  function deckStats(deck, now) {
    const t = now ?? Date.now();
    let due = 0;
    let learning = 0;
    let review = 0;
    let newCount = 0;

    deck.forEach((c) => {
      const st = c.sched?.state || "new";
      if ((c.sched?.due ?? 0) <= t) due += 1;
      if (st === "new") newCount += 1;
      else if (isLearning(st)) learning += 1;
      else review += 1;
    });

    return { due, learning, review, new: newCount, total: deck.length };
  }

  window.RevalidaSRS = {
    AGAIN_SEC,
    HARD_SEC,
    GOOD_SEC,
    EASY_GRADUATE_DAYS,
    normalizeDeck,
    normalizeCard,
    formatDelay,
    previewIntervals,
    rate,
    getDueCards,
    getNextDueTime,
    deckStats,
  };
})();
