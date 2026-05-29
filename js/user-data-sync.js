/**
 * Sincroniza dados do app (localStorage) com Firestore por usuário autenticado.
 */
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-init.js";

export const SYNC_KEYS = [
  "provas_salvas",
  "flashcards_deck",
  "cronograma_2026.1",
  "revalida_historico",
  "revalida_historico_boot_v1",
];

const UID_SESSION_KEY = "revalida_sync_uid";
const MAX_HISTORICO = 8000;
const PUSH_DELAY_MS = 900;

let currentUid = null;
let applyingRemote = false;
let storagePatched = false;
let pushTimer = null;
let ready = false;
let readyPromise = null;
let readyResolve = null;

function ensureReadyPromise() {
  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      readyResolve = resolve;
    });
  }
  return readyPromise;
}

function markReady() {
  if (ready) return;
  ready = true;
  if (readyResolve) readyResolve();
  window.dispatchEvent(new CustomEvent("revalida-sync-ready"));
}

export function whenReady() {
  if (ready) return Promise.resolve();
  ensureReadyPromise();
  return readyPromise;
}

function parseJson(raw, fallback) {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function provaKey(prova) {
  return `${prova?.nomeProva || ""}|${prova?.data || ""}`;
}

function mergeProvasSalvas(localRaw, remoteRaw) {
  const local = parseJson(localRaw, []);
  const remote = parseJson(remoteRaw, []);
  const map = new Map();

  [...remote, ...local].forEach((prova) => {
    if (!prova || typeof prova !== "object") return;
    const key = provaKey(prova);
    const atual = map.get(key);
    const lenAtual = atual?.questoesErradas?.length || 0;
    const lenNovo = prova.questoesErradas?.length || 0;
    if (!atual || lenNovo >= lenAtual) map.set(key, prova);
  });

  return JSON.stringify([...map.values()]);
}

function historicoId(evt) {
  return (
    evt.id ||
    [
      evt.tipo,
      evt.ts,
      evt.nomeProva || "",
      evt.numero ?? "",
      evt.acertou ?? "",
    ].join("|")
  );
}

function mergeHistorico(localRaw, remoteRaw) {
  const local = parseJson(localRaw, []);
  const remote = parseJson(remoteRaw, []);
  const map = new Map();

  [...remote, ...local].forEach((evt) => {
    if (!evt || typeof evt !== "object") return;
    map.set(historicoId(evt), evt);
  });

  const lista = [...map.values()].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const cortada =
    lista.length > MAX_HISTORICO
      ? lista.slice(lista.length - MAX_HISTORICO)
      : lista;

  return JSON.stringify(cortada);
}

function cardKey(card) {
  if (card?.id) return String(card.id);
  return `${card?.pergunta || ""}|${card?.resposta || ""}`;
}

function pickCard(a, b) {
  if (!a) return b;
  if (!b) return a;
  const repsA = Number(a.reps) || 0;
  const repsB = Number(b.reps) || 0;
  if (repsA !== repsB) return repsA > repsB ? a : b;
  const dueA = Number(a.due) || 0;
  const dueB = Number(b.due) || 0;
  return dueA >= dueB ? a : b;
}

function mergeFlashcardsDeck(localRaw, remoteRaw) {
  const local = parseJson(localRaw, []);
  const remote = parseJson(remoteRaw, []);
  if (!Array.isArray(local) || !Array.isArray(remote)) {
    return JSON.stringify(Array.isArray(remote) && remote.length ? remote : local);
  }
  if (!local.length) return JSON.stringify(remote);
  if (!remote.length) return JSON.stringify(local);

  const map = new Map();
  [...remote, ...local].forEach((card) => {
    if (!card || typeof card !== "object") return;
    const key = cardKey(card);
    map.set(key, pickCard(map.get(key), card));
  });

  return JSON.stringify([...map.values()]);
}

function mergeCronograma(localRaw, remoteRaw) {
  const local = parseJson(localRaw, {});
  const remote = parseJson(remoteRaw, {});
  const merged = { ...remote };

  Object.entries(local).forEach(([key, value]) => {
    if (key.endsWith("_score")) {
      const localScore = Number(value) || 0;
      const remoteScore = Number(merged[key]) || 0;
      const escolhido = Math.max(localScore, remoteScore);
      if (escolhido > 0) merged[key] = String(escolhido);
      else if (value !== undefined && value !== "") merged[key] = value;
    } else if (typeof value === "boolean") {
      merged[key] = Boolean(merged[key]) || value;
    } else if (value !== undefined && value !== null && value !== "") {
      merged[key] = value;
    }
  });

  return JSON.stringify(merged);
}

function mergeBoot(localRaw, remoteRaw) {
  if (localRaw === "1" || remoteRaw === "1") return "1";
  return localRaw || remoteRaw || "";
}

const MERGE_BY_KEY = {
  provas_salvas: mergeProvasSalvas,
  flashcards_deck: mergeFlashcardsDeck,
  "cronograma_2026.1": mergeCronograma,
  revalida_historico: mergeHistorico,
  revalida_historico_boot_v1: mergeBoot,
};

function collectLocalStores() {
  const stores = {};
  SYNC_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) stores[key] = val;
  });
  return stores;
}

function applyStores(stores) {
  applyingRemote = true;
  try {
    Object.entries(stores).forEach(([key, value]) => {
      if (!SYNC_KEYS.includes(key)) return;
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, String(value));
      }
    });
  } finally {
    applyingRemote = false;
  }
}

function mergeStores(localStores, remoteStores) {
  const merged = {};
  SYNC_KEYS.forEach((key) => {
    const mergeFn = MERGE_BY_KEY[key];
    const localVal = localStores[key] ?? null;
    const remoteVal = remoteStores[key] ?? null;
    if (localVal == null && remoteVal == null) return;
    if (localVal == null) {
      merged[key] = remoteVal;
      return;
    }
    if (remoteVal == null) {
      merged[key] = localVal;
      return;
    }
    merged[key] = mergeFn(localVal, remoteVal);
  });
  return merged;
}

function clearSyncedLocalData() {
  SYNC_KEYS.forEach((key) => localStorage.removeItem(key));
}

async function pushStores(uid, stores) {
  if (!db || !uid) return;
  const ref = doc(db, "users", uid, "appData", "main");
  await setDoc(
    ref,
    {
      stores,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function triggerProvasHistoricoSync() {
  if (applyingRemote) return;
  try {
    window.__syncHistoricoProvas?.();
  } catch (err) {
    console.warn("[RevalidaSync] Histórico × provas:", err);
  }
}

function schedulePush() {
  if (applyingRemote || !currentUid || !db) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    if (!currentUid) return;
    try {
      await pushStores(currentUid, collectLocalStores());
    } catch (err) {
      console.warn("[RevalidaSync] Falha ao enviar dados:", err);
    }
  }, PUSH_DELAY_MS);
}

export function installStorageSync() {
  if (storagePatched) return;
  storagePatched = true;

  const origSet = Storage.prototype.setItem;
  const origRemove = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key, value) {
    origSet.call(this, key, value);
    if (this === localStorage) {
      if (key === "provas_salvas") triggerProvasHistoricoSync();
      if (SYNC_KEYS.includes(key)) schedulePush();
    }
  };

  Storage.prototype.removeItem = function (key) {
    origRemove.call(this, key);
    if (this === localStorage) {
      if (key === "provas_salvas") triggerProvasHistoricoSync();
      if (SYNC_KEYS.includes(key)) schedulePush();
    }
  };
}

export async function syncUserData(user) {
  if (!isFirebaseConfigured() || !db || !user?.uid) {
    markReady();
    return;
  }

  ensureReadyPromise();
  installStorageSync();
  currentUid = user.uid;

  const previousUid = sessionStorage.getItem(UID_SESSION_KEY);
  const trocouConta = previousUid && previousUid !== user.uid;
  if (trocouConta) clearSyncedLocalData();
  sessionStorage.setItem(UID_SESSION_KEY, user.uid);

  const localStores = trocouConta ? {} : collectLocalStores();

  try {
    const ref = doc(db, "users", user.uid, "appData", "main");
    const snap = await getDoc(ref);
    const remoteStores = snap.exists() ? snap.data().stores || {} : {};
    const hasRemote = Object.keys(remoteStores).length > 0;
    const hasLocal = Object.keys(localStores).length > 0;

    let merged;
    if (!hasRemote && hasLocal) {
      merged = localStores;
      await pushStores(user.uid, merged);
    } else if (hasRemote && !hasLocal) {
      merged = remoteStores;
    } else {
      merged = mergeStores(localStores, remoteStores);
      if (JSON.stringify(merged) !== JSON.stringify(remoteStores)) {
        await pushStores(user.uid, merged);
      }
    }

    applyStores(merged);
    triggerProvasHistoricoSync();
  } catch (err) {
    console.warn("[RevalidaSync] Falha ao sincronizar:", err);
  } finally {
    markReady();
  }
}

export function flushSync() {
  if (!currentUid) return Promise.resolve();
  clearTimeout(pushTimer);
  return pushStores(currentUid, collectLocalStores()).catch((err) => {
    console.warn("[RevalidaSync] Falha ao enviar dados:", err);
  });
}

if (typeof window !== "undefined") {
  ensureReadyPromise();
  installStorageSync();
  window.RevalidaSync = {
    SYNC_KEYS,
    whenReady,
    flushSync,
  };
}
