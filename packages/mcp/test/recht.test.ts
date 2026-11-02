import { describe, expect, it } from "vitest";
import { GRUND_TEXT } from "@/lib/regeln/register";
import { RESSOURCEN } from "../src/ressourcen";
import { rufe } from "./hilfe";

describe("rechtswert", () => {
  it("Mindestlohn ab Januar 2027: 14,60 €, § 1 MiLoV5, geprüft am 10.10.2026 (Wissen-Konzept Abschnitt 6)", () => {
    const a = rufe("rechtswert", { kennung: "mindestlohn", stichtag: "2027-01-01" });
    expect(a.ergebnis.wert).toBe("14,60 €");
    expect(a.quellen[0]).toMatchObject({ norm: expect.stringMatching(/^§ 1 MiLoV5/), geprueft_am: "2026-10-10", status: "bestätigt" });
    expect(a.quellen[0].url).toBe("https://www.gesetze-im-internet.de/milov5/__1.html");
    expect(a.ergebnis.alle_werte).toHaveLength(4);
  });
  it("unbekannte Kennung nennt passende Treffer statt zu raten", () => {
    const a = rufe("rechtswert", { kennung: "mindestlohnn" });
    expect(a.ergebnis.gefunden).toBe(false);
    expect(a.ergebnis.vorschlaege).toContain("mindestlohn");
  });
  it("eigene Annahmen von Lintelly (Rhythmus Lintelly) sind nicht öffentlich", () => {
    const alle = rufe("rechtswerte_suchen", { suchtext: "" }).ergebnis.anzahl_gesamt;
    expect(alle).toBe(228);
  });
});

describe("Grund statt pauschal „noch nicht bestätigt“", () => {
  it("Quelle und Ressource nennen den Grund aus dem Register", () => {
    const q = rufe("rechtswert", { kennung: "mindesturlaub" }).quellen[0];
    expect(q).toMatchObject({ status: "noch nicht bestätigt", grund: GRUND_TEXT.Umrechnung });
    const r = JSON.parse(RESSOURCEN[0].lesen("2026-10-23")).werte.find((w: { kennung: string }) => w.kennung === "mindesturlaub");
    expect(r.grund).toBe(GRUND_TEXT.Umrechnung);
    expect(rufe("rechtswert", { kennung: "mindestlohn" }).quellen[0]).not.toHaveProperty("grund");
  });
});

describe("rechtswerte_suchen", () => {
  it("findet den Mindestlohn mit Wert am Stichtag", () => {
    const a = rufe("rechtswerte_suchen", { suchtext: "Mindestlohn", stichtag: "2026-06-01" });
    const m = a.ergebnis.treffer.find((t: { kennung: string }) => t.kennung === "mindestlohn");
    expect(m).toMatchObject({ wert: "13,90 €", status: "bestätigt" });
    expect(a.ergebnis.treffer.length).toBeLessThanOrEqual(20);
  });
});

describe("rechtsaenderungen", () => {
  it("1. Januar 2027: Mindestlohn 14,60 € und Minijob-Grenze 633 € stehen drin", () => {
    const a = rufe("rechtsaenderungen", { von: "2027-01-01", bis: "2027-01-01" });
    const ids = a.ergebnis.aenderungen.map((x: { kennung: string }) => x.kennung);
    expect(ids).toEqual(expect.arrayContaining(["mindestlohn", "minijobGrenze"]));
    const m = a.ergebnis.aenderungen.find((x: { kennung: string }) => x.kennung === "mindestlohn");
    expect(m).toMatchObject({ ab: "2027-01-01", neu: "14,60 €", vorher: "13,90 €" });
  });
  it("gleicher Wert mit neuem Datum ist keine Änderung (2,6 % statt 2,6 %)", () => {
    const a = rufe("rechtsaenderungen", { von: "2027-01-01", bis: "2027-01-01" });
    expect(a.ergebnis.aenderungen.filter((x: { neu: string; vorher: string }) => x.neu === x.vorher)).toEqual([]);
  });
  it("noch ausstehende Werte werden genannt, nicht geschätzt", () => {
    const a = rufe("rechtsaenderungen", { von: "2027-01-01", bis: "2027-01-01" });
    expect(a.ergebnis.ausstehend.map((x: { kennung: string }) => x.kennung)).toEqual(expect.arrayContaining(["satzKvPv"]));
  });
});

describe("amtliche Quellen", () => {
  it("jeder öffentliche Rechtswert mit Link zeigt auf eine amtliche Seite (Bedingung für den automatischen Merge)", async () => {
    const { REGISTER, erlaubteQuelle } = await import("@/lib/regeln/register");
    const fremd = REGISTER.filter((e) => e.rhythmus !== "Lintelly" && e.quelleUrl && !erlaubteQuelle(e.quelleUrl)).map((e) => `${e.id}: ${e.quelleUrl}`);
    expect(fremd).toEqual([]);
  });
});
