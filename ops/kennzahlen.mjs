#!/usr/bin/env node
// Kennzahlen von Lintelly HR für den Vormonat, am 1. per Telegram (Plan Abschnitt 7, Nick 23.10.2026 „Telegram monatlich“).
// Liest nur die Tagesdateien der Zählung (zaehler/JJJJ-MM-TT.json), keine Personendaten. Aufruf auf ops-01:
//   node kennzahlen.mjs ~/lintelly-hr/zaehler            sendet an Telegram (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
//   node kennzahlen.mjs ~/lintelly-hr/zaehler --probe    druckt nur
//   node kennzahlen.mjs ~/lintelly-hr/zaehler --probe --monat 2026-10   anderer Monat
// Seit 29.10.2026: Band „Kanal“ (claude, chatgpt, cursor, andere, aus dem User-Agent), eigene Tests (Schlüssel _eigen, z. B. der
// wöchentliche Kompatibilitätstest) zählen nicht als Nutzung, kaputte Tagesdateien werden übersprungen und genannt.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const vormonat = (heute) => {
  const [j, m] = heute.split("-").map(Number);
  return m === 1 ? `${j - 1}-12` : `${j}-${String(m - 1).padStart(2, "0")}`;
};

const plus = (ziel, quelle) => { for (const [k, n] of Object.entries(quelle ?? {})) ziel[k] = (ziel[k] ?? 0) + n; };
const absteigend = (o) => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const liste = (o) => absteigend(o).map(([k, n]) => `${k} ${n}`).join(", ") || "keine Angabe";

/** Schlüssel der eigenen Testaufrufe in der Tagesdatei (packages/mcp/src/zaehler.ts EIGEN). */
export const EIGEN = "_eigen";

/** Liest die Tagesdateien eines Monats; eine kaputte Datei bricht nichts ab, sie landet in `kaputt`. */
export function lesen(ordner, monat) {
  const tage = [], kaputt = [];
  for (const f of readdirSync(ordner).filter((f) => f.startsWith(monat) && f.endsWith(".json")).sort()) {
    try {
      const t = JSON.parse(readFileSync(path.join(ordner, f), "utf8"));
      if (!t || typeof t !== "object" || Array.isArray(t)) throw new Error("kein Objekt");
      tage.push(t);
    } catch { kaputt.push(f); }
  }
  return { tage, kaputt };
}

export function bericht(monat, tage, extra) {
  const werkzeuge = {}, ablauf = {}, groesse = {}, land = {}, art = {}, client = {};
  let fehler = 0, eigen = 0;
  for (const tag of tage) for (const [name, z] of Object.entries(tag)) {
    if (!z || typeof z !== "object") continue;
    if (name === EIGEN) { eigen += (z.aufrufe ?? 0) + (z.fehler ?? 0); continue; }
    const b = z.baender ?? {};
    plus(werkzeuge, { [name]: z.aufrufe ?? 0 });
    fehler += z.fehler ?? 0;
    plus(ablauf, b.ablauf); plus(groesse, b.groesse); plus(land, b.land); plus(art, b.art); plus(client, b.client);
  }
  const gesamt = Object.values(werkzeuge).reduce((a, b) => a + b, 0);
  const kopf = `Nick, Lintelly HR im ${monat}`;
  const fuss = [
    ...(eigen ? [`Eigene Tests (nicht mitgezählt): ${eigen}`] : []),
    ...(extra.kaputt?.length ? [`Kaputte Tagesdateien übersprungen: ${extra.kaputt.join(", ")}`] : []),
  ];
  if (!gesamt && !fehler) return [`${kopf}: keine Aufrufe.${extra.sterne !== undefined ? ` GitHub-Sterne: ${extra.sterne}.` : ""}`, ...fuss].join("\n");
  return [
    `${kopf}`,
    `Aufrufe: ${gesamt} an ${tage.length} ${tage.length === 1 ? "Tag" : "Tagen"}. Fehler: ${fehler}.`,
    `Kanal: ${liste(client)}`,
    "",
    "Top 5 Werkzeuge:",
    ...absteigend(werkzeuge).slice(0, 5).map(([k, n], i) => `${i + 1}. ${k} ${n}`),
    "",
    `Abläufe: ${liste(ablauf)}`,
    `Firmengröße: ${liste(groesse)}`,
    `Beschäftigungsart: ${liste(art)}`,
    `Bundesland: ${liste(land)}`,
    "",
    ...(extra.sterne !== undefined ? [`GitHub-Sterne: ${extra.sterne}`] : []),
    ...fuss,
    "Nicht in diesem Bericht: Frist-merken-Anmeldungen, Klicks auf lintelly.com/hr und gebuchte Erstgespräche (andere Quellen).",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ordner = process.argv[2];
  const i = process.argv.indexOf("--monat");
  const monat = i > 0 ? process.argv[i + 1] : vormonat(new Date().toISOString().slice(0, 10));
  const { tage, kaputt } = lesen(ordner, monat);
  const sterne = await fetch("https://api.github.com/repos/Lintelly/lintelly-hr-deutschland").then((r) => r.json()).then((j) => j.stargazers_count).catch(() => undefined);
  const text = bericht(monat, tage, { sterne, kaputt });
  if (process.argv.includes("--probe")) console.log(text);
  else {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    });
    if (!r.ok) { console.error(`Telegram ${r.status}`); process.exit(1); }
  }
}
