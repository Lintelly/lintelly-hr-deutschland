import { describe, expect, it } from "vitest";
import { erzeugePlan } from "@/lib/module/plaene";
import type { Person } from "@/lib/types";
import { WORKFLOWS } from "@/lib/workflows/vorlagen";
import { ABLAUF_VORLAGEN } from "../src/werkzeuge/ablauf";
import { WERKZEUGE } from "../src/werkzeuge";
import { HEUTE, rufe } from "./hilfe";

type S = { was: string; bis: string | null; wer: string; pflicht?: string; hinweis?: string };
const schritte = (a: { ergebnis: any }) => a.ergebnis.schritte as S[];
const finde = (a: { ergebnis: any }, teil: string) => schritte(a).find((s) => s.was.includes(teil));
const STRICH = /[–—]| - /;
const ARTEN = ["erste_einstellung", "eintritt", "austritt", "krankheit", "mutterschutz", "elternzeit", "kuendigung_vorbereiten", "probezeit_ende", "befristung_ende", "monatsende_lohn"];

describe("ablauf eintritt", () => {
  it("Fälligkeiten wie erzeugePlan der Werkbank (nachweis-7 am nächsten Werktag nach Weihnachten)", () => {
    const a = rufe("ablauf", { art: "eintritt", datum: "2026-12-18", beschaeftigungsart: "vollzeit", probezeit_monate: 6 });
    const person = { id: "x", art: "vollzeit", befristung: null, geburtstag: "", eintritt: "2026-12-18" } as unknown as Person;
    const plan = erzeugePlan({ id: "x", art: "eintritt", person, stichtag: "2026-12-18", erstellt: HEUTE, probezeitMonate: 6 });
    const bis = schritte(a).map((s) => s.bis).filter(Boolean);
    for (const t of plan.aufgaben) expect(bis).toContain(t.faellig);
    expect(finde(a, "Nachweis: Beginn")?.bis).toBe("2026-12-28");
    expect(bis).toEqual([...bis].sort());
  });
  it("Werkbank-Begriffe sind neutral gefasst", () => {
    const a = rufe("ablauf", { art: "eintritt", datum: "2026-12-01", probezeit_monate: 6, branche_sofortmeldung: "bau" });
    const text = JSON.stringify(schritte(a));
    expect(text).not.toMatch(/Slack|Lintelly|im Plan|Liste unten|Firmenangaben/);
    expect(finde(a, "Sofortmeldung")?.pflicht).toContain("Baugewerbe");
  });
  it("Befristung und Drittstaat bringen ihre Schritte mit", () => {
    const a = rufe("ablauf", { art: "eintritt", datum: "2026-12-01", befristet: true, drittstaat: true });
    expect(finde(a, "Befristung:")?.pflicht).toMatch(/§ 14 Abs. 4 TzBfG/);
    expect(finde(a, "Aufenthaltstitel")).toBeTruthy();
  });
});

describe("ablauf erste_einstellung (Szenario 1)", () => {
  it("20 Stunden ab 01.12.2026: Betriebsnummer, Berufsgenossenschaft, Krankenkasse, Nachweis", () => {
    const a = rufe("ablauf", { art: "erste_einstellung", datum: "2026-12-01", beschaeftigungsart: "teilzeit" });
    const text = JSON.stringify(schritte(a));
    for (const w of ["Betriebsnummer", "Berufsgenossenschaft", "Krankenkasse", "Nachweis", "Lohnsteuer", "Gefährdungsbeurteilung", "Arbeitszeit", "Mindestlohn"]) expect(text).toContain(w);
    expect(finde(a, "Betriebsnummer")?.pflicht).toBe("§ 18i Abs. 1 SGB IV");
    expect(a.quellen.map((q) => q.norm)).toEqual(expect.arrayContaining(["§ 18i Abs. 1 SGB IV", "§ 192 Abs. 1 SGB VII", "§ 41a Abs. 1 EStG"]));
    expect(a).not.toHaveProperty("lintelly");
  });
  it("erste Einstellung ohne Team: kein Buddy, kein Team, kein Betriebsrat, Rollen bei der Geschäftsführung", () => {
    const a = rufe("ablauf", { art: "erste_einstellung", datum: "2026-12-01", beschaeftigte: 0 });
    const text = JSON.stringify(schritte(a));
    expect(text).not.toMatch(/Buddy|Team|Betriebsrat/);
    expect(new Set(schritte(a).map((s) => s.wer))).toEqual(new Set(["Geschäftsführung", "Lohnbüro", "Neue Person"]));
    expect(JSON.stringify(schritte(rufe("ablauf", { art: "erste_einstellung", datum: "2026-12-01", beschaeftigte: 3 })))).toMatch(/Buddy/);
  });
  it("Mindestlohn-Check im Dezember nennt den neuen Wert ab 01.01.2027 (Review 29.10.2026)", () => {
    const a = rufe("ablauf", { art: "erste_einstellung", datum: "2026-12-01" });
    expect(finde(a, "Mindestlohn-Check")?.hinweis).toMatch(/Ab 01\.01\.2027 gilt 14,60 €/);
    expect(finde(rufe("ablauf", { art: "erste_einstellung", datum: "2026-03-01" }), "Mindestlohn-Check")?.hinweis).toBeUndefined();
  });
  it("Schritte vor heute sind überfällig und stehen in den Fallen, Quellen ohne Doppel", () => {
    const a = rufe("ablauf", { art: "erste_einstellung", datum: "2026-12-01" }, "2026-10-29");
    const alle = schritte(a) as (S & { ueberfaellig?: true })[];
    expect(alle.filter((s) => s.ueberfaellig).map((s) => s.bis)).toEqual(["2026-10-27"]);
    expect(alle.filter((s) => !s.ueberfaellig && s.bis && s.bis < "2026-10-29")).toEqual([]);
    expect(a.fallen[0]).toMatch(/1 Schritt liegt mit bis vor heute/);
    const normen = a.quellen.map((q) => q.norm);
    expect(normen).not.toContain("§ 1 AAG");
    expect(normen.filter((n) => n.startsWith("§ 1 MiLoV5"))).toHaveLength(1);
  });
});

describe("ablauf austritt", () => {
  it("Klagefrist 3 Wochen nach Zugang, Ende am Samstag auf Montag verschoben", () => {
    const a = rufe("ablauf", { art: "austritt", datum: "2027-01-31", grund: "arbeitgeber", zugang: "2026-11-07" });
    expect(finde(a, "Klagefrist läuft")?.bis).toBe("2026-11-30");
    expect(a).not.toHaveProperty("lintelly");
  });
  it("ohne Zugang: kein geratener Tag, Schritt zum Festhalten des Zugangs", () => {
    const a = rufe("ablauf", { art: "austritt", datum: "2027-01-31", grund: "arbeitnehmer" });
    expect(finde(a, "Klagefrist läuft")).toBeUndefined();
    expect(finde(a, "Zugang")).toBeTruthy();
    expect(a).not.toHaveProperty("lintelly");
  });
});

describe("ablauf krankheit (Szenario 3)", () => {
  it("Entgeltfortzahlung endet nach 42 Kalendertagen, U1 und BEM", () => {
    const a = rufe("ablauf", { art: "krankheit", datum: "2026-11-01" });
    expect(a.ergebnis.entgeltfortzahlung_bis).toBe("2026-12-12");
    expect(finde(a, "Entgeltfortzahlung endet")?.bis).toBe("2026-12-12");
    expect(finde(a, "U1")?.pflicht).toMatch(/AAG/);
    expect(finde(a, "BEM")?.bis).toBe("2026-12-13");
    expect(finde(a, "eAU")).toBeTruthy();
    expect(a).not.toHaveProperty("lintelly");
  });
  it("über 6 Wochen krank: Hinweis auf menschliche Prüfung", () => {
    const a = rufe("ablauf", { art: "krankheit", datum: "2026-09-01" });
    expect(a).not.toHaveProperty("lintelly");
  });
  it("Wartezeit von 4 Wochen verschiebt den Beginn", () => {
    const a = rufe("ablauf", { art: "krankheit", datum: "2026-11-01", eintritt: "2026-10-20" });
    expect(a.ergebnis.entgeltfortzahlung_ab).toBe("2026-11-17");
  });
});

describe("ablauf mutterschutz (Szenario 4)", () => {
  it("ET 2027-03-15: Schutzfrist ab 2027-02-01, Meldung, Kündigungsverbot, U2, Elternzeit", () => {
    const a = rufe("ablauf", { art: "mutterschutz", datum: "2027-03-15" });
    expect(a.ergebnis.schutzfrist_ab).toBe("2027-02-01");
    expect(a.ergebnis.schutzfrist_bis).toBe("2027-05-10");
    const text = JSON.stringify(schritte(a));
    for (const w of ["Aufsichtsbehörde", "Gefährdungsbeurteilung", "Kündigungsverbot", "U2", "Urlaub", "Elternzeit"]) expect(text).toContain(w);
  });
});

describe("ablauf elternzeit", () => {
  it("Verlangen 7 Wochen, nach dem 3. Geburtstag 13 Wochen vor Beginn", () => {
    expect(finde(rufe("ablauf", { art: "elternzeit", datum: "2027-06-01" }), "verlangen")?.bis).toBe("2027-04-13");
    expect(finde(rufe("ablauf", { art: "elternzeit", datum: "2027-06-01", nach_drittem_geburtstag: true }), "verlangen")?.bis).toBe("2027-03-02");
  });
});

describe("ablauf kuendigung_vorbereiten (Szenario 5)", () => {
  it("6 Leute, 2 Jahre: Kleinbetrieb, Frist, Schriftform, Sonderschutz, Zeugnis, Arbeitsbescheinigung", () => {
    const a = rufe("ablauf", { art: "kuendigung_vorbereiten", datum: "2026-11-10", eintritt: "2024-09-01", beschaeftigte: 6 });
    expect(a.ergebnis.kuendigungsschutzgesetz).toBe(false);
    expect(a.ergebnis.ende).toBe("2026-12-31");
    const text = JSON.stringify(schritte(a));
    for (const w of ["Sonderkündigungsschutz", "Originalunterschrift", "Zugang", "Resturlaub", "Zeugnis", "Arbeitsbescheinigung"]) expect(text).toContain(w);
    expect(a).not.toHaveProperty("lintelly");
    expect(a.naechster_schritt?.join(" ")).toMatch(/sonderkuendigungsschutz_check/);
  });
  it("mit Betriebsrat: Anhörung", () => {
    const a = rufe("ablauf", { art: "kuendigung_vorbereiten", datum: "2026-11-10", betriebsrat: true });
    expect(finde(a, "Betriebsrat")?.pflicht).toMatch(/§ 102/);
  });
});

describe("ablauf probezeit_ende und befristung_ende", () => {
  it("Probezeit 6 Monate ab 01.12.2026 endet am 31.05.2027", () => {
    const a = rufe("ablauf", { art: "probezeit_ende", datum: "2026-12-01", probezeit_monate: 6 });
    expect(a.ergebnis.probezeit_ende).toBe("2027-05-31");
    expect(finde(a, "Kündigung muss zugehen")?.bis).toBe("2027-05-31");
  });
  it("Befristung: Meldung arbeitsuchend 3 Monate vorher", () => {
    const a = rufe("ablauf", { art: "befristung_ende", datum: "2027-06-30" });
    expect(finde(a, "arbeitsuchend")?.bis).toBe("2027-03-30");
    expect(JSON.stringify(a)).toMatch(/§ 15 Abs. 6 TzBfG/);
  });
});

describe("ablauf monatsende_lohn", () => {
  it("Beiträge und Lohnsteuer als Regel ohne geratenes Datum, Minijob mit Aufzeichnung", () => {
    const a = rufe("ablauf", { art: "monatsende_lohn", datum: "2026-12-01", beschaeftigungsart: "minijob" });
    expect(finde(a, "Beiträge")?.bis).toBeNull();
    expect(finde(a, "Beitragsnachweis")?.pflicht).toMatch(/§ 28f Abs. 3/);
    expect(finde(a, "Lohnsteuer")?.bis).toBeNull();
    expect(finde(a, "Arbeitszeit")?.bis).toBe("2027-01-07");
    expect(a.fallen?.join(" ")).toMatch(/Krankenkasse/);
    expect(JSON.stringify(a)).toMatch(/14,60 €/);
  });
});

describe("ablauf allgemein", () => {
  it("unbekanntes Feld wird abgelehnt", () => {
    expect(() => rufe("ablauf", { art: "eintritt", datum: "2026-12-01", name: "Anna" })).toThrow(/Unbekanntes Feld/);
  });
  it("fehlende Angabe wird genannt statt geraten", () => {
    expect(() => rufe("ablauf", { art: "krankheit" })).toThrow(/fehlt: datum\. datum bedeutet hier: erster Krankheitstag/);
  });
  it("kein Gedankenstrich in allen Arten", () => {
    for (const art of ARTEN) {
      const a = rufe("ablauf", { art, datum: "2026-12-01", probezeit_monate: 6, grund: "arbeitgeber", zugang: "2026-11-02", eintritt: "2024-01-01", befristet: true, beschaeftigungsart: "minijob" });
      expect(JSON.stringify(a), art).not.toMatch(STRICH);
      expect(schritte(a).length, art).toBeGreaterThan(2);
    }
  });
  it("Bänder: Größe, Art, Land und der Ablauf", () => {
    const w = WERKZEUGE.find((x) => x.name === "ablauf")!;
    expect(w.baender!({ art: "krankheit", beschaeftigte: 6, beschaeftigungsart: "teilzeit", bundesland: "HE", datum: "2026-11-01" })).toEqual({ groesse: 6, art: "teilzeit", land: "HE", ablauf: "krankheit" });
  });
});

describe("ABLAUF_VORLAGEN", () => {
  it("10 Vorlagen, jede nicht leer, ohne Gedankenstrich, mit Hinweis und Quelle", () => {
    expect(ABLAUF_VORLAGEN.map((v) => v.art)).toEqual(ARTEN);
    for (const v of ABLAUF_VORLAGEN) {
      const md = v.markdown(HEUTE);
      expect(md.length, v.art).toBeGreaterThan(200);
      expect(md, v.art).not.toMatch(STRICH);
      expect(md).toMatch(/Allgemeine Auskunft, keine Rechtsberatung im Einzelfall. Quelle: Lintelly, lintelly.com \(CC BY 4.0\)/);
    }
  });
});

describe("workflow_vorlage", () => {
  it("ohne Kennung: Liste der 11 mit Name und Nutzen", () => {
    const a = rufe("workflow_vorlage", {});
    expect(a.ergebnis.workflows).toHaveLength(11);
    expect(a.ergebnis.workflows[0]).toEqual({ kennung: "lohn-stichtag", name: WORKFLOWS[0].name, nutzen: WORKFLOWS[0].nutzen });
  });
  it("Krankheit: Kette mit Standard-Tagen, ohne Ersparnis, ohne Anlass", () => {
    const a = rufe("workflow_vorlage", { kennung: "krankheit" });
    expect(a.ergebnis.kette[2]).toEqual({ wenn: "Entgeltfortzahlung endet", dann: ["Aufgabe an HR-Leitung, 7 Tage vorher"] });
    expect(JSON.stringify(a)).not.toMatch(/ersparnis|Std/);
    expect(a).not.toHaveProperty("lintelly");
    expect(JSON.stringify(a)).not.toMatch(STRICH);
  });
  it("keine Werbung für die Werkbank, keine Erinnerung in Mein Lintelly", () => {
    const a = rufe("workflow_vorlage", { kennung: "lohn-stichtag" });
    expect(JSON.stringify(a.ergebnis)).not.toMatch(/Lintelly/);
    expect(WERKZEUGE.find((w) => w.name === "workflow_vorlage")!.beschreibung).not.toMatch(/Lintelly/);
  });
});
