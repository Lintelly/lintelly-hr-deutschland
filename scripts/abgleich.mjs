#!/usr/bin/env node
// Abgleich: übernimmt die reinen Module (Rechtswerte, Rechner, Bausteine, Abläufe) und ihre Tests wörtlich aus der
// Lintelly-Werkbank und von lintelly.com nach packages/kern. Jede Zahl gibt es so nur einmal: in der Quelle.
//   node scripts/abgleich.mjs            kopiert
//   node scripts/abgleich.mjs --pruefen  vergleicht nur, Ausgang 1 bei Abweichung
// Pfade: WERKBANK und WEBSITE (Standard: Nachbarordner ../werkbank und ../website).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const HIER = path.resolve(import.meta.dirname, "..");
const WERKBANK = path.resolve(HIER, process.env.WERKBANK ?? "../werkbank");
const WEBSITE = path.resolve(HIER, process.env.WEBSITE ?? "../website");
const ZIEL = path.join(HIER, "packages/kern");
const pruefen = process.argv.includes("--pruefen");
if (pruefen && !(existsSync(WERKBANK) && existsSync(WEBSITE))) {
  console.log("Abgleich übersprungen: Werkbank oder Website liegt hier nicht (z. B. in GitHub Actions).");
  process.exit(0);
}

const AUS_WERKBANK = [
  "lib/types.ts", "lib/format.ts", "lib/heute.ts", "lib/sofortmeldung.ts", "lib/dokumente/englisch.ts",
  ...["datum", "werte", "register", "rechtszahlen", "fundstellen", "mindestlohn", "midijob", "dienstwagen", "dienstrad"].map((f) => `lib/regeln/${f}.ts`),
  ...["allgemein", "empfehlung", "gruppe-a", "gruppe-bc", "gruppe-d-fest", "gruppe-d-variabel", "gruppe-efgh", "gruppe-ijk", "gruppe-lmn",
    "gruppe-opqs", "hilfen", "katalog", "provision", "pruefen", "rot", "typen", "kanzlei", "eingabe"].map((f) => `lib/vertragsbausteine/${f}.ts`),
  ...["kern", "vorlagen", "anzeige", "bauen"].map((f) => `lib/workflows/${f}.ts`),
  "lib/module/plaene.ts",
  ...["running-list-a15", "umbau-29-dienstwagen-rechner", "workflow-kern", "workflow-vorlagen", "midijob"].map((f) => `tests/${f}.test.ts`),
  ...["hilfe.ts", "allgemein.test.ts", "gruppe-a-c.test.ts", "gruppe-d.test.ts", "gruppe-e-k.test.ts", "gruppe-l-s.test.ts", "provision.test.ts", "rote-liste.test.ts"]
    .map((f) => `tests/vertragsbausteine/${f}`),
];
const AUS_WEBSITE = [
  "lib/fristen.ts", "lib/erinnerung-pruefung.ts",
  ...["abfindung", "arbeitszeugnis", "aufbewahrungsfristen", "ausgleichsabgabe", "befristung", "bem", "elternzeit", "entgeltfortzahlung", "minijob",
    "mutterschutz", "pausen", "probezeit", "schwellenwerte", "sonderkuendigungsschutz", "urlaubsabgeltung", "urlaubsanspruch"]
    .map((f) => `components/tools/${f}-logik.ts`),
  "components/tools/datum.ts", "components/tools/format.ts", "components/tools/stellenanzeigen-agg.ts", "components/tools/sensibel.ts",
  ...["test-geld", "test-tools", "test-tools-logik", "test-urlaub", "test-ux-fristen", "test-ux-geld", "test-ux-pflichten", "test-ux-trennung"]
    .map((f) => `scripts/${f}.mjs`),
];

// Vier Dateien entstehen als Auszug, weil ihr Original Datenbank, React, eine Log-Datei oder Seiteninhalt mitbringt: nur, was die Kopien brauchen.
function auszug(text, anfang, ende) {
  const a = text.indexOf(anfang), e = text.indexOf(ende, a);
  if (a < 0 || e < 0) throw new Error(`Auszug nicht gefunden: ${anfang}`);
  return text.slice(a, e + ende.length);
}
const AUSZUEGE = [
  {
    ziel: "werkbank/lib/regeln/engine.ts", quelle: path.join(WERKBANK, "lib/regeln/engine.ts"),
    bau: (t) => `/** Auszug aus lib/regeln/engine.ts der Werkbank: nur die Typen, die module/plaene.ts braucht (scripts/abgleich.mjs). */\nimport type { ISODate } from "./datum";\n\n${auszug(t, "export type Kategorie", "\n};")}\n`,
  },
  {
    ziel: "website/components/tools/ui.ts", quelle: path.join(WEBSITE, "components/tools/ui.tsx"),
    bau: (t) => `/** Auszug aus components/tools/ui.tsx von lintelly.com: nur der Typ Level (scripts/abgleich.mjs). */\n${auszug(t, "export type Level", ";")}\n`,
  },
  {
    // Das Original schreibt data/logs/fehler.log. Der MCP schreibt keine Dateien beim Nutzer: hier nur auf die Konsole (stderr).
    ziel: "werkbank/lib/fehler.ts", quelle: path.join(WERKBANK, "lib/fehler.ts"),
    bau: (t) => `/** Auszug aus lib/fehler.ts der Werkbank: nur logFehler, ohne Log-Datei, nur stderr (scripts/abgleich.mjs). */\n${auszug(t, "export function logFehler", "\n}")}\n\n${auszug(t, "const art =", ";\n")}${auszug(t, "const stelle =", ";\n")}const ausgeben = (zeile: string) => console.error(zeile);\n`,
  },
  {
    // Das Original prüft am Ende die Tabelle auf /tools/kuendigungsfrist-rechner (lib/tools/batch-1.ts, Seiteninhalt): hier nur die Rechner-Tests.
    ziel: "website/scripts/test-fristen.mjs", quelle: path.join(WEBSITE, "scripts/test-fristen.mjs"),
    bau: (t) => {
      const ende = t.indexOf("\n// Tabelle ");
      return (ende < 0 ? t.slice(0, t.lastIndexOf("console.log(")) : t.slice(0, ende + 1)) + "console.log(`\\n${n} Tests bestanden.`);\n";
    },
  },
];

const dateien = [
  ...AUS_WERKBANK.map((d) => ({ ziel: `werkbank/${d}`, inhalt: () => readFileSync(path.join(WERKBANK, d), "utf8") })),
  ...AUS_WEBSITE.map((d) => ({ ziel: `website/${d}`, inhalt: () => readFileSync(path.join(WEBSITE, d), "utf8") })),
  ...AUSZUEGE.map((a) => ({ ziel: a.ziel, inhalt: () => a.bau(readFileSync(a.quelle, "utf8")) })),
];

let abweichend = 0;
for (const d of dateien) {
  const soll = d.inhalt();
  const pfad = path.join(ZIEL, d.ziel);
  const ist = existsSync(pfad) ? readFileSync(pfad, "utf8") : null;
  if (ist === soll) continue;
  abweichend++;
  if (pruefen) { console.log(`abweichend: packages/kern/${d.ziel}`); continue; }
  mkdirSync(path.dirname(pfad), { recursive: true });
  writeFileSync(pfad, soll);
  console.log(`übernommen: packages/kern/${d.ziel}`);
}
console.log(`${dateien.length} Dateien, ${abweichend} ${pruefen ? "abweichend" : "geändert"}`);
if (pruefen && abweichend) process.exit(1);
