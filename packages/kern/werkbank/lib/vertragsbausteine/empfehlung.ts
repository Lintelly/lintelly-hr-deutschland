/**
 * „Empfohlen für diese Stelle“: Vorauswahl der Bausteine aus Rolle, Beschäftigungsart, Befristung und Aufenthaltstitel der Person,
 * mit den sicheren Standardwerten aus dem Katalog. Die HR-Leitung kann jeden Baustein abwählen. Dazu die Suche im Dialog:
 * Wer nach einer gesperrten Klausel sucht, sieht Grund und sichere Alternative. Rein, ohne Datenbank.
 */
import type { Auswahl, Baustein, Vertragsart, Werte } from "./typen";
import { BAUSTEIN, BAUSTEINE } from "./katalog";
import { sucheIn } from "./suche";
import { FAELLIG, FORMEN } from "./plan";

export type Stelle = { rolle: string; team?: string; befristet: boolean; sachgrundlos?: boolean; drittstaat?: boolean; art: Vertragsart };

const VERTRIEB = /vertrieb|sales|business development|account|verkauf|akquise|new business|recruit/i;
const TECHNIK = /entwickl|software|engineer|data|devops|technik|it-|informatik|labor|forschung/i;
const KREATIV = /design|text|content|kreativ|art director|social|redaktion|video|foto/i;
const FUEHRUNG = /leitung|lead|head|leiter|führung|director|geschäftsführ/i;

/** Standardwerte eines Bausteins aus seinen Feldern. */
export const standardWerte = (b: Baustein): Werte => Object.fromEntries(b.felder.filter((f) => f.standard !== undefined).map((f) => [f.id, f.standard!]));

/** Vorschläge mit Grund, in der Reihenfolge des Katalogs. Nur Bausteine, die es für die Vertragsart gibt. */
export function empfehlung(s: Stelle): { auswahl: Auswahl; gruende: Record<string, string> } {
  const gruende: Record<string, string> = {};
  const add = (id: string, grund: string) => { if (BAUSTEIN[id]?.fuer.includes(s.art) && !gruende[id]) gruende[id] = grund; };
  add("H3", "Hinweisgeberschutz gehört zu jeder Verschwiegenheit");
  add("Q7", "Empfang der Unterlagen auf eigener Seite (§ 309 Nr. 12 BGB)");
  if (s.drittstaat) add("A1", "Aufenthaltstitel als Bedingung");
  if (s.befristet) { add("A9", "Befristung schriftlich mit Sachgrund oder ohne"); add("A10", "Erklärung zur Vorbeschäftigung"); }
  if (VERTRIEB.test(s.rolle)) {
    add("D5", "Vertriebsrolle: Provision"); add("D13", "Abrechnung und Buchauszug nach § 87c HGB"); add("D8", "Storno nur aus Kundengründen");
    add("D9", "Provision für angebahnte Geschäfte nach dem Ausscheiden"); add("D6", "Garantie für die Einarbeitung");
  }
  if (TECHNIK.test(s.rolle)) { add("I1", "Technische Rolle: Diensterfindungen nach ArbnErfG"); add("I2", "Freie Erfindungen"); add("I5", "Software nach § 69b UrhG"); }
  if (KREATIV.test(s.rolle)) { add("I4", "Kreative Rolle: Nutzungsrechte"); add("I6", "Namensnennung und Portfolio"); }
  if (FUEHRUNG.test(s.rolle) && !VERTRIEB.test(s.rolle)) add("D2", "Führungsrolle: Zielbonus mit Zielvereinbarung");
  if (s.art === "minijob" || s.art === "teilzeit") add("S6", "Rechte zu Teilzeit und Aufstockung");
  const auswahl: Auswahl = {};
  for (const id of Object.keys(gruende)) auswahl[id] = { ...standardWerte(BAUSTEIN[id]), ...(DEMO_WERTE[id] ?? {}) };
  return { auswahl, gruende };
}

/** Sinnvolle Startwerte für Felder ohne Katalog-Standard, damit die Vorschau sofort rechnet. Jeder Wert ist im Dialog änderbar. */
const DEMO_WERTE: Record<string, Werte> = {
  D5: { form: FORMEN[2], staffel: JSON.stringify([{ ab: 0, bis: 30000, satz: 4 }, { ab: 30000, bis: 60000, satz: 6 }, { ab: 60000, bis: null, satz: 9 }]), faelligkeit: FAELLIG[0], beispielUmsatz: "40000" },
  D6: { art: "Garantie (nicht rückforderbar)", betrag: "800", monate: "6" },
};

export type Treffer = { baustein: Baustein; grund: string };
/** Suche im Katalog (Server und Tests); der Dialog sucht mit sucheIn auf seinen BausteinInfo-Daten. */
export const suche = (text: string, art: Vertragsart) => sucheIn(BAUSTEINE, text, art);
