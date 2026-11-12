/**
 * Provisionsplan aus den Eingaben von D5 und die Auswahllisten, die er liest. Eigenes Modul ohne Klauseltexte, damit der Dialog im Browser
 * das Rechenbeispiel zeigt, ohne die Bausteingruppen zu laden. Die Bausteine selbst stehen in ./gruppe-d-variabel.ts.
 */
import type { Werte } from "./typen";
import { anteil, leseStaffel, zahl } from "./hilfen";
import type { Form, Plan } from "./provision";

export const FORMEN = ["linear (fester Satz)", "Staffel rückwirkend (höherer Satz gilt für alles)", "Staffel nur über der Schwelle (Beschleuniger)", "Mindestschwelle (darunter nichts)"];
export const FORM_VON: Record<string, Form> = { [FORMEN[0]]: "linear", [FORMEN[1]]: "staffel-rueckwirkend", [FORMEN[2]]: "staffel-marginal", [FORMEN[3]]: "mindestschwelle" };
export const FAELLIG = [
  "am letzten Tag des Monats, in dem abzurechnen ist (spätestens Ende des Folgemonats nach dem Zeitraum)",
  "mit dem Gehalt des Monats nach der Abrechnung",
  "nach Feststellung durch den Arbeitgeber ohne festen Termin",
];
/** Provisionsplan aus den Eingaben von D5 (mit D6, D10, D11 aus derselben Auswahl). */
export function planAus(auswahl: Record<string, Werte>, gehalt: number): Plan {
  const w = auswahl.D5 ?? {};
  const d11 = auswahl.D11;
  const form = FORM_VON[w.form ?? ""] ?? "linear";
  const stufen = leseStaffel(d11?.staffel || w.staffel);
  const marge = /Marge|Deckungsbeitrag/.test(w.basis ?? "") ? anteil(w.basisAnteil) ?? 1 : 1;
  const team = w.team === "Teamprovision" ? anteil(w.teamAnteil) ?? 1 : 1;
  const d10 = auswahl.D10;
  const kappung = !d10 ? null : d10.art === "Vielfaches des Fixums" ? (zahl(d10.faktor) ?? 0) * gehalt * (zahl(w.abrechnungMonate) ?? 1) : zahl(d10.betrag);
  const d6 = auswahl.D6;
  const absicherung = d6 && zahl(d6.betrag) ? { art: d6.art === "Vorschuss (verrechenbar)" ? "vorschuss" as const : "garantie" as const, betragMonat: zahl(d6.betrag)! } : null;
  return { form, satz: anteil(w.satz) ?? 0, stufen, schwelle: zahl(w.schwelle) ?? 0, basisAnteil: marge, basisName: w.basis || "Nettoumsatz", teamAnteil: team, kappung, absicherung, zeitraumMonate: zahl(w.abrechnungMonate) ?? 1 };
}
