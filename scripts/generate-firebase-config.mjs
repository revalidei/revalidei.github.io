import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "js", "firebase-config.js");

const required = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId"
];

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

const raw = process.env.FIREBASE_CONFIG?.trim();

if (!raw) {
  fail(
    "Defina o secret FIREBASE_CONFIG no GitHub (Settings → Secrets → Actions). Veja FIREBASE_SETUP.md."
  );
}

let config;

try {
  config = JSON.parse(raw);
} catch {
  fail("FIREBASE_CONFIG deve ser um JSON válido (objeto firebaseConfig do Console).");
}

for (const key of required) {
  if (!config[key] || String(config[key]).includes("YOUR_")) {
    fail(`FIREBASE_CONFIG está incompleto: campo "${key}" ausente ou placeholder.`);
  }
}

const contents = `/**
 * Gerado no deploy — não editar manualmente no servidor.
 * Local: use js/firebase-config.js (copiado do .example).
 */
export const firebaseConfig = ${JSON.stringify(config, null, 2)};
`;

writeFileSync(outPath, contents, "utf8");
console.log(`Wrote ${outPath}`);
