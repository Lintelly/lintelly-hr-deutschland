/**
 * Eingaben eines Bausteins prüfen (Pflicht, Auswahl, Grenzen). Rein, ohne Server: der Dialog im Browser (components/BausteinDialog.tsx)
 * und die Prüfung auf dem Server (./pruefen.ts) lesen dieselbe Regel. Ohne Import des Katalogs: die Felder kommen vom Aufrufer,
 * sonst lädt der Browser alle Klauseltexte mit.
 */
import { isISODate } from "@/lib/regeln/datum";
import type { Feld, Werte } from "./typen";
import { leseStaffel, zahl } from "./hilfen";

export const feldSichtbar = (f: Feld, w: Werte) => !f.bei || Object.entries(f.bei).every(([k, werte]) => werte.includes(w[k] ?? ""));

/** Fehler in den Eingaben eines Bausteins (leer = in Ordnung). */
export function eingabeFehler(id: string, felder: Feld[], w: Werte): string[] {
  const out: string[] = [];
  for (const f of felder) {
    if (!feldSichtbar(f, w)) continue;
    const v = (w[f.id] ?? "").trim();
    if (!v) { if (f.pflicht) out.push(`${id}: „${f.label}“ fehlt`); continue; }
    if (f.typ === "auswahl" && f.optionen && !f.optionen.includes(v)) out.push(`${id}: ungültige Auswahl bei „${f.label}“`);
    if (f.typ === "mehrfach" && f.optionen && v.split("|").some((x) => !f.optionen!.includes(x.trim()))) out.push(`${id}: ungültige Auswahl bei „${f.label}“`);
    if (f.typ === "janein" && !["ja", "nein"].includes(v)) out.push(`${id}: „${f.label}“ bitte ja oder nein`);
    if (f.typ === "datum" && !isISODate(v)) out.push(`${id}: „${f.label}“ ist kein gültiges Datum`);
    if (f.typ === "staffel" && !leseStaffel(v).length) out.push(`${id}: „${f.label}“ braucht mindestens eine Stufe`);
    if (f.typ === "zahl" || f.typ === "betrag" || f.typ === "prozent") {
      const n = zahl(v);
      if (n === null) out.push(`${id}: „${f.label}“ ist keine Zahl`);
      else if (f.min !== undefined && n < f.min) out.push(`${id}: „${f.label}“ mindestens ${String(f.min).replace(".", ",")}`);
      else if (f.max !== undefined && n > f.max) out.push(`${id}: „${f.label}“ höchstens ${String(f.max).replace(".", ",")}`);
    }
  }
  return out;
}
