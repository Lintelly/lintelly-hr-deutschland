/**
 * Reine Logik des Arbeitgeberkosten-Rechners: Bruttogehalt plus Arbeitgeberanteil der Sozialversicherung, Stand 2026.
 * Werte wie im Rechtswerte-Register der Werkbank (lib/regeln/werte.ts, geprüft 29.10.2026) und im HR-Plugin (Werkzeug arbeitgeberkosten).
 * Gerechnet wird in Cent mit Sätzen in Tausendstelprozent (halber Zusatzbeitrag wie 8,525 %), damit erst der Betrag rundet, nie der Satz.
 */
import { abgabenArbeitgeber } from "./minijob-logik";

export const WERTE_2026 = {
  /** § 8 Abs. 1a SGB IV, Minijob-Grenze 2026 */
  minijobGrenze: 603,
  /** § 20 Abs. 2 SGB IV, Obergrenze Übergangsbereich */
  midijobGrenze: 2000,
  /** Bekanntmachung vom 25.11.2025, BAnz AT 18.12.2025 B5 */
  faktorF: 0.6619,
  /** § 2 Abs. 2 SVBezGrV 2026 (69.750 € im Jahr) */
  bbgKv: 5812.5,
  /** § 4 Abs. 1 Nr. 1 SVBezGrV 2026 (101.400 € im Jahr) */
  bbgRv: 8450,
  /** Gesamtsätze in Prozent: § 241 SGB V, § 55 Abs. 1 SGB XI, § 158 SGB VI, § 341 Abs. 2 SGB III; durchschnittlicher Zusatzbeitrag 2026 (§ 242a SGB V) */
  kv: 14.6, zusatzbeitrag: 2.9, pv: 3.6, rv: 18.6, av: 2.6,
  /** § 360 SGB III, nur Arbeitgeber, Bemessung § 358 Abs. 2 SGB III */
  insolvenz: 0.15,
} as const;

export const QUELLEN = [
  { label: "§ 241 SGB V (Krankenversicherung)", href: "https://www.gesetze-im-internet.de/sgb_5/__241.html" },
  { label: "§ 55 SGB XI (Pflegeversicherung)", href: "https://www.gesetze-im-internet.de/sgb_11/__55.html" },
  { label: "§ 158 SGB VI (Rentenversicherung)", href: "https://www.gesetze-im-internet.de/sgb_6/__158.html" },
  { label: "§ 341 SGB III (Arbeitslosenversicherung)", href: "https://www.gesetze-im-internet.de/sgb_3/__341.html" },
  { label: "§ 20 SGB IV (Übergangsbereich)", href: "https://www.gesetze-im-internet.de/sgb_4/__20.html" },
  { label: "§ 360 SGB III (Insolvenzgeldumlage)", href: "https://www.gesetze-im-internet.de/sgb_3/__360.html" },
  { label: "SVBezGrV 2026 (Beitragsbemessungsgrenzen)", href: "https://www.gesetze-im-internet.de/svbezgrv_2026/" },
];

export type Art = "angestellt" | "werkstudent";
export type Posten = { name: string; satz: number; basis: number; betrag: number };
export type AgKosten = {
  art: "regulaer" | "midijob" | "minijob";
  brutto: number; posten: Posten[]; abgaben: number; gesamt: number; jahr: number;
  /** Abgaben in Prozent vom Brutto */
  anteil: number;
  /** Eingabe sieht nach Jahresgehalt aus */
  jahresgehalt: boolean;
};

const cent = (x: number) => Math.round(x * 100);
const euro = (c: number) => c / 100;
/** Betrag in Cent: Basis in Cent mal Satz in Prozent */
const anteil = (basisCent: number, prozent: number) => Math.round((basisCent * Math.round(prozent * 1000)) / 100000);

/** Beitragspflichtige Einnahmen im Übergangsbereich (§ 20 Abs. 2a SGB IV), in Euro auf Cent. */
function midijobBasis(brutto: number) {
  const { minijobGrenze: g, midijobGrenze: og, faktorF: f } = WERTE_2026;
  const spanne = og - g;
  const gesamt = Math.round((f * g + (og / spanne - (g / spanne) * f) * (brutto - g)) * 100) / 100;
  const person = Math.round((og / spanne) * (brutto - g) * 100) / 100;
  return { gesamt, person };
}

export function berechneAgKosten({ brutto, art, zusatzbeitrag }: { brutto: number | null; art: Art; zusatzbeitrag: number }): AgKosten | null {
  if (brutto === null || !(brutto > 0)) return null;
  const W = WERTE_2026;
  const fertig = (a: AgKosten["art"], posten: Posten[]): AgKosten => {
    const abgabenCent = posten.reduce((s, p) => s + cent(p.betrag), 0);
    const abgaben = euro(abgabenCent);
    const gesamt = euro(cent(brutto) + abgabenCent);
    return { art: a, brutto, posten, abgaben, gesamt, jahr: euro(cent(gesamt) * 12), anteil: Math.round((abgaben / brutto) * 1000) / 10, jahresgehalt: brutto > 30000 };
  };

  if (brutto <= W.minijobGrenze) {
    const m = abgabenArbeitgeber(brutto, { gesetzlichVersichert: true, pauschsteuer: true });
    return fertig("minijob", m.posten.map((p) => ({ name: p.name, satz: Math.round(p.satz * 10000) / 100, basis: brutto, betrag: p.betrag })));
  }

  const zweige: [string, number, number][] = art === "werkstudent"
    ? [["Rentenversicherung", W.rv, W.bbgRv]]
    : [["Krankenversicherung", W.kv + zusatzbeitrag, W.bbgKv], ["Pflegeversicherung", W.pv, W.bbgKv], ["Rentenversicherung", W.rv, W.bbgRv], ["Arbeitslosenversicherung", W.av, W.bbgRv]];
  const insolvenz = (basis: number): Posten => ({ name: "Insolvenzgeldumlage", satz: W.insolvenz, basis, betrag: euro(anteil(cent(basis), W.insolvenz)) });

  if (brutto <= W.midijobGrenze) {
    // Gesamtbeitrag auf die volle Basis, die Person zahlt den halben Satz auf ihre Basis, der Arbeitgeber den Rest (§ 168 Abs. 1 Nr. 1d SGB VI, § 249 Abs. 3 SGB V, § 58 Abs. 5 SGB XI, § 346 Abs. 1a SGB III).
    const b = midijobBasis(brutto);
    const posten = zweige.map(([name, satz]) => {
      const gesamt = anteil(cent(b.gesamt), satz);
      const person = anteil(cent(b.person), satz / 2);
      return { name, satz: satz / 2, basis: b.gesamt, betrag: euro(gesamt - person) };
    });
    return fertig("midijob", [...posten, insolvenz(brutto)]);
  }

  const posten = zweige.map(([name, satz, bbg]) => {
    const basis = Math.min(brutto, bbg);
    return { name, satz: satz / 2, basis, betrag: euro(anteil(cent(basis), satz / 2)) };
  });
  return fertig("regulaer", [...posten, insolvenz(Math.min(brutto, W.bbgRv))]);
}
