import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ANWEISUNGEN, mcpServer } from "../src/server";
import { WERKZEUGE } from "../src/werkzeuge";
import { stand, zuruecksetzen } from "../src/zaehler";

/** Alle 24 Werkzeuge von lintelly.com/tools und das Werkzeug, das sie hier abdeckt (Nick 23.10.2026: „alles rein“). */
const WEBSITE: Record<string, string> = {
  "kuendigungsfrist-rechner": "kuendigungsfrist_rechnen", "urlaubsanspruch-rechner": "urlaubsanspruch", "arbeitszeugnis-generator": "arbeitszeugnis",
  "stellenanzeigen-generator": "stellenanzeige_check", "arbeitsvertrag-check": "nachweis_pflichtangaben", "befristung-rechner": "befristung",
  "mutterschutz-rechner": "mutterschutz", "abfindungsrechner": "abfindung_faustformel", "pausen-rechner": "pausen", "bem-pflicht-rechner": "bem_pflicht",
  "elternzeit-fristenrechner": "elternzeit_fristen", "interviewfragen-generator": "interviewfragen_check", "schwellenwerte-check": "schwellen_check",
  "kuendigungsschreiben-generator": "kuendigungsschreiben", "probezeit-rechner": "probezeit", "entgeltfortzahlung-rechner": "entgeltfortzahlung",
  "abmahnung-generator": "abmahnung", "minijob-rechner": "minijob", "aufbewahrungsfristen-rechner": "aufbewahrungsfristen",
  "urlaubsabgeltung-rechner": "urlaubsabgeltung", "urlaubsverfall-hinweis-generator": "urlaubsverfall_hinweis",
  "mitarbeitergespraech-leitfaden": "mitarbeitergespraech_leitfaden", "sonderkuendigungsschutz-check": "sonderkuendigungsschutz_check", "ausgleichsabgabe-rechner": "ausgleichsabgabe",
};
/** Die acht Werkzeuge aus dem Wissen-Konzept; checkliste ging in ablauf auf (Plan Abschnitt 2). */
const WISSEN = ["kuendigungsfrist_rechnen", "rechtswerte_suchen", "rechtswert", "vertragsbausteine_suchen", "vertragsbaustein", "klausel_pruefen", "workflow_vorlage", "ablauf"];
const PLAN = ["klagefrist", "arbeitgeberkosten", "mindestlohn_check", "sofortmeldepflicht", "frist_merken", "kuendigung_pflichtangaben", "rechtsaenderungen"];

let client: Client;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await mcpServer(() => new Date("2026-10-23T10:00:00Z")).connect(b);
  client = new Client({ name: "test", version: "1" });
  await client.connect(a);
});
afterAll(() => client.close());

const text = (r: any) => JSON.parse((r.content as { text: string }[])[0].text);

describe("Werkzeuge", () => {
  it("deckt alle 24 Website-Werkzeuge, die 8 Wissen-Werkzeuge und die Werkzeuge des Plans ab", async () => {
    const namen = (await client.listTools()).tools.map((t) => t.name);
    for (const n of [...Object.values(WEBSITE), ...WISSEN, ...PLAN]) expect(namen, n).toContain(n);
    expect(Object.keys(WEBSITE)).toHaveLength(24);
    expect(new Set(namen).size).toBe(namen.length);
  });
  it("jedes Werkzeug: Titel, Annotationen, Beschreibung, keine unbekannten Felder, kein Feld für Namen", async () => {
    for (const t of (await client.listTools()).tools) {
      expect(t.title, t.name).toBeTruthy();
      expect(t.annotations, t.name).toEqual({ title: t.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
      expect(t.description!.length, t.name).toBeGreaterThan(80);
      expect(t.inputSchema.additionalProperties, t.name).toBe(false);
      expect(Object.keys(t.inputSchema.properties ?? {}).join(" "), t.name).not.toMatch(/\b(name|vorname|nachname|email|e_mail|anschrift|adresse|telefon|geburtsname)\b/i);
    }
  });
  it("Beschreibungen ohne Verweis auf andere Werkzeuge und ohne Anweisung an das Modell (Anthropic-Verzeichnis, Nick 25.10.2026)", async () => {
    const tools = (await client.listTools()).tools;
    for (const t of tools) {
      for (const n of tools.map((x) => x.name).filter((n) => n !== t.name)) expect(t.description, t.name).not.toMatch(new RegExp(`\\b${n}\\b`));
      expect(t.description, t.name).not.toMatch(/\bthen (use|write|rewrite|draft|fill)\b|\byou fill\b|\bask the user\b/i);
    }
  });
  it("Antwortformat: Ergebnis, Quellen, Hinweis, Stand, Herausgeber", async () => {
    const a = text(await client.callTool({ name: "rechtswert", arguments: { kennung: "mindestlohn" } }));
    expect(a).toMatchObject({ hinweis: "Allgemeine Auskunft, keine Rechtsberatung im Einzelfall.", stand: "2026-10-23", herausgeber: "Lintelly, lintelly.com" });
    expect(a.ergebnis.wert).toBe("13,90 €");
  });
  it("ungültige Eingabe wird abgelehnt und als Fehler gezählt, ohne Rohwert", async () => {
    zuruecksetzen();
    const r = await client.callTool({ name: "kuendigungsfrist_rechnen", arguments: { eintritt: "2025-01-01", zugang: "2026-10-07", name: "Tom Meier" } });
    expect(r.isError).toBe(true);
    expect(stand().zahlen.kuendigungsfrist_rechnen).toEqual({ aufrufe: 0, fehler: 1, baender: {} });
    expect(JSON.stringify(stand())).not.toMatch(/Tom|Meier/);
  });
  it("Zähler: nur Werkzeug, Tag und Bänder, nie Beträge oder Daten", async () => {
    zuruecksetzen();
    await client.callTool({ name: "arbeitgeberkosten", arguments: { art: "vollzeit", brutto_monat: 4321, stichtag: "2026-11-01" } });
    await client.callTool({ name: "kuendigungsfrist_rechnen", arguments: { eintritt: "2019-03-01", zugang: "2026-11-15", bundesland: "HE" } });
    const s = stand();
    expect(s.zahlen.arbeitgeberkosten).toEqual({ aufrufe: 1, fehler: 0, baender: { art: { vollzeit: 1 } } });
    expect(s.zahlen.kuendigungsfrist_rechnen.baender).toEqual({ land: { HE: 1 } });
    expect(JSON.stringify(s)).not.toMatch(/4321|2019-03-01|2026-11-15/);
  });
});

describe("Eingaben und Fehler (Review 29.10.2026)", () => {
  it("unmögliche und ferne Daten: Fehler mit klarem Text, kein Weiterrechnen", async () => {
    const r = await client.callTool({ name: "klagefrist", arguments: { zugang: "2026-02-30" } });
    expect(r.isError).toBe(true);
    expect(text(r)).toEqual({ fehler: ["zugang: Den Tag 2026-02-30 gibt es im Kalender nicht."] });
    const f = await client.callTool({ name: "abfindung_faustformel", arguments: { monatsgehalt_brutto: 4000, eintritt: "2020-01-01", austritt: "2199-12-31" } });
    expect(text(f)).toEqual({ fehler: ["austritt: Das Jahr muss zwischen 1950 und 2100 liegen."] });
    expect(text(await client.callTool({ name: "befristung", arguments: { beginn: "1949-12-31" } })).fehler[0]).toMatch(/1950 und 2100/);
  });
  it("jedes Werkzeug mit Daten rechnet am Rand 1950 und 2100 schnell und ohne Hänger", () => {
    for (const w of WERKZEUGE) {
      const daten = Object.entries(w.eingabe.properties).filter(([, f]) => "format" in f && f.format === "date").map(([k]) => k);
      if (!daten.length) continue;
      for (const tag of ["1950-01-01", "2100-12-31"]) {
        const start = performance.now();
        try { w.ausfuehren(Object.fromEntries(daten.map((k) => [k, tag])), "2026-10-23"); } catch { /* Fehler sind erlaubt, Hänger nicht */ }
        expect(performance.now() - start, `${w.name} ${tag}`).toBeLessThan(500);
      }
    }
  });
  it("ganze Zahlen: Kommazahl abgelehnt, Jahr als Zahl oder als Text", async () => {
    expect(text(await client.callTool({ name: "kuendigungsfrist_rechnen", arguments: { eintritt: "2025-01-01", zugang: "2026-10-07", probezeit_monate: 2.5 } })))
      .toEqual({ fehler: ["probezeit_monate muss eine ganze Zahl sein."] });
    for (const jahr of [2026, "2026"]) expect(text(await client.callTool({ name: "minijob", arguments: { jahr, stundenlohn: 15 } })).ergebnis.jahr).toBe(2026);
  });
  it("eine Fehlerform: isError mit Liste fehler, auch für Fehler aus der Rechnung, und jeder Fehler wird gezählt", async () => {
    zuruecksetzen();
    const r = await client.callTool({ name: "urlaubsabgeltung", arguments: { tage_pro_woche: 5 } });
    expect(r.isError).toBe(true);
    expect(text(r)).toEqual({ fehler: ["Es fehlt der Verdienst: monatsgehalt_brutto oder verdienst_13_wochen."] });
    expect((await client.callTool({ name: "gibt_es_nicht", arguments: {} })).isError).toBe(true);
    expect(stand().zahlen.urlaubsabgeltung.fehler).toBe(1);
    expect(stand().zahlen.unbekanntes_werkzeug.fehler).toBe(1);
  });
  it("outputSchema an jedem Werkzeug, structuredContent gleich dem JSON-Text", async () => {
    for (const t of (await client.listTools()).tools) expect(t.outputSchema?.required, t.name).toContain("ergebnis");
    const r = await client.callTool({ name: "rechtswert", arguments: { kennung: "mindestlohn" } });
    expect(r.structuredContent).toEqual(text(r));
  });
  it("unbekannter Prompt und unbekannte Ressource: ungültige Angabe statt interner Fehler", async () => {
    await expect(client.getPrompt({ name: "gibt_es_nicht" })).rejects.toMatchObject({ code: -32602 });
    await expect(client.readResource({ uri: "lintelly-hr://gibt-es-nicht" })).rejects.toMatchObject({ code: -32602 });
  });
});

describe("Prompts, Ressourcen, Anweisungen", () => {
  it("vier Prompts wie im Plan", async () => {
    const p = (await client.listPrompts()).prompts.map((x) => x.title);
    expect(p).toEqual(["HR-Sprechstunde", "Erste Einstellung", "Jemand ist krank", "Kündigung vorbereiten"]);
    const g = await client.getPrompt({ name: "erste_einstellung", arguments: { beginn: "2026-12-01", stunden: "20" } });
    expect((g.messages[0].content as { text: string }).text).toMatch(/2026-12-01[\s\S]*ablauf mit art erste_einstellung/);
  });
  it("Rechtswerte als JSON mit 228 öffentlichen Werten, Abläufe als Markdown", async () => {
    const r = (await client.listResources()).resources;
    expect(r.map((x) => x.uri)).toContain("lintelly-hr://rechtswerte");
    expect(r.filter((x) => x.mimeType === "text/markdown").length).toBe(10);
    const inhalt = await client.readResource({ uri: "lintelly-hr://rechtswerte" });
    expect(JSON.parse((inhalt.contents[0] as { text: string }).text).werte).toHaveLength(228);
  });
  it("Lintelly steht in den Anweisungen genau einmal als Herausgeber, ohne Werbung", () => {
    expect(ANWEISUNGEN.match(/Herausgeber ist Lintelly/g)).toHaveLength(1);
    expect(ANWEISUNGEN).not.toMatch(/eigener Software|ab 10 Beschäftigten/);
  });
});

describe("Zähler mit Datei", () => {
  it("eine kaputte Tagesdatei stört keinen Aufruf", async () => {
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const ordner = mkdtempSync(`${tmpdir()}/lhr-`);
    writeFileSync(`${ordner}/2026-10-23.json`, "{kaputt");
    process.env.ZAEHLER_ORDNER = ordner;
    zuruecksetzen();
    const r = await client.callTool({ name: "rechtswert", arguments: { kennung: "mindestlohn" } });
    delete process.env.ZAEHLER_ORDNER;
    expect(r.isError).toBeFalsy();
    expect(stand().zahlen.rechtswert.aufrufe).toBe(1);
  });
});
