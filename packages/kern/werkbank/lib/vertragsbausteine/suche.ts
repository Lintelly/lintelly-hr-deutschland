/**
 * Suche im Dialog: Name, Kennung, Stichwörter, Normen. Dazu gesperrte Klauseln mit Alternative. Rechnet auf jeder Liste mit diesen Feldern,
 * im Browser auf den BausteinInfo-Daten, damit die Klauseltexte des Katalogs nicht im Bündel landen.
 */
import type { Baustein, Vertragsart } from "./typen";
import { antwortZuRot, findeGesperrte, type RoteKlausel } from "./rot";

type Suchbar = Pick<Baustein, "id" | "label" | "passt" | "stichwoerter" | "normen" | "fuer">;

export function sucheIn<T extends Suchbar>(liste: T[], text: string, art: Vertragsart): { treffer: { baustein: T; grund: string }[]; gesperrt: { klausel: RoteKlausel; antwort: string }[] } {
  const q = text.trim().toLowerCase();
  if (!q) return { treffer: [], gesperrt: [] };
  const treffer = liste.filter((b) => b.fuer.includes(art)).flatMap((b) => {
    const hay = [b.id, b.label, b.passt, ...(b.stichwoerter ?? []), ...b.normen].join(" ").toLowerCase();
    return hay.includes(q) || q.split(/\s+/).every((w) => hay.includes(w)) ? [{ baustein: b, grund: b.passt }] : [];
  });
  const gesperrt = findeGesperrte(text);
  // Wer eine gesperrte Klausel sucht, sieht die sichere Alternative gleich zum Anklicken.
  for (const r of gesperrt) for (const id of r.bausteine) {
    const b = liste.find((x) => x.id === id);
    if (b?.fuer.includes(art) && !treffer.some((t) => t.baustein.id === id)) treffer.unshift({ baustein: b, grund: `Sichere Alternative zu: ${r.klausel}` });
  }
  return { treffer, gesperrt: gesperrt.map((klausel) => ({ klausel, antwort: antwortZuRot(klausel) })) };
}
