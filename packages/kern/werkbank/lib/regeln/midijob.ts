/**
 * Übergangsbereich (Midijob, § 20 Abs. 2 und 2a SGB IV): beitragspflichtige Einnahme und Beiträge mit Arbeitgeberanteil, genau statt Untergrenze.
 * Formeln am 29.10.2026 im Wortlaut gelesen (gesetze-im-internet.de/sgb_4/__20.html):
 *   BE gesamt      = F × G + (OG / (OG − G) − G / (OG − G) × F) × (AE − G)
 *   BE Arbeitnehmer = OG / (OG − G) × (AE − G)
 * AE Arbeitsentgelt, G Minijob-Grenze, OG Obergrenze des Übergangsbereichs, F Faktor F des Jahres (FAKTOR_F).
 * Je Zweig: Gesamtbeitrag = BE gesamt × Satz, Arbeitnehmer = BE Arbeitnehmer × halber Satz, Arbeitgeber = der Rest (§ 168 Abs. 1 Nr. 1d SGB VI,
 * § 249 Abs. 3 SGB V, § 58 Abs. 5 SGB XI, § 346 Abs. 1a SGB III). Geldbeträge auf Cent (§ 20 Abs. 2a Satz 7 SGB IV mit § 123 SGB VI).
 * Gerechnet mit den Sätzen aus werte.ts (Krankenversicherung mit durchschnittlichem Zusatzbeitrag, Pflege ohne Kinderlosenzuschlag, den trägt allein
 * die Person). Nicht für Auszubildende (Satz 8). Ohne Faktor F für das Jahr: nicht berechnet statt geschätzt. Rein, ohne Datenbank.
 */
import { AUSSTEHEND, FAKTOR_F, MINIJOB_GRENZE, SATZ_AV, SATZ_KV_PV, SATZ_RV_AV, WERTE, wertZu } from "./werte";
import { euro, zahl } from "@/lib/format";

export type MidijobZweig = { zweig: string; satz: number; gesamt: number; arbeitnehmer: number; arbeitgeber: number };
export type MidijobErgebnis =
  | {
    berechnet: true; arbeitsentgelt: number; grenze: number; obergrenze: number; faktorF: number;
    /** Beitragspflichtige Einnahme für den Gesamtbeitrag und für den Anteil der Person. */
    beGesamt: number; beArbeitnehmer: number;
    zweige: MidijobZweig[]; gesamt: number; arbeitnehmer: number; arbeitgeber: number;
    rechenweg: string[]; quelle: string; hinweise: string[];
  }
  | { berechnet: false; grund: string; quelle: string };

const cent = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
const QUELLE = "§ 20 Abs. 2a SGB IV, § 168 Abs. 1 Nr. 1d SGB VI, § 249 Abs. 3 SGB V, § 58 Abs. 5 SGB XI, § 346 Abs. 1a SGB III";

/** Beiträge im Übergangsbereich für ein Monatsentgelt `arbeitsentgelt` (Euro) im Monat von `datum`. */
export function midijob(arbeitsentgelt: number, datum: string): MidijobErgebnis {
  const g = wertZu(MINIJOB_GRENZE, datum).wert;
  const og = WERTE.uebergangsbereich.obergrenze;
  if (!(arbeitsentgelt > g && arbeitsentgelt <= og)) return { berechnet: false, grund: `${euro(arbeitsentgelt, { cent: true })} liegt nicht im Übergangsbereich (über ${euro(g)} bis ${euro(og)}).`, quelle: WERTE.uebergangsbereich.quelle };
  const f = wertZu(FAKTOR_F, datum);
  if (!f.bestaetigt) {
    const offen = AUSSTEHEND.faktorF.gueltigAb <= datum ? `${AUSSTEHEND.faktorF.quelle}, erwartet: ${AUSSTEHEND.faktorF.erwartet}` : f.hinweis;
    return { berechnet: false, grund: `Faktor F für ${datum.slice(0, 4)} ist noch nicht amtlich bekannt gegeben, Lintelly schätzt ihn nicht. ${offen}.`, quelle: QUELLE };
  }
  const spanne = og - g;
  const beGesamt = cent(f.wert * g + (og / spanne - (g / spanne) * f.wert) * (arbeitsentgelt - g));
  const beArbeitnehmer = cent((og / spanne) * (arbeitsentgelt - g));
  const rvav = wertZu(SATZ_RV_AV, datum), av = wertZu(SATZ_AV, datum), kvpv = wertZu(SATZ_KV_PV, datum);
  const saetze: [string, number][] = [
    ["Rentenversicherung", Math.round((rvav.wert - av.wert) * 10000) / 10000], ["Arbeitslosenversicherung", av.wert], ["Kranken- und Pflegeversicherung", kvpv.wert],
  ];
  const zweige = saetze.map(([zweig, satz]) => {
    const gesamt = cent(beGesamt * satz), arbeitnehmer = cent((beArbeitnehmer * satz) / 2);
    return { zweig, satz, gesamt, arbeitnehmer, arbeitgeber: cent(gesamt - arbeitnehmer) };
  });
  const summe = (k: "gesamt" | "arbeitnehmer" | "arbeitgeber") => cent(zweige.reduce((s, z) => s + z[k], 0));
  const proz = (s: number) => `${zahl(s * 100, 2)} %`;
  return {
    berechnet: true, arbeitsentgelt, grenze: g, obergrenze: og, faktorF: f.wert, beGesamt, beArbeitnehmer, zweige,
    gesamt: summe("gesamt"), arbeitnehmer: summe("arbeitnehmer"), arbeitgeber: summe("arbeitgeber"),
    rechenweg: [
      `Beitragspflichtige Einnahme gesamt: ${zahl(f.wert, 4)} × ${euro(g)} + (${euro(og)} / (${euro(og)} − ${euro(g)}) − ${euro(g)} / (${euro(og)} − ${euro(g)}) × ${zahl(f.wert, 4)}) × (${euro(arbeitsentgelt, { cent: true })} − ${euro(g)}) = ${euro(beGesamt, { cent: true })}`,
      `Beitragspflichtige Einnahme der Person: ${euro(og)} / (${euro(og)} − ${euro(g)}) × (${euro(arbeitsentgelt, { cent: true })} − ${euro(g)}) = ${euro(beArbeitnehmer, { cent: true })}`,
      ...zweige.map((z) => `${z.zweig} ${proz(z.satz)}: gesamt ${euro(z.gesamt, { cent: true })}, Person ${euro(z.arbeitnehmer, { cent: true })} (halber Satz auf ${euro(beArbeitnehmer, { cent: true })}), Arbeitgeber ${euro(z.arbeitgeber, { cent: true })}`),
    ],
    quelle: `${QUELLE}; Faktor F: ${f.quelle}`,
    hinweise: [
      ...[rvav.hinweis, av.hinweis, kvpv.hinweis].filter((h): h is string => !!h),
      // Zweitmeinung 31.10.2026 H4: Zuschlag und Abschläge der Pflege treffen nur den Anteil der Person, Sachsen auch den des Arbeitgebers.
      "Gerechnet mit dem durchschnittlichen Zusatzbeitrag der Krankenversicherung; die Kasse der Person kann einen anderen Satz haben. Pflege ohne Kinderlosenzuschlag und ohne Abschläge für mehrere Kinder (§ 55 Abs. 3 SGB XI), beides ändert nur den Anteil der Person. In Sachsen trägt der Arbeitgeber einen kleineren und die Person einen größeren Pflegeanteil (§ 58 Abs. 3 SGB XI), dort ist der Arbeitgeberanteil hier etwas zu hoch. Ohne Umlagen und Unfallversicherung. Die Entgeltabrechnung rundet je Zweig, auf den Cent kann sie abweichen.",
    ],
  };
}
