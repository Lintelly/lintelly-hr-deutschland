/**
 * Gruppe D, variable Vergütung: Zielbonus (D2, D3), Ermessensbonus (D4), Provision mit allen Varianten (D5 bis D13), Änderungsvorbehalt (D14),
 * Tantieme (D15). Varianten nach Katalog Abschnitt 5; das gerechnete Beispiel erzeugt lib/vertragsbausteine/provision.ts.
 */
import { WERTE, monateText, monateTextDativ } from "@/lib/regeln/werte";
import type { Baustein, Lage, Werte } from "./typen";
import { OHNE_WS } from "./typen";
import { anteil, euro, hat, ja, leer, leseStaffel, liste, num, prozent, regel, wenn, wert, zahl } from "./hilfen";
import { staffelFehler, mindestlohnCheck } from "./provision";
import { FAELLIG, FORMEN, FORM_VON } from "./plan";
export { FAELLIG, FORMEN, planAus } from "./plan";
import { zahl as dezimal } from "@/lib/format";
import { anzahlEn, datumEn, euroEn, frei, zahlEn } from "@/lib/dokumente/englisch";
import { formatDE } from "@/lib/regeln/datum";

const HGB_87A = "https://www.gesetze-im-internet.de/hgb/__87a.html";
const HGB_87C = "https://www.gesetze-im-internet.de/hgb/__87c.html";
const HGB_65 = "https://www.gesetze-im-internet.de/hgb/__65.html";
const BGB_308 = "https://www.gesetze-im-internet.de/bgb/__308.html";
const BGB_307 = "https://www.gesetze-im-internet.de/bgb/__307.html";
const PS = WERTE.provisionStandards;
const ABR_MAX = WERTE.provisionAbrechnungMaxMonate.wert;

export const BASEN = ["Nettoumsatz", "Marge (Rohertrag)", "Deckungsbeitrag", "Auftragseingang", "Bezahlter Umsatz (Zahlungseingang)", "Jahreswert des Vertrags", "Gesamtwert über die Laufzeit"];
const PRORATA = ["anteilig nach Kalendertagen", "anteilig nach vollen Monaten"];
const D34_BV = "Betriebsvereinbarung";
const D34_FEST = "Richtlinie in der Fassung vom (als Anlage)";
const D34_DYN = "Richtlinie in der jeweils gültigen Fassung";
const TEILZEIT = ["anteilig", "nicht anteilig"];
/** Ausschluss der Rechte aus § 87c HGB in einer eigenen Ergänzung. */
const AUSSCHLUSS_87C =
  /(buchauszug|auskunft|einsicht)[^.]{0,60}(ausgeschlossen|nicht verlangt|entfällt|verzichtet)|verzicht[^.]{0,40}(buchauszug|auskunft|einsicht)/i;

const fixumOk = (l: Lage) => {
  const d6 = l.auswahl.D6;
  const garantie = d6 && d6.art !== "Vorschuss (verrechenbar)" ? zahl(d6.betrag) ?? 0 : 0;
  const fixum = l.auswahl.D5?.fixumArt === "reine Provision" ? 0 : l.person.gehalt;
  return mindestlohnCheck(fixum, l.person.wochenstunden, l.person.eintritt > l.heute ? l.person.eintritt : l.heute, garantie);
};

const textBasis = (w: Werte) => `${w.basis || "Nettoumsatz"}${w.basisDefinition ? ` (${w.basisDefinition.replace(/\.$/, "")})` : ""}`;

/* Englische Fassung (Zweisprachigkeit 23.10.2026): Auswahlwerte auf feste englische Formulierungen, Unbekanntes als freie Eingabe. */
const en = (m: Record<string, string>, s: string | undefined) => m[s ?? ""] ?? frei(s);
const prozentEn = (a: number) => `${zahlEn(a * 100)} per cent`;
const monateEn = (n: number) => anzahlEn(n, "month", "months");
const staffelEn = (s: string | undefined) => leseStaffel(s).map((x) => `from ${euroEn(x.ab)}${x.bis !== null ? ` to ${euroEn(x.bis)}` : ""}: ${prozentEn(x.satz / 100)}`).join("; ");
const BASEN_EN: Record<string, string> = {
  [BASEN[0]]: "net sales", [BASEN[1]]: "margin (gross profit)", [BASEN[2]]: "contribution margin", [BASEN[3]]: "order intake",
  [BASEN[4]]: "paid sales (receipt of payment)", [BASEN[5]]: "annual contract value", [BASEN[6]]: "total contract value over the term",
};
const textBasisEn = (w: Werte) => `${en(BASEN_EN, w.basis || "Nettoumsatz")}${w.basisDefinition ? ` (${frei(w.basisDefinition.replace(/\.$/, ""))})` : ""}`;
const PERIODE_EN: Record<string, string> = { Kalenderjahr: "calendar year", Geschäftsjahr: "financial year" };
const AUSZAHLUNG_EN: Record<string, string> = {
  "nach Feststellung, spätestens im dritten Monat nach der Periode": "after determination, at the latest in the third month after the period",
  "mit dem Gehalt des Monats nach der Feststellung": "with the salary for the month following determination",
};
const GESCHAEFTE_EN: Record<string, string> = { Neukunden: "new customer business", Bestandskunden: "existing customer business", Verlängerungen: "renewals", Zusatzverkäufe: "additional sales" };
const SCHLUESSEL_EN: Record<string, string> = {
  "zu gleichen Teilen": "in equal shares", "nach Anteil am Abschluss": "according to the share in the deal", "nach Anteil am Ergebnis": "according to the share in the result", "nach Dienstzeit": "according to length of service",
};
const ENTSTEHUNG_EN: Record<string, string> = {
  "bei Ausführung des Geschäfts durch den Arbeitgeber": "when the Employer carries out the transaction", "bei Zahlungseingang des Kunden": "on receipt of the customer's payment", "bei Auftragseingang": "on receipt of the order",
};
const FAELLIG_EN: Record<string, string> = { [FAELLIG[1]]: "payable with the salary for the month after the statement", [FAELLIG[2]]: "payable after determination by the Employer, without a fixed date" };
const EREIGNIS_EN: Record<string, string> = {
  "Stornierung durch den Kunden": "cancellation by the customer", "Widerruf des Kunden": "withdrawal by the customer", "Nichtzahlung des Kunden": "non-payment by the customer",
  Produktmangel: "product defect", "Lieferausfall des Arbeitgebers": "failure of delivery by the Employer", "Preisänderung des Arbeitgebers": "price change by the Employer",
};
const AENDERUNGSGRUND_EN: Record<string, string> = { "Änderung der Produkte": "a change in products", "Änderung der Preise": "a change in prices", Marktentwicklung: "market developments", "neue Vertriebsstrategie": "a new sales strategy" };

export const BAUSTEINE_D_VARIABEL: Baustein[] = [
  {
    id: "D2", gruppe: "D", label: "Zielbonus mit Zielvereinbarung", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Fach- und Führungskräfte mit messbaren Zielen, Vertrieb mit Mischung aus Provision und Bonus.",
    stichwoerter: ["Bonus", "Zielbonus", "Zielvereinbarung", "variable Vergütung", "OKR", "Ziele", "Leistungsbonus"],
    felder: [
      { id: "periode", label: "Bonusperiode", typ: "auswahl", optionen: ["Kalenderjahr", "Geschäftsjahr"], pflicht: true, standard: "Kalenderjahr" },
      { id: "betrag", label: "Zielbonus bei voller Zielerreichung in € brutto", typ: "betrag", pflicht: true, min: 0 },
      { id: "gewichtUnternehmen", label: "Gewicht Unternehmensziele (Prozent)", typ: "prozent", min: 0, max: 100, standard: "30" },
      { id: "gewichtTeam", label: "Gewicht Teamziele (Prozent)", typ: "prozent", min: 0, max: 100, standard: "0" },
      { id: "gewichtPerson", label: "Gewicht persönliche Ziele (Prozent)", typ: "prozent", min: 0, max: 100, standard: "70" },
      { id: "schwelle", label: "Schwelle: darunter kein Bonus (Prozent der Zielerreichung)", typ: "prozent", pflicht: true, min: 0, max: 100, standard: "50" },
      { id: "obergrenze", label: "Obergrenze der Zielerreichung (Prozent)", typ: "prozent", pflicht: true, min: 100, standard: "150" },
      { id: "kurve", label: "Kurve zwischen Schwelle und Obergrenze", typ: "auswahl", optionen: ["linear", "in Stufen (volle Zehntel)"], pflicht: true, standard: "linear" },
      { id: "zielBisMonate", label: "Zielvereinbarung spätestens wie viele Monate nach Beginn der Periode?", typ: "zahl", pflicht: true, min: 0, standard: String(PS.zielvereinbarungBisMonate), hinweis: "Lintelly legt den Termin als Aufgabe an." },
      { id: "fallback", label: "Was gilt, wenn bis zum Termin keine Zielvereinbarung steht?", typ: "auswahl", optionen: ["Fortschreibung der Ziele der Vorperiode", "volle Zielerreichung"], standard: "volle Zielerreichung", hinweis: "Ohne Ersatzregel blockiert Lintelly den Baustein (BAG 10 AZR 97/07)." },
      { id: "feststellung", label: "Wer stellt die Zielerreichung fest, bis wann?", typ: "text", pflicht: true, standard: "Die Führungskraft gemeinsam mit der Person, bis Ende des ersten Monats nach der Periode" },
      { id: "auszahlung", label: "Auszahlung mit dem Gehalt im Monat", typ: "auswahl", optionen: ["nach Feststellung, spätestens im dritten Monat nach der Periode", "mit dem Gehalt des Monats nach der Feststellung"], pflicht: true, standard: "mit dem Gehalt des Monats nach der Feststellung" },
      { id: "prorata", label: "Ein- und Austritt im Jahr", typ: "auswahl", optionen: PRORATA, pflicht: true, standard: PRORATA[0] },
      { id: "teilzeit", label: "Teilzeit", typ: "auswahl", optionen: TEILZEIT, standard: "anteilig" },
      { id: "teilzeitGrund", label: "Sachlicher Grund, wenn nicht anteilig", typ: "text", bei: { teilzeit: ["nicht anteilig"] } },
    ],
    text: (w, k) => {
      const g = [["Unternehmensziele", w.gewichtUnternehmen], ["Teamziele", w.gewichtTeam], ["persönliche Ziele", w.gewichtPerson]].filter(([, x]) => (zahl(x) ?? 0) > 0).map(([n, x]) => `${n} ${prozent((zahl(x) ?? 0) / 100)}`).join(", ");
      const bis = zahl(w.zielBisMonate) ?? PS.zielvereinbarungBisMonate;
      return `(1) ${k.vorname} erhält für jedes ${w.periode || "Kalenderjahr"} einen Zielbonus. Bei voller Zielerreichung beträgt er ${euro(zahl(w.betrag) ?? 0)} brutto. Der Bonus ist Gegenleistung für die Arbeit im Bonusjahr.\n` +
        `(2) Die Ziele vereinbaren ${k.vorname} und der Arbeitgeber gemeinsam, spätestens ${bis ? `${monateTextDativ(bis)} nach Beginn` : "zu Beginn"} der Periode, in Textform. Jedes Ziel nennt Kennzahl, Quelle und Berechnung. Gewichtung: ${g || "nach der Zielvereinbarung"}.\n` +
        `(3) Unter einer Gesamterreichung von ${prozent((zahl(w.schwelle) ?? 0) / 100)} entfällt der Bonus. Über der Schwelle steigt er ${w.kurve === "linear" ? "gleichmäßig mit der Zielerreichung" : "in vollen Zehnteln der Zielerreichung"}, höchstens bis ${prozent((zahl(w.obergrenze) ?? 0) / 100)}. Das Rechenbeispiel in der Anlage ist Teil dieser Regel.\n` +
        `(4) Kommt die Zielvereinbarung bis zum Termin nicht zustande, gilt ${w.fallback === "Fortschreibung der Ziele der Vorperiode" ? "die Zielvereinbarung der Vorperiode mit unveränderten Zielen und Gewichten fort" : "die Zielerreichung als voll erreicht"}. Der Arbeitgeber lädt rechtzeitig zum Gespräch über die Ziele ein.\n` +
        `(5) Die Zielerreichung stellen fest: ${w.feststellung}. Der Bonus wird ${w.auszahlung} ausgezahlt.\n` +
        `(6) Beginnt oder endet das Arbeitsverhältnis im Bonusjahr, besteht der Anspruch ${w.prorata === PRORATA[1] ? "anteilig nach vollen Monaten" : "anteilig nach Kalendertagen"}. Der Anspruch setzt nicht voraus, dass das Arbeitsverhältnis an einem Stichtag noch besteht oder ungekündigt ist. Kürzungen wegen Krankheit gibt es nur im Rahmen des § 4a EFZG, Zeiten des Mutterschutzes führen nicht zur Kürzung.` +
        (w.teilzeit === "nicht anteilig" ? "" : `\n(7) Bei Teilzeit gilt der Zielbonus im Verhältnis der vereinbarten zur vollen Arbeitszeit.`);
    },
    labelEn: "Target bonus with target agreement",
    textEn: (w, k) => {
      const g = [["company targets", w.gewichtUnternehmen], ["team targets", w.gewichtTeam], ["personal targets", w.gewichtPerson]].filter(([, x]) => (zahl(x) ?? 0) > 0).map(([n, x]) => `${n} ${prozentEn((zahl(x) ?? 0) / 100)}`).join(", ");
      const bis = zahl(w.zielBisMonate) ?? PS.zielvereinbarungBisMonate;
      return `(1) ${k.vorname} receives a target bonus for each ${en(PERIODE_EN, w.periode || "Kalenderjahr")}. With full target achievement it amounts to ${euroEn(zahl(w.betrag) ?? 0)} gross. The bonus is consideration for the work in the bonus year.\n` +
        `(2) ${k.vorname} and the Employer agree the targets jointly in text form, at the latest ${bis ? `${monateEn(bis)} after the start` : "at the start"} of the period. Each target states the metric, source and calculation. Weighting: ${g || "as set out in the target agreement"}.\n` +
        `(3) Below an overall achievement of ${prozentEn((zahl(w.schwelle) ?? 0) / 100)}, no bonus is payable. Above the threshold the bonus rises ${w.kurve === "linear" ? "evenly with target achievement" : "in full tenths of target achievement"}, up to a maximum of ${prozentEn((zahl(w.obergrenze) ?? 0) / 100)}. The worked example in the annex forms part of this provision.\n` +
        `(4) If no target agreement is reached by the deadline, ${w.fallback === "Fortschreibung der Ziele der Vorperiode" ? "the target agreement of the previous period continues to apply with unchanged targets and weightings" : "the targets are deemed fully achieved"}. The Employer issues a timely invitation to a meeting on the targets.\n` +
        `(5) Target achievement is determined by: ${frei(w.feststellung)}. The bonus is paid ${en(AUSZAHLUNG_EN, w.auszahlung)}.\n` +
        `(6) If the employment relationship begins or ends during the bonus year, the entitlement is ${w.prorata === PRORATA[1] ? "pro rata by full months" : "pro rata by calendar days"}. The entitlement does not require that the employment relationship still exists on a reference date or has not been terminated. Reductions for illness apply only within the limits of § 4a EFZG; periods of maternity protection do not lead to a reduction.` +
        (w.teilzeit === "nicht anteilig" ? "" : `\n(7) For part-time work, the target bonus applies in the ratio of the agreed working time to full working time.`);
    },
    normen: ["§ 611a BGB", "§§ 305 ff., 307 BGB", "§ 315 BGB", "§§ 280, 283 BGB", "§ 4a EFZG", "§ 612a BGB", "§ 87 Abs. 1 Nr. 10 BetrVG"],
    quellen: [BGB_307, "Katalog Abschnitt 4, Baustein D2; Abschnitt 5"],
    urteile: [{ az: "BAG 10 AZR 97/07", kennung: "V" }, { az: "BAG 8 AZR 149/20", kennung: "V" }, { az: "BAG 10 AZR 57/24", kennung: "V" }, { az: "BAG 10 AZR 171/23", kennung: "P" }],
    schutz: ["Termin der Zielvereinbarung wird als Aufgabe angelegt", "Ersatzregel bei fehlender Vereinbarung ist Pflicht", "Gewichte ergeben zusammen das Ganze", "Anteilig bei Ein- und Austritt", "Kein Stichtag", "Feste Vergütung hält allein den Mindestlohn"],
    sperren: ["Stichtagsklausel (R8)", "Freiwilligkeitsvorbehalt auf denselben Bonus (R3)", "Einseitige Umschaltung auf Vorgabe ohne Bedingungen", "Schwelle über dem vollen Ziel"],
    regeln: [
      regel("P-056", "sperre", "Gewichte ergeben nicht das Ganze", "Logik, § 307 Abs. 1 Satz 2 BGB", ["D2"], (l) => {
        const s = ["gewichtUnternehmen", "gewichtTeam", "gewichtPerson"].reduce((a, f) => a + (num(l, "D2", f) ?? 0), 0);
        return wenn(Math.abs(s - 100) > 0.001, `Die Gewichte der Ziele ergeben ${String(s).replace(".", ",")} von hundert. Sie müssen zusammen das Ganze ergeben.`);
      }),
      regel("P-057", "sperre", "Zielbonus ohne Ersatzregel bei fehlender Vereinbarung", "BAG 10 AZR 97/07", ["D2"], (l) => wenn(leer(wert(l, "D2", "fallback")), "Ohne Ersatzregel für eine fehlende Zielvereinbarung droht Schadensersatz in Höhe des vollen Bonus. Wähle Fortschreibung der Vorjahresziele oder volle Zielerreichung.")),
      regel("K-11", "sperre", "D2 ohne Fallback bei fehlender Vereinbarung", "BAG 10 AZR 97/07, Katalog K-11", ["D2"], (l) => wenn(leer(wert(l, "D2", "fallback")), "Zielbonus ohne Fallback: gesperrt.")),
      regel("P-058", "sperre", "Zielvereinbarung und Zielvorgabe für denselben Bonus", "BAG 10 AZR 171/23 (Aktenzeichen prüfen), K-10", ["D2", "D3"], (l) => wenn(hat(l, "D2") && hat(l, "D3"), "D2 (Vereinbarung) und D3 (Vorgabe) schließen sich für denselben Bonus aus. Wähle eins.")),
      regel("K-10", "sperre", "D2 und D3 im selben Vertrag", "Katalog K-10", ["D2", "D3"], (l) => wenn(hat(l, "D2") && hat(l, "D3"), "Zielvereinbarung und Zielvorgabe zugleich sind unklar und gesperrt.")),
      regel("P-059", "sperre", "Kein Termin der Zielvereinbarung innerhalb der Periode", "BAG 8 AZR 149/20", ["D2"], (l) => {
        const m = num(l, "D2", "zielBisMonate");
        return wenn(m === null || m >= 12, "Der Termin der Zielvereinbarung muss innerhalb der Periode liegen (in der Regel im ersten Monat). Lintelly legt ihn als Aufgabe an."); // kein-recht: Periode von zwölf Kalendermonaten
      }),
    ],
  },
  {
    id: "D3", gruppe: "D", label: "Zielbonus mit einseitiger Zielvorgabe", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Firmen, die Ziele zentral setzen, ohne Verhandlung.",
    stichwoerter: ["Zielvorgabe", "Bonus", "Konzernziele"],
    felder: [
      { id: "periode", label: "Bonusperiode", typ: "auswahl", optionen: ["Kalenderjahr", "Geschäftsjahr"], pflicht: true, standard: "Kalenderjahr" },
      { id: "betrag", label: "Zielbonus bei voller Zielerreichung in € brutto", typ: "betrag", pflicht: true, min: 0 },
      { id: "vorgabeBisMonate", label: "Vorgabe spätestens wie viele Monate nach Beginn der Periode (Textform)?", typ: "zahl", pflicht: true, min: 0, standard: String(PS.zielvereinbarungBisMonate) },
      { id: "massstab", label: "Maßstab der Ziele", typ: "auswahl", optionen: ["Unternehmensziele", "Ziele einer vergleichbaren Gruppe", "Unternehmens- und persönliche Ziele"], pflicht: true },
      { id: "prorata", label: "Ein- und Austritt im Jahr", typ: "auswahl", optionen: PRORATA, pflicht: true, standard: PRORATA[0] },
    ],
    text: (w, k) => `(1) ${k.vorname} erhält für jedes ${w.periode || "Kalenderjahr"} einen Zielbonus von ${euro(zahl(w.betrag) ?? 0)} brutto bei voller Zielerreichung.\n(2) Der Arbeitgeber legt die Ziele nach billigem Ermessen fest (Maßstab: ${w.massstab}) und teilt sie spätestens ${monateTextDativ(zahl(w.vorgabeBisMonate) ?? PS.zielvereinbarungBisMonate)} nach Beginn der Periode in Textform mit. ${k.vorname} kann Rückfragen stellen und Einwände erheben, der Arbeitgeber antwortet in Textform. Ziele werden im Lauf der Periode nicht verschärft.\n(3) Teilt der Arbeitgeber die Ziele nicht rechtzeitig mit, gilt die Zielerreichung als voll erreicht.\n(4) Beginnt oder endet das Arbeitsverhältnis im Bonusjahr, besteht der Anspruch ${w.prorata === PRORATA[1] ? "anteilig nach vollen Monaten" : "anteilig nach Kalendertagen"}, ohne Stichtag.`,
    labelEn: "Target bonus with unilateral target setting",
    textEn: (w, k) => `(1) For each ${en(PERIODE_EN, w.periode || "Kalenderjahr")}, ${k.vorname} receives a target bonus of ${euroEn(zahl(w.betrag) ?? 0)} gross with full target achievement.\n(2) The Employer sets the targets at its reasonable discretion (benchmark: ${en({ Unternehmensziele: "company targets", "Ziele einer vergleichbaren Gruppe": "targets of a comparable group", "Unternehmens- und persönliche Ziele": "company and personal targets" }, w.massstab)}) and notifies them in text form at the latest ${monateEn(zahl(w.vorgabeBisMonate) ?? PS.zielvereinbarungBisMonate)} after the start of the period. ${k.vorname} may ask questions and raise objections; the Employer replies in text form. Targets are not tightened during the period.\n(3) If the Employer does not notify the targets in time, the targets are deemed fully achieved.\n(4) If the employment relationship begins or ends during the bonus year, the entitlement is ${w.prorata === PRORATA[1] ? "pro rata by full months" : "pro rata by calendar days"}, without a reference date.`,
    normen: ["§ 315 BGB", "§ 307 BGB"], quellen: [BGB_307, "Katalog Abschnitt 4, Baustein D3"],
    urteile: [{ az: "BAG 8 AZR 149/20", kennung: "V" }],
    schutz: ["Von Anfang an als Vorgabe gebaut", "Termin und Textform Pflicht", "Bei Versäumnis des Arbeitgebers volle Zielerreichung", "Keine nachträgliche Verschärfung"],
    sperren: ["Kombination mit D2 für denselben Bonus", "Vorgabe nach Periodenbeginn ohne Anpassung"],
  },
  {
    id: "D4", gruppe: "D", label: "Ermessensbonus (Anerkennungsprämie)", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Kleine Firmen ohne Bonussystem, die sich Spielraum halten wollen.",
    stichwoerter: ["Ermessensbonus", "Anerkennung", "Prämie", "freiwilliger Bonus"],
    felder: [
      { id: "modell", label: "Welches Modell?", typ: "auswahl", optionen: ["echter Freiwilligkeitsvorbehalt (kein Anspruch)", "Anspruch dem Grunde nach, Höhe nach billigem Ermessen"], hinweis: "Lintelly verlangt eine Wahl zwischen den beiden Modellen." },
      { id: "zweck", label: "Zweck", typ: "auswahl", optionen: ["Anerkennung der Leistung", "Betriebstreue", "Unternehmenserfolg"], pflicht: true },
      { id: "kriterien", label: "Kriterien", typ: "text", pflicht: true, standard: "Unternehmenserfolg und persönliche Leistung im Jahr" },
      { id: "zielbetrag", label: "Zielbetrag in € (Pflicht beim Anspruch mit Ermessen)", typ: "betrag", min: 0, bei: { modell: ["Anspruch dem Grunde nach, Höhe nach billigem Ermessen"] } },
    ],
    text: (w, k) => w.modell?.startsWith("echter")
      ? `Der Arbeitgeber kann ${k.vorname} zur ${w.zweck} eine Prämie zahlen (Kriterien: ${w.kriterien}). Ob und in welcher Höhe er sie zahlt, entscheidet er jedes Jahr neu. Auch eine wiederholte Zahlung begründet keinen Anspruch für die Zukunft. Das gilt nicht für ausdrücklich zugesagte Leistungen und nicht für individuelle Vereinbarungen.`
      : `${k.vorname} erhält jährlich eine Prämie zur ${w.zweck}. Die Höhe bestimmt der Arbeitgeber nach billigem Ermessen (§ 315 BGB) anhand der Kriterien ${w.kriterien}; Richtwert ist ${euro(zahl(w.zielbetrag) ?? 0)}. Die Entscheidung wird in Textform begründet.`,
    labelEn: "Discretionary bonus (recognition award)",
    textEn: (w, k) => {
      const z = en({ "Anerkennung der Leistung": "in recognition of performance", Betriebstreue: "for loyalty to the company", Unternehmenserfolg: "for the success of the company" }, w.zweck);
      return w.modell?.startsWith("echter")
        ? `The Employer may pay ${k.vorname} a bonus ${z} (criteria: ${frei(w.kriterien)}). Whether it pays the bonus, and in what amount, is decided afresh each year. Even repeated payment gives no entitlement for the future. This does not apply to expressly promised benefits or to individual agreements.`
        : `${k.vorname} receives an annual bonus ${z}. The Employer determines the amount at its reasonable discretion (§ 315 BGB) on the basis of the criteria ${frei(w.kriterien)}; the guide value is ${euroEn(zahl(w.zielbetrag) ?? 0)}. The decision is justified in text form.`;
    },
    normen: ["§ 315 BGB", "§ 307 BGB"], quellen: [BGB_307, "Katalog Abschnitt 4, Baustein D4"],
    schutz: ["Wahl zwischen echtem Freiwilligkeitsvorbehalt und Anspruch mit Ermessen", "Beim Anspruch Zielbetrag Pflicht"],
    sperren: ["Bonus nach Ermessen ohne Wahl des Modells", "Freiwilligkeits- und Widerrufsvorbehalt zugleich (R3)"],
    regeln: [
      regel("P-007", "sperre", "Vergütungsbestandteil ohne Name, Zweck, Höhe oder Regel", "§ 2 Abs. 1 Satz 2 Nr. 7 NachwG", ["D4", "D16", "D17", "D18", "D20", "D27", "D32"], (l) => {
        const fehlt: string[] = [];
        if (hat(l, "D4") && (leer(wert(l, "D4", "modell")) || (wert(l, "D4", "modell").startsWith("Anspruch") && leer(wert(l, "D4", "zielbetrag"))))) fehlt.push("D4 (Modell oder Zielbetrag)");
        for (const id of ["D16", "D17", "D18", "D20", "D27", "D32"]) if (hat(l, id) && leer(wert(l, id, "betrag")) && leer(wert(l, id, "bruchteil"))) fehlt.push(`${id} (Höhe)`);
        for (const id of ["D16", "D18", "D32"]) if (hat(l, id) && leer(wert(l, id, "zweck"))) fehlt.push(`${id} (Zweck)`);
        return fehlt.length ? `Vergütungsbestandteil ohne klare Regel: ${fehlt.join(", ")}. Name, Zweck, Höhe und Fälligkeit müssen im Vertrag stehen.` : null;
      }),
    ],
  },
  {
    id: "D5", gruppe: "D", label: "Provision", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Vertrieb, Außendienst, Account Management, Recruiting mit Erfolgsbezug.",
    stichwoerter: ["Provision", "Kommission", "Commission", "Vertrieb", "Sales", "Umsatzbeteiligung", "Marge", "Staffel", "Beschleuniger", "Accelerator", "Quote"],
    felder: [
      { id: "basis", label: "Bemessungsgrundlage", typ: "auswahl", optionen: BASEN, pflicht: true, standard: "Nettoumsatz" },
      { id: "basisDefinition", label: "Definition der Bemessungsgrundlage mit Quelle", typ: "lang", hinweis: "Zum Beispiel: Rechnungsbetrag ohne Umsatzsteuer abzüglich Rabatte und Gutschriften laut Buchhaltung. Der Arbeitgeber kann die Definition nicht allein ändern.", standard: "Rechnungsbeträge ohne Umsatzsteuer abzüglich Rabatte, Skonti und Gutschriften, laut Buchhaltung" },
      { id: "basisAnteil", label: "Für das Rechenbeispiel: Marge in Prozent des Umsatzes", typ: "prozent", min: 0, max: 100, bei: { basis: ["Marge (Rohertrag)", "Deckungsbeitrag"] } },
      { id: "geschaefte", label: "Welche Geschäfte?", typ: "mehrfach", optionen: ["Neukunden", "Bestandskunden", "Verlängerungen", "Zusatzverkäufe"], pflicht: true, standard: "Neukunden" },
      { id: "team", label: "Einzel- oder Teamprovision?", typ: "auswahl", optionen: ["Einzelprovision", "Teamprovision"], pflicht: true, standard: "Einzelprovision" },
      { id: "teamAnteil", label: "Anteil der Person an der Teamprovision (Prozent)", typ: "prozent", min: 0, max: 100, bei: { team: ["Teamprovision"] } },
      { id: "teamSchluessel", label: "Verteilungsschlüssel im Team", typ: "auswahl", optionen: ["zu gleichen Teilen", "nach Anteil am Abschluss", "nach Dienstzeit"], bei: { team: ["Teamprovision"] } },
      { id: "form", label: "Berechnungsform", typ: "auswahl", optionen: FORMEN, pflicht: true, standard: FORMEN[0] },
      { id: "satz", label: "Provisionssatz (Prozent)", typ: "prozent", min: 0, max: 100, bei: { form: [FORMEN[0], FORMEN[3]] } },
      { id: "schwelle", label: "Mindestschwelle der Bemessungsgrundlage im Zeitraum in €", typ: "betrag", min: 0, bei: { form: [FORMEN[3]] } },
      { id: "staffel", label: "Staffel (ab, bis, Satz in Prozent)", typ: "staffel", bei: { form: [FORMEN[1], FORMEN[2]] }, hinweis: "Stufen lückenlos von unten nach oben. Die letzte Stufe ohne Ende." },
      { id: "wiederkehrend", label: "Einmalig oder wiederkehrend?", typ: "auswahl", optionen: ["einmalige Abschlussprovision", "Folgeprovision für laufende Verträge", "abnehmende Folgeprovision"], pflicht: true, standard: "einmalige Abschlussprovision" },
      { id: "folgeMonate", label: "Folgeprovision für wie viele Monate der Vertragslaufzeit?", typ: "zahl", min: 1, bei: { wiederkehrend: ["Folgeprovision für laufende Verträge", "abnehmende Folgeprovision"] } },
      { id: "folgeSatz", label: "Satz der Folgeprovision (Prozent der laufenden Erlöse)", typ: "prozent", min: 0, max: 100, bei: { wiederkehrend: ["Folgeprovision für laufende Verträge", "abnehmende Folgeprovision"] } },
      { id: "entstehung", label: "Wann entsteht der Anspruch?", typ: "auswahl", optionen: ["bei Ausführung des Geschäfts durch den Arbeitgeber", "bei Zahlungseingang des Kunden", "bei Auftragseingang"], pflicht: true, standard: "bei Ausführung des Geschäfts durch den Arbeitgeber" },
      { id: "abrechnungMonate", label: "Abrechnungszeitraum in Monaten", typ: "zahl", pflicht: true, min: 1, standard: "1", hinweis: `Höchstens ${monateText(ABR_MAX)} (§ 87c Abs. 1 HGB).` },
      { id: "faelligkeit", label: "Fälligkeit", typ: "auswahl", optionen: FAELLIG, pflicht: true, standard: FAELLIG[0] },
      { id: "fixumArt", label: "Fixum?", typ: "auswahl", optionen: ["Fixum plus Provision", "reine Provision"], pflicht: true, standard: "Fixum plus Provision" },
      { id: "mindestabsicherung", label: "Reine Provision: Mindestlohn je Stunde ist monatlich garantiert?", typ: "janein", bei: { fixumArt: ["reine Provision"] } },
      { id: "prorata", label: "Ein- und Austritt im Zeitraum", typ: "auswahl", optionen: PRORATA, pflicht: true, standard: PRORATA[0] },
      { id: "teilzeit", label: "Teilzeit", typ: "auswahl", optionen: TEILZEIT, standard: "anteilig" },
      { id: "teilzeitGrund", label: "Sachlicher Grund, wenn nicht anteilig", typ: "text", bei: { teilzeit: ["nicht anteilig"] } },
      { id: "definitionAenderbar", label: "Darf der Arbeitgeber die Bemessungsgrundlage allein ändern?", typ: "janein", standard: "nein" },
      { id: "beispielUmsatz", label: "Für das Rechenbeispiel: typischer Umsatz im Zeitraum in €", typ: "betrag", min: 0 },
    ],
    text: (w, k) => {
      const form = FORM_VON[w.form ?? ""] ?? "linear";
      const st = leseStaffel(w.staffel);
      const satz = form === "linear" || form === "mindestschwelle" ? `${prozent(anteil(w.satz) ?? 0)}` : "";
      const berechnung = form === "linear" ? `beträgt ${satz} der Bemessungsgrundlage`
        : form === "mindestschwelle" ? `beträgt ${satz} der Bemessungsgrundlage, sobald diese im Abrechnungszeitraum ${euro(zahl(w.schwelle) ?? 0)} erreicht; darunter entsteht keine Provision`
        : `richtet sich nach der Staffel (${st.map((s) => `ab ${euro(s.ab)}${s.bis !== null ? ` bis ${euro(s.bis)}` : ""}: ${prozent(s.satz / 100)}`).join("; ")}). ${form === "staffel-rueckwirkend" ? "Der Satz der höchsten erreichten Stufe gilt für die gesamte Bemessungsgrundlage." : "Jeder Satz gilt nur für den Teil der Bemessungsgrundlage in seiner Stufe."}`;
      const zeitraum = zahl(w.abrechnungMonate) ?? 1;
      return `(1) ${k.vorname} erhält ${w.fixumArt === "reine Provision" ? "eine Provision" : "neben dem Fixum nach § 6 eine Provision"} auf ${liste(w.geschaefte).join(", ") || "vermittelte Geschäfte"}${w.team === "Teamprovision" ? ` als Teamprovision mit einem Anteil von ${prozent(anteil(w.teamAnteil) ?? 0)} (${w.teamSchluessel ?? "Verteilungsschlüssel in der Anlage"})` : ""}. Bemessungsgrundlage ist der ${textBasis(w)}. Die Definition gilt, wie sie hier steht; der Arbeitgeber ändert sie nicht einseitig.\n` +
        `(2) Die Provision ${berechnung.replace(/\.$/, "")}.${w.wiederkehrend && w.wiederkehrend !== "einmalige Abschlussprovision" ? ` Für laufende Verträge entsteht eine Folgeprovision von ${prozent(anteil(w.folgeSatz) ?? 0)} der laufenden Erlöse für ${monateText(zahl(w.folgeMonate) ?? 0)} der Vertragslaufzeit${w.wiederkehrend === "abnehmende Folgeprovision" ? ", in jedem weiteren Vertragsjahr halbiert" : ""}.` : ""} Das Rechenbeispiel in der Anlage ist Teil dieser Regel.\n` +
        `(3) Der Anspruch entsteht ${w.entstehung}. Unabhängig davon entsteht er, sobald und soweit der Kunde geleistet hat (§ 87a Abs. 1 HGB). Steht fest, dass der Kunde nicht leistet, entfällt er; wird ein Geschäft aus Gründen nicht ausgeführt, die der Arbeitgeber zu vertreten hat, bleibt er bestehen (§ 87a Abs. 2 und 3 HGB).\n` +
        `(4) Der Arbeitgeber rechnet ${zeitraum > 1 ? `für jeweils ${monateText(zeitraum)}` : "monatlich"} ab, unverzüglich, spätestens bis zum Ende des folgenden Monats, in Textform mit einer Aufstellung aller provisionspflichtigen Geschäfte. Die Provision ist ${w.faelligkeit === FAELLIG[0] ? "am letzten Tag des Monats fällig, in dem abzurechnen ist (§ 87a Abs. 4 HGB)" : w.faelligkeit} und wird mit dem Gehalt überwiesen.\n` +
        `(5) ${k.vorname} kann einen Buchauszug über alle provisionspflichtigen Geschäfte, Auskunft und Einsicht in die Bücher durch eine sachverständige Person verlangen (§ 87c Abs. 2 bis 4 HGB). Diese Rechte sind nicht ausgeschlossen und nicht beschränkt.\n` +
        `(6) Beginnt oder endet das Arbeitsverhältnis im Abrechnungszeitraum, besteht der Anspruch für Geschäfte aus der Zeit der Beschäftigung, ${w.prorata === PRORATA[1] ? "Sockelbeträge anteilig nach vollen Monaten" : "Sockelbeträge anteilig nach Kalendertagen"}. Der Anspruch hängt nicht davon ab, dass das Arbeitsverhältnis an einem Stichtag ungekündigt besteht.` +
        (w.fixumArt === "reine Provision" ? `\n(7) Für jede Arbeitsstunde erhält ${k.vorname} mindestens den gesetzlichen Mindestlohn. Reicht die Provision eines Monats dafür nicht, zahlt der Arbeitgeber die Differenz; sie wird nicht zurückgefordert.` : "");
    },
    labelEn: "Commission",
    textEn: (w, k) => {
      const form = FORM_VON[w.form ?? ""] ?? "linear";
      const satz = form === "linear" || form === "mindestschwelle" ? `${prozentEn(anteil(w.satz) ?? 0)}` : "";
      const berechnung = form === "linear" ? `amounts to ${satz} of the basis of assessment`
        : form === "mindestschwelle" ? `amounts to ${satz} of the basis of assessment once this reaches ${euroEn(zahl(w.schwelle) ?? 0)} in the settlement period; below this, no commission arises`
        : `follows the tiered scale (${staffelEn(w.staffel)}). ${form === "staffel-rueckwirkend" ? "The rate of the highest tier reached applies to the entire basis of assessment." : "Each rate applies only to the part of the basis of assessment within its tier."}`;
      const zeitraum = zahl(w.abrechnungMonate) ?? 1;
      return `(1) ${k.vorname} receives ${w.fixumArt === "reine Provision" ? "a commission" : "in addition to the fixed salary under § 6, a commission"} on ${liste(w.geschaefte).map((x) => en(GESCHAEFTE_EN, x)).join(", ") || "brokered transactions"}${w.team === "Teamprovision" ? ` as team commission with a share of ${prozentEn(anteil(w.teamAnteil) ?? 0)} (${w.teamSchluessel ? en(SCHLUESSEL_EN, w.teamSchluessel) : "distribution key in the annex"})` : ""}. The basis of assessment is ${textBasisEn(w)}. The definition applies as stated here; the Employer does not change it unilaterally.\n` +
        `(2) The commission ${berechnung.replace(/\.$/, "")}.${w.wiederkehrend && w.wiederkehrend !== "einmalige Abschlussprovision" ? ` For ongoing contracts, a follow-on commission of ${prozentEn(anteil(w.folgeSatz) ?? 0)} of ongoing revenue arises for ${monateEn(zahl(w.folgeMonate) ?? 0)} of the contract term${w.wiederkehrend === "abnehmende Folgeprovision" ? ", halved in each further contract year" : ""}.` : ""} The worked example in the annex forms part of this provision.\n` +
        `(3) The entitlement arises ${en(ENTSTEHUNG_EN, w.entstehung)}. Irrespective of this, it arises as soon as and to the extent that the customer has performed (§ 87a para. 1 HGB). If it is certain that the customer will not perform, the entitlement lapses; if a transaction is not carried out for reasons for which the Employer is responsible, the entitlement remains (§ 87a para. 2 and 3 HGB).\n` +
        `(4) The Employer settles accounts ${zeitraum > 1 ? `for each period of ${monateEn(zeitraum)}` : "monthly"}, without delay and at the latest by the end of the following month, in text form with a statement of all transactions subject to commission. The commission is ${w.faelligkeit === FAELLIG[0] ? "due on the last day of the month in which accounts are to be settled (§ 87a para. 4 HGB)" : en(FAELLIG_EN, w.faelligkeit)} and is transferred with the salary.\n` +
        `(5) ${k.vorname} may request a statement of account covering all transactions subject to commission, information, and inspection of the books by an expert (§ 87c para. 2 to 4 HGB). These rights are neither excluded nor restricted.\n` +
        `(6) If the employment relationship begins or ends during the settlement period, the entitlement exists for transactions from the period of employment, with base amounts ${w.prorata === PRORATA[1] ? "pro rata by full months" : "pro rata by calendar days"}. The entitlement does not depend on the employment relationship existing, and not having been terminated, on a reference date.` +
        (w.fixumArt === "reine Provision" ? `\n(7) For each hour worked, ${k.vorname} receives at least the statutory minimum wage. If the commission for a month is not sufficient for this, the Employer pays the difference; it is not reclaimed.` : "");
    },
    normen: ["§ 65 HGB", "§ 87 Abs. 1 und 3 HGB", "§ 87a HGB", "§ 87b HGB", "§ 87c HGB", "MiLoG", "§ 307 BGB", "§ 308 Nr. 4 BGB"],
    quellen: [HGB_65, HGB_87A, HGB_87C, "Katalog Abschnitt 4, Baustein D5; Abschnitt 5"],
    schutz: ["Basis, Satz, Entstehung und Fälligkeit sind Pflicht", `Abrechnungszeitraum höchstens ${monateText(ABR_MAX)}`, "Fälligkeit nach § 87a Abs. 4 HGB", "Buchauszug, Auskunft, Einsicht immer im Text", "Mindestlohn bei reiner Provision abgesichert", "Rechenbeispiel in der Anlage", "Anteilig bei Ein- und Austritt"],
    sperren: ["Fälligkeit später als § 87a Abs. 4 HGB", "Abrechnungszeitraum über der Grenze", "Ausschluss von Buchauszug und Auskunft", "Reine Provision ohne Mindestlohnabsicherung", "Stichtagsklausel (R8)"],
    regeln: [
      regel("P-040", "sperre", "Fixum je Stunde unter dem Mindestlohn", "MiLoG, § 1 MiLoV", [], (l) => {
        if (l.art === "ausbildung" || l.person.gehalt <= 0 || l.auswahl.D5?.fixumArt === "reine Provision") return null;
        const c = mindestlohnCheck(l.person.gehalt, l.person.wochenstunden, l.person.eintritt > l.heute ? l.person.eintritt : l.heute);
        return wenn(!c.ok, `Fixum unter dem Mindestlohn: ${c.text}. Es fehlen ${euro(c.fehlbetrag)} im Monat.`);
      }),
      regel("P-041", "sperre", "Provision ohne Fixum oder Fixum unter Mindestlohn mal Vertragsstunden", "MiLoG", ["D5"], (l) => {
        const c = fixumOk(l);
        return wenn(!c.ok && !(l.auswahl.D5?.fixumArt === "reine Provision" && ja(l.auswahl.D5, "mindestabsicherung")), `Fixum und Garantie decken den Mindestlohn nicht: ${c.text}. Provision zählt im Voraus nicht, weil sie schwankt.`);
      }),
      regel("K-08", "sperre", "Reine Provision ohne Fixum und ohne Mindestlohnabsicherung", "MiLoG, Katalog K-08", ["D5"], (l) => wenn(wert(l, "D5", "fixumArt") === "reine Provision" && !ja(l.auswahl.D5, "mindestabsicherung"), "Reine Provision nur mit monatlicher Mindestlohnabsicherung oder mit Fixum.")),
      regel("P-044", "sperre", "Abrechnungszeitraum über der Grenze", "§ 87c Abs. 1 HGB", ["D5"], (l) => wenn((num(l, "D5", "abrechnungMonate") ?? 1) > ABR_MAX, `Abgerechnet wird monatlich, höchstens für ${monateText(ABR_MAX)} zusammen (§ 87c Abs. 1 HGB).`)),
      regel("P-045", "sperre", "Fälligkeit später als im Monat der Abrechnung", "§ 87a Abs. 4, § 87c Abs. 1 HGB", ["D5"], (l) => wenn(!!wert(l, "D5", "faelligkeit") && wert(l, "D5", "faelligkeit") !== FAELLIG[0], "Die Provision wird am letzten Tag des Monats fällig, in dem abzurechnen ist. Spätere Fälligkeit ist nichtig (§ 87a Abs. 5 HGB).")),
      regel("K-33", "sperre", "D5 mit Abrechnungszeitraum über der Grenze oder später Fälligkeit", "§ 87c, § 87a Abs. 4 HGB", ["D5"], (l) => wenn((num(l, "D5", "abrechnungMonate") ?? 1) > ABR_MAX || (!!wert(l, "D5", "faelligkeit") && wert(l, "D5", "faelligkeit") !== FAELLIG[0]), "Abrechnung oder Fälligkeit der Provision liegt außerhalb von § 87a Abs. 4 und § 87c Abs. 1 HGB.")),
      regel("P-046", "sperre", "Buchauszug, Auskunft oder Einsicht ausgeschlossen", "§ 87c Abs. 2 bis 5 HGB", ["D5", "D13"], (l) => {
        const t = `${wert(l, "D5", "ergaenzung")} ${wert(l, "D13", "ergaenzung")}`;
        return wenn(AUSSCHLUSS_87C.test(t), "Buchauszug, Auskunft und Einsicht lassen sich nicht ausschließen oder beschränken (§ 87c Abs. 5 HGB).");
      }),
      regel("P-051", "sperre", "Bemessungsgrundlage ohne Definition oder einseitig änderbar", "§ 307 BGB", ["D5", "D15"], (l) => {
        if (hat(l, "D5") && (leer(wert(l, "D5", "basisDefinition")) || wert(l, "D5", "definitionAenderbar") === "ja")) return "Die Bemessungsgrundlage der Provision braucht eine Definition in Worten mit Quelle, die der Arbeitgeber nicht allein ändern darf.";
        return wenn(hat(l, "D15") && leer(wert(l, "D15", "definition")), "Die Bemessungsgrundlage der Tantieme braucht eine Definition mit Quelle (Jahresabschluss nach HGB).");
      }),
      regel("P-050", "sperre", "Staffel mit Lücke oder Überschneidung", "§ 307 Abs. 1 Satz 2 BGB", ["D5", "D11"], (l) => {
        const s = wert(l, "D11", "staffel") || (/Staffel/.test(wert(l, "D5", "form")) ? wert(l, "D5", "staffel") : "");
        if (!s) return null;
        const f = staffelFehler(leseStaffel(s));
        return f.length ? `Staffel nicht lückenlos: ${f.join(" ")}` : null;
      }),
    ],
  },
  {
    id: "D6", gruppe: "D", label: "Provision: Garantie oder Vorschuss (Draw)", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Einarbeitungsphase, neue Gebiete, Quereinsteiger im Vertrieb.",
    stichwoerter: ["Garantieprovision", "Draw", "Vorschuss", "Ramp-up", "Mindestprovision"],
    felder: [
      { id: "art", label: "Garantie oder Vorschuss?", typ: "auswahl", optionen: ["Garantie (nicht rückforderbar)", "Vorschuss (verrechenbar)"], pflicht: true, standard: "Garantie (nicht rückforderbar)" },
      { id: "betrag", label: "Betrag je Monat in €", typ: "betrag", pflicht: true, min: 0 },
      { id: "monate", label: "Für wie viele Monate?", typ: "zahl", pflicht: true, min: 1 },
      { id: "verrechnung", label: "Verrechnung mit späteren Provisionen", typ: "auswahl", optionen: ["monatlich", "quartalsweise"], bei: { art: ["Vorschuss (verrechenbar)"] } },
      { id: "rueckforderung", label: "Überhang beim Ausscheiden", typ: "auswahl", optionen: ["Verzicht auf Rückforderung", "Rückzahlung des nicht verdienten Vorschusses in Raten im pfändbaren Rahmen"], standard: "Verzicht auf Rückforderung", bei: { art: ["Vorschuss (verrechenbar)"] } },
    ],
    text: (w, k) => w.art === "Vorschuss (verrechenbar)"
      ? `(1) ${k.vorname} erhält für ${monateText(zahl(w.monate) ?? 0)} einen Vorschuss auf die Provision von ${euro(zahl(w.betrag) ?? 0)} im Monat.\n(2) Der Vorschuss wird ${w.verrechnung ?? "monatlich"} mit verdienter Provision verrechnet, nur aus dem pfändbaren Teil des Entgelts (§ 394 BGB, § 850c ZPO).\n(3) ${w.rueckforderung === "Verzicht auf Rückforderung" || !w.rueckforderung ? "Beim Ausscheiden fordert der Arbeitgeber einen nicht verdienten Vorschuss nicht zurück." : "Beim Ausscheiden zahlt die Person den nicht verdienten Vorschuss höchstens in Höhe des tatsächlich Gezahlten in angemessenen Raten aus dem pfändbaren Einkommen zurück."}`
      : `(1) ${k.vorname} erhält für ${monateText(zahl(w.monate) ?? 0)} eine garantierte Provision von ${euro(zahl(w.betrag) ?? 0)} im Monat. Liegt die verdiente Provision eines Monats darunter, zahlt der Arbeitgeber die Differenz.\n(2) Die Garantie wird nicht zurückgefordert, auch nicht beim Ausscheiden.`,
    labelEn: "Commission: guarantee or advance (draw)",
    textEn: (w, k) => w.art === "Vorschuss (verrechenbar)"
      ? `(1) ${k.vorname} receives an advance on commission of ${euroEn(zahl(w.betrag) ?? 0)} per month for ${monateEn(zahl(w.monate) ?? 0)}.\n(2) The advance is set off ${en({ monatlich: "monthly", quartalsweise: "quarterly" }, w.verrechnung ?? "monatlich")} against commission earned, only from the attachable part of pay (§ 394 BGB, § 850c ZPO).\n(3) ${w.rueckforderung === "Verzicht auf Rückforderung" || !w.rueckforderung ? "On leaving, the Employer does not reclaim any advance not earned." : "On leaving, the Employee repays the advance not earned, up to the amount actually paid, in reasonable instalments from attachable income."}`
      : `(1) ${k.vorname} receives a guaranteed commission of ${euroEn(zahl(w.betrag) ?? 0)} per month for ${monateEn(zahl(w.monate) ?? 0)}. If the commission earned in a month is lower, the Employer pays the difference.\n(2) The guarantee is not reclaimed, not even on leaving.`,
    normen: ["§ 87a Abs. 1 Satz 2 und Abs. 2 HGB", "§ 394 BGB", "§ 850c ZPO", "§ 818 Abs. 3 BGB"], quellen: [HGB_87A, "Katalog Abschnitt 4, Baustein D6"],
    schutz: ["Wahl Garantie oder Vorschuss Pflicht", "Bei Garantie keine Rückforderung", "Rückforderung höchstens in Höhe des Gezahlten", "Verrechnung nur im pfändbaren Teil", "Verzicht auf Rückforderung als Standard"],
    sperren: ["Garantie mit Rückzahlung beim Ausscheiden", "Vorschuss ohne Verrechnungsregel", "Verrechnung unter das Existenzminimum"],
    regeln: [
      regel("P-047", "hinweis", "Garantie mit Rückforderung", "Logik", ["D6"], (l) => wenn(wert(l, "D6", "art").startsWith("Garantie") && wert(l, "D6", "rueckforderung").startsWith("Rückzahlung"), "Eine Garantie wird nie zurückgefordert. Die Angabe zur Rückforderung gilt nur für einen Vorschuss und wird ignoriert.")),
      regel("K-09", "pflicht", "D6 Garantie mit Rückforderung bei Ausscheiden", "Katalog K-09", ["D6"], (l) => wenn(wert(l, "D6", "art").startsWith("Garantie") && wert(l, "D6", "rueckforderung").startsWith("Rückzahlung"), "Rückforderung bei Garantie ausgeblendet: Der Vertrag sagt, dass die Garantie nicht zurückgefordert wird.")),
    ],
  },
  {
    id: "D7", gruppe: "D", label: "Provision: Gebiet, Kunden und Direktgeschäfte", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Außendienst mit Gebiet oder Kundenliste.",
    stichwoerter: ["Gebiet", "Bezirk", "Bezirksprovision", "Kundenliste", "Splitting", "Direktgeschäft"],
    felder: [
      { id: "zuordnung", label: "Zuordnung", typ: "auswahl", optionen: ["Gebiet", "Kundenliste (Anlage)", "Branche"], pflicht: true },
      { id: "beschreibung", label: "Gebiet, Kundenliste oder Branche genau", typ: "lang", pflicht: true },
      { id: "bezirk", label: "Provision auch auf Geschäfte im Gebiet ohne eigene Mitwirkung (Bezirksprovision)?", typ: "janein", pflicht: true, standard: "nein" },
      { id: "direkt", label: "Direktgeschäfte des Unternehmens im Gebiet", typ: "auswahl", optionen: ["provisionspflichtig", "nicht provisionspflichtig"], pflicht: true, standard: "provisionspflichtig" },
      { id: "splitting", label: "Aufteilung bei mehreren Beteiligten", typ: "text", pflicht: true, standard: "zu gleichen Teilen, wenn nichts anderes vor dem Abschluss in Textform festgehalten ist" },
      { id: "aenderungSchwelle", label: "Gebietsänderung braucht Zustimmung ab einer Minderung des Provisionserwartungswerts um (Prozent)", typ: "prozent", min: 0, max: 100, standard: String(PS.gebietSchwelle * 100) },
    ],
    text: (w, k) => `(1) ${k.vorname} betreut: ${w.zuordnung}, ${w.beschreibung}.\n(2) ${ja(w, "bezirk") ? "Provision entsteht auch für Geschäfte mit Kunden im Gebiet, die ohne Mitwirkung zustande kommen." : "Provision entsteht für Geschäfte, an denen die Person mitgewirkt hat."} Direktgeschäfte des Unternehmens in diesem Bereich sind ${w.direkt}.\n(3) Wirken mehrere mit, gilt: ${w.splitting}. Streitfälle entscheidet nicht der Arbeitgeber allein, sondern beide Seiten gemeinsam nach diesem Schlüssel.\n(4) ${w.aenderungSchwelle ? `Ändert der Arbeitgeber Gebiet oder Kundenliste so, dass der erwartete Provisionswert um mehr als ${prozent((zahl(w.aenderungSchwelle) ?? 0) / 100)} sinkt, braucht er die Zustimmung der Person oder eine Änderungskündigung; kleinere Änderungen kündigt er in Textform an und gleicht sie aus.` : "Änderungen von Gebiet oder Kundenliste vereinbaren beide Seiten."}`,
    labelEn: "Commission: territory, customers and direct business",
    textEn: (w, k) => `(1) ${k.vorname} is responsible for: ${en({ Gebiet: "territory", "Kundenliste (Anlage)": "customer list (annex)", Branche: "industry" }, w.zuordnung)}, ${frei(w.beschreibung)}.\n(2) ${ja(w, "bezirk") ? "Commission also arises for transactions with customers in the territory that come about without the Employee's involvement." : "Commission arises for transactions in which the Employee was involved."} Direct business of the company in this area is ${en({ provisionspflichtig: "subject to commission", "nicht provisionspflichtig": "not subject to commission" }, w.direkt)}.\n(3) Where several people are involved, the following applies: ${frei(w.splitting)}. Disputes are decided not by the Employer alone but by both parties jointly according to this key.\n(4) ${w.aenderungSchwelle ? `If the Employer changes the territory or customer list so that the expected commission value falls by more than ${prozentEn((zahl(w.aenderungSchwelle) ?? 0) / 100)}, it requires the consent of the Employee or a dismissal with an offer of altered terms (Änderungskündigung); it announces smaller changes in text form and compensates for them.` : "Changes to the territory or customer list are agreed by both parties."}`,
    normen: ["§ 87 Abs. 2 HGB", "§ 106 GewO", "§ 308 Nr. 4 BGB"], quellen: [BGB_308, "Katalog Abschnitt 4, Baustein D7"],
    schutz: ["Änderungen über der Schwelle nur mit Zustimmung", "Splitting-Schlüssel Pflicht"],
    sperren: ["Gebietsänderung jederzeit nach Ermessen ohne Ausgleich", "Streitfälle entscheidet der Arbeitgeber allein"],
    regeln: [regel("P-055", "warnung", "Gebietsänderung ohne Ausgleichsschwelle", "§ 308 Nr. 4 BGB", ["D7"], (l) => wenn(leer(wert(l, "D7", "aenderungSchwelle")), "Ohne Schwelle für Gebietsänderungen kann eine Änderung die Provision stark entwerten. Schwelle eintragen (Standard aus dem Katalog)."))],
  },
  {
    id: "D8", gruppe: "D", label: "Provision: Storno und Rückbelastung (Clawback)", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Abonnements, Versicherung, Finanzdienst, Verträge mit Rücktritt oder Kündigung des Kunden.",
    stichwoerter: ["Storno", "Clawback", "Rückbelastung", "Stornohaftung", "Kündigung des Kunden"],
    felder: [
      { id: "ereignisse", label: "Wann wird zurückbelastet?", typ: "mehrfach", optionen: ["Stornierung durch den Kunden", "Widerruf des Kunden", "Nichtzahlung des Kunden", "Produktmangel", "Lieferausfall des Arbeitgebers", "Preisänderung des Arbeitgebers"], pflicht: true, standard: "Stornierung durch den Kunden|Widerruf des Kunden|Nichtzahlung des Kunden" },
      { id: "haftungMonate", label: "Haftungszeit in Monaten seit dem Geschäft", typ: "zahl", min: 1, standard: String(PS.stornoHaftungMonate) },
      { id: "hoehe", label: "Höhe der Rückbelastung", typ: "auswahl", optionen: ["voll", "anteilig nach der Restlaufzeit"], pflicht: true, standard: "anteilig nach der Restlaufzeit" },
    ],
    text: (w, k) => `(1) Fällt die Leistung eines Kunden sicher aus (${liste(w.ereignisse).join(", ")}), entfällt die Provision für dieses Geschäft; bereits gezahlte Provision wird ${w.hoehe === "voll" ? "voll" : "anteilig nach der Restlaufzeit des Kundenvertrags"} zurückbelastet. Das gilt für Ereignisse innerhalb von ${monateTextDativ(zahl(w.haftungMonate) ?? 0)} nach dem Geschäft.\n(2) Beruht der Ausfall auf Umständen, die der Arbeitgeber zu vertreten hat, bleibt die Provision bestehen (§ 87a Abs. 3 HGB).\n(3) Vor einer Rückbelastung bemüht sich der Arbeitgeber in angemessener Weise, den Kunden zu halten, und informiert ${k.vorname} in Textform.\n(4) Rückbelastungen werden nur aus dem pfändbaren Teil des Entgelts verrechnet (§ 394 BGB, § 850c ZPO). Nach dem Ausscheiden gilt dies nur zusammen mit dem Anspruch auf Provision für Geschäfte nach Ende (Baustein D9).`,
    labelEn: "Commission: cancellation and clawback",
    textEn: (w, k) => `(1) If performance by a customer definitely fails (${liste(w.ereignisse).map((x) => en(EREIGNIS_EN, x)).join(", ")}), the commission for this transaction lapses; commission already paid is clawed back ${w.hoehe === "voll" ? "in full" : "pro rata according to the remaining term of the customer contract"}. This applies to events within ${monateEn(zahl(w.haftungMonate) ?? 0)} after the transaction.\n(2) If the failure is due to circumstances for which the Employer is responsible, the commission remains (§ 87a para. 3 HGB).\n(3) Before any clawback, the Employer makes reasonable efforts to retain the customer and informs ${k.vorname} in text form.\n(4) Clawbacks are set off only from the attachable part of pay (§ 394 BGB, § 850c ZPO). After leaving, this applies only together with the entitlement to commission for transactions after the end (module D9).`,
    normen: ["§ 87a Abs. 2, 3 und 5 HGB", "§ 394 BGB", "§ 850c ZPO"], quellen: [HGB_87A, "Katalog Abschnitt 4, Baustein D8"],
    schutz: ["Nur Gründe aus dem Kundenbereich", "Haftungszeit Pflicht", "Nachbearbeitung durch den Arbeitgeber Pflicht", "Verrechnung nur im pfändbaren Teil"],
    sperren: ["Rückbelastung bei Gründen des Arbeitgebers", "ohne zeitliche Grenze", "über das Ausscheiden hinaus ohne Folgeprovision"],
    regeln: [
      regel("P-048", "sperre", "Rückbelastung ohne Haftungszeit oder bei Gründen des Arbeitgebers", "§ 87a Abs. 2, 3 und 5 HGB", ["D8"], (l) => {
        const ag = liste(wert(l, "D8", "ereignisse")).filter((x) => ["Produktmangel", "Lieferausfall des Arbeitgebers", "Preisänderung des Arbeitgebers"].includes(x));
        if (ag.length) return `Rückbelastung nur bei Gründen aus dem Bereich des Kunden. Entfernen: ${ag.join(", ")}.`;
        return wenn(num(l, "D8", "haftungMonate") === null, "Die Haftungszeit für Stornos fehlt.");
      }),
      regel("K-34", "sperre", "D8 mit Rückbelastung bei Umständen, die der Arbeitgeber zu vertreten hat", "§ 87a Abs. 3 und 5 HGB", ["D8"], (l) => wenn(liste(wert(l, "D8", "ereignisse")).some((x) => ["Produktmangel", "Lieferausfall des Arbeitgebers", "Preisänderung des Arbeitgebers"].includes(x)), "Gründe des Arbeitgebers dürfen nicht zur Rückbelastung führen.")),
      regel("P-049", "warnung", "Haftungszeit sehr lang", "Angemessenheit, § 307 BGB", ["D8"], (l) => wenn((num(l, "D8", "haftungMonate") ?? 0) > PS.stornoWarnMonate, `Haftungszeit über ${monateText(PS.stornoWarnMonate)}: Angemessenheit von der Kanzlei prüfen lassen.`)),
    ],
  },
  {
    id: "D9", gruppe: "D", label: "Provision nach dem Ausscheiden (Überhang)", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Vertrieb mit langen Zyklen oder wiederkehrenden Erlösen.",
    stichwoerter: ["Überhang", "Folgeprovision", "nach dem Ausscheiden", "Pipeline"],
    felder: [
      { id: "fristMonate", label: "Geschäfte, die bis wie viele Monate nach dem Ende geschlossen werden", typ: "zahl", pflicht: true, min: 0, standard: String(PS.folgeprovisionMonate) },
      { id: "folge", label: "Folgeprovision aus laufenden Verträgen läuft nach dem Ende weiter?", typ: "janein", pflicht: true, standard: "ja" },
    ],
    text: (w, k) => `(1) Für Geschäfte, die ${k.vorname} vor dem Ende angebahnt hat und die überwiegend auf die Tätigkeit zurückgehen, entsteht die Provision auch, wenn sie innerhalb von ${monateTextDativ(zahl(w.fristMonate) ?? 0)} nach dem Ende geschlossen werden, oder wenn das Angebot des Kunden vor dem Ende eingegangen ist (§ 87 Abs. 3 HGB).\n(2) ${ja(w, "folge") ? "Folgeprovisionen aus Verträgen, die vor dem Ende geschlossen wurden, laufen nach dem Plan weiter." : "Folgeprovisionen enden mit dem Arbeitsverhältnis."}\n(3) Abgerechnet wird nach § 87c HGB wie während des Arbeitsverhältnisses.`,
    labelEn: "Commission after leaving (overhang)",
    textEn: (w, k) => `(1) For transactions that ${k.vorname} initiated before the end and that are mainly attributable to the Employee's work, commission also arises if they are concluded within ${monateEn(zahl(w.fristMonate) ?? 0)} after the end, or if the customer's offer was received before the end (§ 87 para. 3 HGB).\n(2) ${ja(w, "folge") ? "Follow-on commissions from contracts concluded before the end continue under the plan." : "Follow-on commissions end with the employment relationship."}\n(3) Accounts are settled under § 87c HGB as during the employment relationship.`,
    normen: ["§ 87 Abs. 3 HGB", "§ 87c HGB", "§ 65 HGB"], quellen: [HGB_87C, "Katalog Abschnitt 4, Baustein D9"],
    schutz: ["Frist begrenzt", "nur für angebahnte Geschäfte"], sperren: ["Verfall der Provision für angebahnte Geschäfte wegen Ausscheiden"],
    regeln: [regel("P-053", "warnung", "Frist nach Ausscheiden sehr lang", "§ 87 Abs. 3 HGB", ["D9"], (l) => wenn((num(l, "D9", "fristMonate") ?? 0) > PS.folgeprovisionWarnMonate, `Frist über ${monateText(PS.folgeprovisionWarnMonate)}: Kanzlei prüfen lassen.`))],
  },
  {
    id: "D10", gruppe: "D", label: "Provision: Kappung (Deckel)", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Firmen mit Obergrenze für das Budget.",
    stichwoerter: ["Kappung", "Deckel", "Cap", "Obergrenze"],
    felder: [
      { id: "art", label: "Art der Kappung", typ: "auswahl", optionen: ["Betrag je Abrechnungszeitraum", "Betrag je Jahr", "Betrag je Auftrag", "Vielfaches des Fixums"], pflicht: true, standard: "Betrag je Jahr" },
      { id: "betrag", label: "Betrag in €", typ: "betrag", min: 0, bei: { art: ["Betrag je Abrechnungszeitraum", "Betrag je Jahr", "Betrag je Auftrag"] } },
      { id: "faktor", label: "Vielfaches des Fixums", typ: "zahl", min: 0, bei: { art: ["Vielfaches des Fixums"] } },
      { id: "ueber", label: "Was passiert über der Kappung?", typ: "auswahl", optionen: ["Übertrag in den nächsten Zeitraum", "Verfall"], pflicht: true, standard: "Übertrag in den nächsten Zeitraum" },
      { id: "ausnahmen", label: "Ausnahmen (z. B. Großaufträge)", typ: "text" },
    ],
    text: (w, k) => `(1) Die Provision von ${k.vorname} ist begrenzt auf ${w.art === "Vielfaches des Fixums" ? `das ${dezimal(zahl(w.faktor) ?? 0, 3)}fache des Fixums je Abrechnungszeitraum` : `${euro(zahl(w.betrag) ?? 0)} ${w.art?.replace("Betrag ", "")}`}.\n(2) Provision über der Grenze ${w.ueber === "Verfall" ? "entfällt" : "wird in den nächsten Abrechnungszeitraum übertragen"}.${w.ausnahmen ? ` Ausgenommen: ${w.ausnahmen}.` : ""}\n(3) Die Kappung gilt von Anfang an. Eine spätere Einführung oder Absenkung braucht eine Vereinbarung. Das Rechenbeispiel in der Anlage zeigt die Wirkung.`,
    labelEn: "Commission: cap",
    textEn: (w, k) => `(1) The commission of ${k.vorname} is capped at ${w.art === "Vielfaches des Fixums" ? `${zahlEn(zahl(w.faktor) ?? 0, 3)} times the fixed salary per settlement period` : `${euroEn(zahl(w.betrag) ?? 0)} ${en({ "Betrag je Abrechnungszeitraum": "per settlement period", "Betrag je Jahr": "per year", "Betrag je Auftrag": "per order" }, w.art)}`}.\n(2) Commission above the cap ${w.ueber === "Verfall" ? "lapses" : "is carried over to the next settlement period"}.${w.ausnahmen ? ` Excluded: ${frei(w.ausnahmen)}.` : ""}\n(3) The cap applies from the outset. Introducing it later or lowering it requires an agreement. The worked example in the annex shows its effect.`,
    normen: ["§ 307 BGB", "§ 308 Nr. 4 BGB"], quellen: [BGB_307, "Katalog Abschnitt 4, Baustein D10"],
    schutz: ["Kappung als Zahl", "Warnung bei niedriger Kappung", "Rechenbeispiel zeigt die Wirkung"], sperren: ["Kappung ohne Zahl", "nachträgliche Kappung ohne Vereinbarung"],
    regeln: [regel("P-052", "sperre", "Kappung ohne Zahl oder unter dem Mindestfaktor des Zielbonus", "§ 307 BGB", ["D10"], (l) => {
      const n = wert(l, "D10", "art") === "Vielfaches des Fixums" ? num(l, "D10", "faktor") : num(l, "D10", "betrag");
      if (n === null || n <= 0) return "Die Kappung braucht eine Zahl. „Angemessen“ reicht nicht.";
      const zb = num(l, "D2", "betrag");
      return wenn(wert(l, "D10", "art") === "Betrag je Jahr" && zb !== null && n < zb * PS.kappungMindestFaktor, `Warnung: Die Kappung liegt unter dem ${String(PS.kappungMindestFaktor).replace(".", ",")}fachen des Zielbonus. Angemessenheit prüfen.`);
    })],
  },
  {
    id: "D11", gruppe: "D", label: "Staffeln, Schwellen und Beschleuniger", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Vertriebsmodelle mit Quote.",
    stichwoerter: ["Staffel", "Beschleuniger", "Accelerator", "Quote", "Schwelle", "Tier"],
    felder: [
      { id: "staffel", label: "Staffel (ab, bis, Satz in Prozent)", typ: "staffel", pflicht: true },
      { id: "quote", label: "Quote im Zeitraum in €", typ: "betrag", min: 0 },
      { id: "quoteMitteilung", label: "Die Quote wird mitgeteilt", typ: "auswahl", optionen: ["vor Beginn des Zeitraums in Textform", "nach Beginn des Zeitraums"], pflicht: true, standard: "vor Beginn des Zeitraums in Textform" },
      { id: "stornoInQuote", label: "Stornos werden in der Quote abgezogen", typ: "janein", standard: "ja" },
    ],
    text: (w) => `(1) Die Sätze der Provision folgen dieser Staffel: ${leseStaffel(w.staffel).map((s) => `ab ${euro(s.ab)}${s.bis !== null ? ` bis ${euro(s.bis)}` : ""}: ${prozent(s.satz / 100)}`).join("; ")}.\n(2) ${w.quote ? `Die Quote beträgt ${euro(zahl(w.quote) ?? 0)} im Zeitraum. ` : ""}Quote und Staffel werden ${w.quoteMitteilung === "vor Beginn des Zeitraums in Textform" ? "vor Beginn jedes Zeitraums in Textform mitgeteilt und im Lauf des Zeitraums nicht geändert" : "mitgeteilt"}. ${ja(w, "stornoInQuote") ? "Stornos aus Kundengründen mindern die Zielerreichung." : ""}\n(3) Bei einer Staffel, deren höherer Satz für den ganzen Betrag gilt, entsteht an jeder Stufe ein Sprung; die Anlage zeigt ihn mit Zahlen.`,
    labelEn: "Tiers, thresholds and accelerators",
    textEn: (w) => `(1) The commission rates follow this tiered scale: ${staffelEn(w.staffel)}.\n(2) ${w.quote ? `The quota is ${euroEn(zahl(w.quote) ?? 0)} in the period. ` : ""}Quota and scale are ${w.quoteMitteilung === "vor Beginn des Zeitraums in Textform" ? "notified in text form before the start of each period and are not changed during the period" : "notified"}. ${ja(w, "stornoInQuote") ? "Cancellations for reasons on the customer side reduce target achievement." : ""}\n(3) Where a scale applies its higher rate to the whole amount, a jump arises at each tier; the annex shows it with figures.`,
    normen: ["§ 307 Abs. 1 Satz 2 BGB", "§ 87b HGB"], quellen: [BGB_307, "Katalog Abschnitt 4, Baustein D11"],
    schutz: ["Stufen lückenlos und überschneidungsfrei", "Sprung wird gezeigt", "Quote vor Beginn mitgeteilt"], sperren: ["nachträgliche Änderung der Quote", "Staffel mit Lücke", "Beschleuniger nach Periodenende"],
  },
  {
    id: "D12", gruppe: "D", label: "Team- und Umsatzprämie, Wettbewerbe", risiko: "grün", version: 1, fuer: OHNE_WS,
    passt: "Vertriebsteams, Service, Wettbewerbe über kurze Zeiträume.",
    stichwoerter: ["Teamprämie", "Incentive", "Wettbewerb", "Sales Contest"],
    felder: [
      { id: "berechtigte", label: "Wer ist berechtigt?", typ: "text", pflicht: true },
      { id: "schluessel", label: "Verteilungsschlüssel", typ: "auswahl", optionen: ["zu gleichen Teilen", "nach Anteil am Ergebnis", "nach Dienstzeit"], pflicht: true },
      { id: "zeitraum", label: "Zeitraum der Aktion", typ: "text", pflicht: true },
      { id: "kriterien", label: "Kriterien (vorab bekannt)", typ: "text", pflicht: true },
      { id: "teilzeit", label: "Teilzeitkräfte", typ: "auswahl", optionen: TEILZEIT, pflicht: true, standard: "anteilig" },
      { id: "teilzeitGrund", label: "Sachlicher Grund, wenn nicht anteilig", typ: "text", bei: { teilzeit: ["nicht anteilig"] } },
    ],
    text: (w) => `(1) Für ${w.zeitraum} gibt es eine Prämie für ${w.berechtigte}. Kriterien: ${w.kriterien}. Sie sind vor Beginn bekannt.\n(2) Die Prämie wird ${w.schluessel} verteilt${w.teilzeit === "anteilig" ? ", bei Teilzeit im Verhältnis der Arbeitszeit" : ""}. Sie ist eine einmalige Aktion; ein Anspruch auf Wiederholung entsteht nicht.`,
    labelEn: "Team and sales bonus, competitions",
    textEn: (w) => `(1) For ${frei(w.zeitraum)}, there is a bonus for ${frei(w.berechtigte)}. Criteria: ${frei(w.kriterien)}. They are known before the start.\n(2) The bonus is distributed ${en(SCHLUESSEL_EN, w.schluessel)}${w.teilzeit === "anteilig" ? ", for part-time work in proportion to working time" : ""}. It is a one-off campaign; no entitlement to repetition arises.`,
    normen: ["§ 4 TzBfG", "AGG", "§ 87 Abs. 1 Nr. 10 und 11 BetrVG"], quellen: ["https://www.gesetze-im-internet.de/tzbfg/__4.html", "Katalog Abschnitt 4, Baustein D12"],
    schutz: ["Einmalige Aktion", "Kriterien vorab bekannt", "Teilzeit anteilig"], sperren: ["Ausschluss von Teilzeitkräften ohne Grund"],
    regeln: [regel("P-054", "warnung", "Teilzeitkräfte ohne sachlichen Grund ausgeschlossen", "§ 4 TzBfG", ["D12"], (l) => wenn(wert(l, "D12", "teilzeit") === "nicht anteilig" && leer(wert(l, "D12", "teilzeitGrund")), "Teilzeitkräfte bekommen die Prämie nicht anteilig. Ohne sachlichen Grund ist das eine Benachteiligung."))],
  },
  {
    id: "D13", gruppe: "D", label: "Provision: Abrechnung, Buchauszug, Einsicht", risiko: "grün", version: 1, fuer: OHNE_WS,
    passt: "Teil der Provision, auch eigener Baustein bei Boni auf Unternehmenszahlen.",
    stichwoerter: ["Abrechnung", "Buchauszug", "Einsicht", "Provisionsabrechnung"],
    felder: [
      { id: "abrechnungMonate", label: "Abrechnungszeitraum in Monaten", typ: "zahl", pflicht: true, min: 1, max: ABR_MAX, standard: "1" },
      { id: "beanstandungMonate", label: "Beanstandungsfrist für die Abrechnung in Monaten", typ: "zahl", pflicht: true, min: PS.beanstandungMinMonate, standard: String(PS.beanstandungMinMonate) },
      { id: "verfall", label: "Verfallen Rechte nach Ablauf der Beanstandungsfrist?", typ: "janein", pflicht: true, standard: "nein", hinweis: "Besser nein: Für Verfall gilt nur die Ausschlussfrist (Q1)." },
    ],
    text: (w, k) => `(1) Der Arbeitgeber rechnet ${(zahl(w.abrechnungMonate) ?? 1) > 1 ? `für jeweils ${monateText(zahl(w.abrechnungMonate) ?? 1)}` : "monatlich"} ab, spätestens bis zum Ende des folgenden Monats, in Textform mit einer Aufstellung aller Geschäfte.\n(2) ${k.vorname} kann Fehler innerhalb von ${monateTextDativ(zahl(w.beanstandungMonate) ?? PS.beanstandungMinMonate)} beanstanden. ${ja(w, "verfall") ? "Danach gilt die Abrechnung als anerkannt, soweit nicht die Ausschlussfrist etwas anderes ergibt." : "Schweigen gilt nicht als Anerkennung; Ansprüche bleiben im Rahmen der Ausschlussfrist erhalten."}\n(3) Buchauszug, Auskunft und Einsicht in die Bücher (§ 87c Abs. 2 bis 4 HGB) bleiben unberührt und lassen sich nicht ausschließen.`,
    labelEn: "Commission: statement, statement of account, inspection",
    textEn: (w, k) => `(1) The Employer settles accounts ${(zahl(w.abrechnungMonate) ?? 1) > 1 ? `for each period of ${monateEn(zahl(w.abrechnungMonate) ?? 1)}` : "monthly"}, at the latest by the end of the following month, in text form with a statement of all transactions.\n(2) ${k.vorname} may object to errors within ${monateEn(zahl(w.beanstandungMonate) ?? PS.beanstandungMinMonate)}. ${ja(w, "verfall") ? "After that, the statement is deemed accepted unless the exclusion period provides otherwise." : "Silence does not count as acceptance; claims are preserved within the exclusion period."}\n(3) The statement of account, information and inspection of the books (§ 87c para. 2 to 4 HGB) remain unaffected and cannot be excluded.`,
    normen: ["§ 87c HGB"], quellen: [HGB_87C, "Katalog Abschnitt 4, Baustein D13"],
    schutz: ["Rechte aus § 87c HGB nicht ausschließbar", "Beanstandungsfrist nicht kürzer als der Mindestwert"], sperren: ["Abrechnung gilt nach kurzer Frist als anerkannt (Fiktion)"],
    regeln: [regel("K-32", "sperre", "D13 mit Ausschluss von Buchauszug oder Einsicht", "§ 87c Abs. 5 HGB", ["D13"], (l) => wenn(AUSSCHLUSS_87C.test(wert(l, "D13", "ergaenzung")), "Buchauszug und Einsicht sind unabdingbar."))],
  },
  {
    id: "D14", gruppe: "D", label: "Änderung von Provisions-, Bonus- und Zielsystemen", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Firmen, die Provisionspläne jährlich anpassen wollen.",
    stichwoerter: ["Änderungsvorbehalt", "Provisionsplan ändern", "Planänderung"],
    felder: [
      { id: "rhythmus", label: "Anpassung zum", typ: "auswahl", optionen: ["Beginn eines Kalenderjahres", "Beginn eines Geschäftsjahres"], pflicht: true },
      { id: "ankuendigungMonate", label: "Ankündigung in Textform mindestens wie viele Monate vorher?", typ: "zahl", min: PS.aenderungAnkuendigungMonate, standard: String(PS.aenderungAnkuendigungMonate) },
      { id: "gruende", label: "Zulässige Gründe", typ: "mehrfach", optionen: ["Änderung der Produkte", "Änderung der Preise", "Marktentwicklung", "neue Vertriebsstrategie"] },
      { id: "hoechstAbweichung", label: "Gesamtverdienst sinkt durch die Änderung höchstens um (Prozent)", typ: "prozent", min: 0, standard: String(WERTE.widerrufAnteil.max * 100) },
    ],
    text: (w, k) => `(1) Der Arbeitgeber kann den Provisions- oder Bonusplan zum ${w.rhythmus} für künftige Zeiträume anpassen, wenn ${liste(w.gruende).join(", ") || "ein sachlicher Grund"} es erfordert. Er kündigt die Änderung mindestens ${monateText(zahl(w.ankuendigungMonate) ?? PS.aenderungAnkuendigungMonate)} vorher in Textform an.\n(2) Die Änderung darf den zu erwartenden Gesamtverdienst von ${k.vorname} um höchstens ${prozent((zahl(w.hoechstAbweichung) ?? 0) / 100)} senken. Das Fixum ändert sich nur durch Vertrag. Rückwirkende Änderungen gibt es nicht.\n(3) Schweigen gilt nicht als Zustimmung. Stimmt ${k.vorname} nicht zu, gilt der bisherige Plan bis zum Ende des laufenden Zeitraums; danach bleibt dem Arbeitgeber nur die Änderungskündigung.`,
    labelEn: "Changes to commission, bonus and target systems",
    textEn: (w, k) => `(1) The Employer may adjust the commission or bonus plan as of the ${en({ "Beginn eines Kalenderjahres": "start of a calendar year", "Beginn eines Geschäftsjahres": "start of a financial year" }, w.rhythmus)} for future periods if ${liste(w.gruende).map((x) => en(AENDERUNGSGRUND_EN, x)).join(", ") || "an objective reason"} makes this necessary. It announces the change in text form at least ${monateEn(zahl(w.ankuendigungMonate) ?? PS.aenderungAnkuendigungMonate)} in advance.\n(2) The change may reduce the expected total earnings of ${k.vorname} by no more than ${prozentEn((zahl(w.hoechstAbweichung) ?? 0) / 100)}. The fixed salary changes only by contract. There are no retroactive changes.\n(3) Silence does not count as consent. If ${k.vorname} does not consent, the previous plan applies until the end of the current period; after that, the only option left to the Employer is a dismissal with an offer of altered terms (Änderungskündigung).`,
    normen: ["§ 308 Nr. 4 BGB", "§ 307 BGB", "§ 315 BGB", "§ 2 KSchG", "§ 87 Abs. 1 Nr. 10 BetrVG"], quellen: [BGB_308, "Katalog Abschnitt 4, Baustein D14"],
    urteile: [{ az: "BAG 5 AZR 364/04", kennung: "V" }, { az: "BAG 10 AZR 171/23", kennung: "P" }],
    schutz: ["Nur für künftige Zeiträume", "Höchstabweichung Pflicht", "Ankündigungsfrist Pflicht", "Gründe genannt"],
    sperren: ["rückwirkende Änderung", "ohne Gründe", "Änderung des Fixums", "Zustimmung durch Schweigen"],
    regeln: [regel("P-063", "sperre", "Änderungsvorbehalt ohne Ankündigung, Gründe oder Höchstabweichung, oder über der Grenze", "§ 308 Nr. 4 BGB", ["D14"], (l) => {
      const a = num(l, "D14", "hoechstAbweichung");
      if (num(l, "D14", "ankuendigungMonate") === null || !liste(wert(l, "D14", "gruende")).length || a === null) return "Ankündigungsfrist, Gründe und Höchstabweichung sind Pflicht.";
      return wenn(a / 100 > WERTE.widerrufAnteil.max, `Höchstabweichung über ${prozent(WERTE.widerrufAnteil.max)} des Gesamtverdienstes ist unzumutbar.`);
    })],
  },
  {
    id: "D15", gruppe: "D", label: "Tantieme und Gewinnbeteiligung", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Führungskräfte, geschäftsleitungsnahe Positionen, inhabergeführte Firmen.",
    stichwoerter: ["Tantieme", "Gewinnbeteiligung", "EBIT", "Jahresüberschuss"],
    felder: [
      { id: "bemessung", label: "Bemessungsgrundlage", typ: "auswahl", optionen: ["Jahresüberschuss", "EBIT", "Betriebsergebnis"], pflicht: true },
      { id: "definition", label: "Definition mit Quelle und Bereinigungen", typ: "lang", standard: "laut festgestelltem Jahresabschluss nach HGB, bereinigt um außerordentliche Posten" },
      { id: "satz", label: "Prozentsatz", typ: "prozent", pflicht: true, min: 0, max: 100 },
      { id: "mindest", label: "Mindestbetrag in € (optional)", typ: "betrag", min: 0 },
      { id: "hoechst", label: "Höchstbetrag in € (optional)", typ: "betrag", min: 0 },
      { id: "verlust", label: "Verlustjahr", typ: "auswahl", optionen: ["keine Tantieme, kein Vortrag", "Verlust wird mit Folgejahren verrechnet"], pflicht: true },
    ],
    text: (w, k) => `(1) ${k.vorname} erhält eine Tantieme von ${prozent(anteil(w.satz) ?? 0)} des ${w.bemessung} (${w.definition}).${w.mindest ? ` Mindestens ${euro(zahl(w.mindest)!)}.` : ""}${w.hoechst ? ` Höchstens ${euro(zahl(w.hoechst)!)}.` : ""}\n(2) Der Arbeitgeber wendet die Bilanzierungsregeln stetig an und beeinflusst die Bemessungsgrundlage nicht willkürlich. Im Verlustjahr gilt: ${w.verlust}.\n(3) Fällig ist die Tantieme im Monat nach Feststellung des Jahresabschlusses. ${k.vorname} kann die Berechnung durch eine zur Verschwiegenheit verpflichtete sachverständige Person prüfen lassen.\n(4) Beginnt oder endet das Arbeitsverhältnis im Geschäftsjahr, besteht der Anspruch anteilig, ohne Stichtag.`,
    labelEn: "Profit-related bonus and profit sharing",
    textEn: (w, k) => `(1) ${k.vorname} receives a profit-related bonus (Tantieme) of ${prozentEn(anteil(w.satz) ?? 0)} of the ${en({ Jahresüberschuss: "annual net profit", EBIT: "EBIT", Betriebsergebnis: "operating result" }, w.bemessung)} (${frei(w.definition)}).${w.mindest ? ` At least ${euroEn(zahl(w.mindest)!)}.` : ""}${w.hoechst ? ` At most ${euroEn(zahl(w.hoechst)!)}.` : ""}\n(2) The Employer applies the accounting rules consistently and does not influence the basis of assessment arbitrarily. In a loss year: ${en({ "keine Tantieme, kein Vortrag": "no profit-related bonus, no carry-forward", "Verlust wird mit Folgejahren verrechnet": "the loss is offset against subsequent years" }, w.verlust)}.\n(3) The profit-related bonus is due in the month after the annual financial statements are adopted. ${k.vorname} may have the calculation checked by an expert bound to confidentiality.\n(4) If the employment relationship begins or ends during the financial year, the entitlement is pro rata, without a reference date.`,
    normen: ["§ 307 BGB", "§ 162 BGB analog", "§ 242 BGB", "§ 87 Abs. 1 Nr. 10 BetrVG"], quellen: [BGB_307, "Katalog Abschnitt 4, Baustein D15"],
    schutz: ["Definition mit Quelle", "Stetigkeit Pflicht", "Prüfungsrecht Pflicht"], sperren: ["Tantieme ohne Definition", "Stichtagsklausel (R8)", "Ausschluss des Einsichtsrechts"],
  },
  // D34 (Entscheidung 24, Nick 23.10.2026): Bonus nach Betriebsvereinbarung oder Richtlinie, wie in Konzernen üblich.
  {
    id: "D34", gruppe: "D", label: "Bonus nach Betriebsvereinbarung oder Richtlinie", risiko: "gelb", version: 1, fuer: OHNE_WS,
    passt: "Firmen mit Betriebsrat oder einer Bonusrichtlinie für alle, oft im Konzern.",
    stichwoerter: ["Bonus", "Betriebsvereinbarung", "Richtlinie", "Bonusrichtlinie", "Konzern", "Zielquote"],
    felder: [
      { id: "grundlage", label: "Grundlage", typ: "auswahl", optionen: [D34_BV, D34_FEST, D34_DYN], pflicht: true, standard: D34_BV,
        hinweis: "Eine Richtlinie in ihrer jeweils gültigen Fassung kann der Arbeitgeber allein ändern. Das wirkt wie ein Änderungsvorbehalt: Kanzlei prüfen." },
      { id: "titel", label: "Titel der Betriebsvereinbarung oder Richtlinie", typ: "text", pflicht: true },
      { id: "fassungVom", label: "Fassung vom", typ: "datum", pflicht: true, bei: { grundlage: [D34_FEST] } },
      { id: "quote", label: "Zielbonus in Prozent des Bruttojahresgrundgehalts", typ: "prozent", pflicht: true, min: 0 },
      { id: "prorata", label: "Ein- und Austritt im Jahr", typ: "auswahl", optionen: PRORATA, pflicht: true, standard: PRORATA[0] },
    ],
    text: (w, k) => {
      const quelle = w.grundlage === D34_FEST ? `der Richtlinie „${w.titel || "[Titel]"}“ in der Fassung vom ${w.fassungVom ? formatDE(w.fassungVom) : "[Datum]"}, die diesem Vertrag als Anlage beiliegt` : w.grundlage === D34_DYN ? `der Richtlinie „${w.titel || "[Titel]"}“ in ihrer jeweils gültigen Fassung` : `der Betriebsvereinbarung „${w.titel || "[Titel]"}“ in ihrer jeweils gültigen Fassung`;
      return [
        `(1) ${k.vorname} nimmt am Bonus nach ${quelle} teil. Der Zielbonus beträgt ${w.quote || "[Zahl]"} Prozent des Bruttojahresgrundgehalts bei voller Zielerreichung.`,
        `(2) Ziele, Bemessung und Auszahlung regelt ${w.grundlage === D34_BV ? "die Betriebsvereinbarung" : "die Richtlinie"}.${w.grundlage === D34_DYN ? " Änderungen der Richtlinie gelten nur, soweit sie billigem Ermessen entsprechen und den Zielbonus nicht unter den Prozentsatz nach Absatz 1 senken." : ""}`,
        `(3) Beginnt oder endet das Arbeitsverhältnis im Bonusjahr, besteht der Anspruch ${w.prorata === PRORATA[1] ? "anteilig nach vollen Monaten" : "anteilig nach Kalendertagen"}, ohne Stichtag.`,
      ].join("\n");
    },
    labelEn: "Bonus under a works agreement or policy",
    textEn: (w, k) => {
      const quelle = w.grundlage === D34_FEST ? `the policy "${frei(w.titel) || "[title]"}" in the version dated ${w.fassungVom ? datumEn(w.fassungVom) : "[date]"}, attached to this contract as an annex` : w.grundlage === D34_DYN ? `the policy "${frei(w.titel) || "[title]"}" as amended from time to time` : `the works agreement (Betriebsvereinbarung) "${frei(w.titel) || "[title]"}" as amended from time to time`;
      return [
        `(1) ${k.vorname} participates in the bonus under ${quelle}. The target bonus is ${w.quote || "[number]"} per cent of the gross annual base salary at full target achievement.`,
        `(2) Targets, assessment and payment are governed by ${w.grundlage === D34_BV ? "the works agreement" : "the policy"}.${w.grundlage === D34_DYN ? " Amendments to the policy only apply to the extent that they are equitable and do not reduce the target bonus below the percentage under paragraph 1." : ""}`,
        `(3) If the employment relationship begins or ends during the bonus year, the entitlement is ${w.prorata === PRORATA[1] ? "pro rata by full months" : "pro rata by calendar days"}, without a reference date.`,
      ].join("\n");
    },
    normen: ["§ 77 Abs. 4 BetrVG", "§ 307 BGB", "§ 308 Nr. 4 BGB", "§ 315 BGB"], quellen: [BGB_307, "https://www.gesetze-im-internet.de/betrvg/__77.html", "Abgleich Kundenmuster 23.10.2026, Entscheidung 24"],
    schutz: ["Zielquote im Vertrag fest", "Richtlinie bevorzugt in fester Fassung als Anlage", "Bei dynamischer Richtlinie kein Absenken unter die Zielquote", "Anteilig ohne Stichtag"],
    sperren: ["Stichtagsklausel (R8)", "Kombination mit D2 oder D3 für denselben Bonus"],
    regeln: [
      regel("P-108", "warnung", "D34 mit Richtlinie in der jeweils gültigen Fassung", "§ 308 Nr. 4, § 307 Abs. 1 Satz 2 BGB", ["D34"], (l) =>
        wenn(hat(l, "D34") && wert(l, "D34", "grundlage") === D34_DYN, "Die Bonusrichtlinie gilt in ihrer jeweils gültigen Fassung. Das kann wie ein einseitiger Änderungsvorbehalt wirken und unwirksam sein. Sicherer: Fassung als Anlage. Kanzlei prüfen.")),
    ],
  },
];
