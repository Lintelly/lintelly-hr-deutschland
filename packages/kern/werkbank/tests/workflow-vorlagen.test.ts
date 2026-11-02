import { describe, expect, it } from "vitest";
import { WORKFLOWS } from "@/lib/workflows/vorlagen";
import { handelt, tageWert } from "@/lib/workflows/kern";

// Die mitgelieferten Workflows (zehn seit Nick 21.10.2026, der elfte Arbeitszeit seit 31.10.2026): Grundregeln, die jede Vorlage einhalten muss.
const einstellung = (w: (typeof WORKFLOWS)[number]) => Object.fromEntries(Object.entries(w.tage).map(([k, v]) => [k, v.wert]));

describe("Workflow-Vorlagen", () => {
  it("genau elf, eindeutige Kennungen, eindeutige Schritte je Teil", () => {
    expect(WORKFLOWS).toHaveLength(11);
    expect(new Set(WORKFLOWS.map((w) => w.id)).size).toBe(11);
    for (const w of WORKFLOWS) for (const t of w.teile) expect(new Set(t.schritte.map((s) => s.id)).size, w.id).toBe(t.schritte.length);
  });
  it("jede Tagesangabe gehört zu einer Einstellung", () => {
    for (const w of WORKFLOWS) for (const t of w.teile) for (const s of t.schritte.filter(handelt)) {
      expect(() => tageWert(s.ab, einstellung(w)), `${w.id}/${s.id}`).not.toThrow();
      if (s.wiederholen) expect(() => tageWert(s.wiederholen!.alle, einstellung(w)), `${w.id}/${s.id}`).not.toThrow();
    }
  });
  it("Gesundheit und Mutterschutz: nur Aufgaben für die HR-Leitung, nichts an Führungskräfte oder Geschäftsführung", () => {
    for (const w of WORKFLOWS.filter((x) => x.gesundheit)) for (const t of w.teile) for (const s of t.schritte.filter(handelt)) {
      expect([s.art, s.an], `${w.id}/${s.id}`).toEqual(["aufgabe", "hr"]);
    }
  });
  it("Mitteilungen gehen nur an Personen, Aufgaben nur an HR-Leitung oder Geschäftsführung", () => {
    for (const w of WORKFLOWS) for (const t of w.teile) for (const s of t.schritte.filter(handelt)) {
      expect(s.art === "aufgabe" ? ["hr", "gf"] : ["person", "fuehrung", "alle-fuehrung"], `${w.id}/${s.id}`).toContain(s.an);
    }
  });
  it("Texte ohne Gedankenstriche", () => {
    const a = { schluessel: "x", personId: null, datum: "2026-11-01", titel: "Lea Wortmann", was: "Handbuch" };
    for (const w of WORKFLOWS) {
      expect(`${w.name} ${w.nutzen}`).not.toMatch(/[–—]/);
      for (const t of w.teile) for (const s of t.schritte.filter(handelt)) expect(s.text(a)).not.toMatch(/[–—]/);
    }
  });
});
