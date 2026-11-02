import { formatDE } from "@/lib/regeln/datum";
import type { Anlass, Schritt } from "@/lib/workflows/kern";
import type { Bedingung } from "@/lib/workflows/bauen";

/**
 * Die mitgelieferten Workflows: zehn seit Nick 21.10.2026, der elfte (Arbeitszeit) mit der Zeiterfassung am 31.10.2026 (Nick 21.10.2026: "bau mir bitte 10 workflows die du empfiehlst", Auswahl aus
 * 17-Lintelly/2026-10-21-workflow-ideenkatalog/katalog.md). Die Auslöser lesen, was die Werkbank schon rechnet (Regeln, Pläne, Lohnmonat,
 * Lesebestätigung); die Workflows sorgen fürs Nachfassen und Eskalieren. Entschieden wird weiter dort, wo es heute geschieht.
 */

/** Woher die Anlässe kommen. `sammeln`: alle Treffer ergeben einen Anlass (eine Sammelaufgabe statt einer je Person). */
export type Ausloeser =
  | { art: "befund"; regeln: string[]; sammeln?: { schluessel: string; titel: (n: number) => string; link: string } }
  | { art: "plan"; plan: "eintritt" | "austritt"; aufgaben: string[]; datum: "faellig" | "stichtag" }
  | { art: "lohn" }
  | { art: "lesen" };

export type Teil = { ausloeser: Ausloeser; schritte: Schritt[] };

export type Workflow = {
  id: string; name: string; nutzen: string;
  /** Geschätzte Zeit, die die HR-Leitung je Kunde (rund 40 Beschäftigte) im Monat spart. Schätzung, kein Messwert. */
  ersparnis: string;
  /** Gesundheit oder Mutterschutz: Aufgaben nur für die HR-Leitung, keine Mitteilung an Führungskräfte, im Protokoll vertraulich. */
  gesundheit?: boolean;
  /** Einstellbare Tage je Kunde. */
  tage: Record<string, { label: string; wert: number }>;
  teile: Teil[];
  /** Gilt nur für Personen, auf die alle Bedingungen passen (Baukasten, Nick 24.10.2026). */
  bedingungen?: Bedingung[];
  /** Selbst gebaut, nicht mitgeliefert. */
  eigen?: { von: string; erstellt: string };
};

const name = (a: Anlass) => a.titel;
const am = (a: Anlass) => (a.datum ? formatDE(a.datum) : "");

export const WORKFLOWS: Workflow[] = [
  {
    id: "lohn-stichtag", name: "Lohn-Input bis zum Stichtag", ersparnis: "2 bis 3 Std", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    nutzen: "Führungskräfte melden Änderungen rechtzeitig, die HR-Leitung prüft vor dem Abgabetag, sonst erfährt es die Geschäftsführung.",
    tage: { vorlauf: { label: "Führungskräfte erinnern, Tage vor dem Abgabetag", wert: 7 }, pruefen: { label: "HR-Leitung prüft, Tage vor dem Abgabetag", wert: 2 } },
    teile: [{ ausloeser: { art: "lohn" }, schritte: [
      { id: "melden", art: "mitteilung", an: "alle-fuehrung", ab: "-vorlauf", text: (a) => `Lohn ${a.titel}: Änderungen deines Teams (Urlaub, Krankheit, Stunden) bitte bis ${am(a)} in Lintelly eintragen.` },
      { id: "pruefen", art: "aufgabe", an: "hr", ab: "-pruefen", text: (a) => `Lohn-Input ${a.titel} prüfen und bis ${am(a)} an das Lohnbüro übergeben` },
      { id: "gf", art: "aufgabe", an: "gf", ab: 0, eskalation: true, text: (a) => `Lohn-Input ${a.titel} ist heute fällig und noch nicht übergeben` },
    ] }],
  },
  {
    id: "eintritt-unterlagen", name: "Eintritt: Unterlagen vollständig", ersparnis: "1 bis 2 Std je Eintritt", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    nutzen: "Neue Leute bekommen Erinnerungen zum Personalfragebogen, Vertrag und Sofortmeldung werden nicht vergessen.",
    tage: { erinnern: { label: "Fragebogen erneut erinnern alle … Tage", wert: 3 } },
    teile: [
      { ausloeser: { art: "plan", plan: "eintritt", aufgaben: ["fragebogen-da"], datum: "faellig" }, schritte: [
        { id: "person", art: "mitteilung", an: "person", ab: -7, wiederholen: { alle: "erinnern", max: 3 }, text: () => "Bitte fülle deinen Personalfragebogen aus, damit dein erster Lohn pünktlich kommt." },
        { id: "hr", art: "aufgabe", an: "hr", ab: 0, eskalation: true, text: (a) => `Personalfragebogen von ${name(a)} fehlt noch (fällig ${am(a)})` },
      ] },
      { ausloeser: { art: "plan", plan: "eintritt", aufgaben: ["vertrag"], datum: "faellig" }, schritte: [
        { id: "hr", art: "aufgabe", an: "hr", ab: 0, text: (a) => `Unterschriebener Arbeitsvertrag von ${name(a)} fehlt noch` },
      ] },
      { ausloeser: { art: "plan", plan: "eintritt", aufgaben: ["sofortmeldung"], datum: "faellig" }, schritte: [
        { id: "hr", art: "aufgabe", an: "hr", ab: -1, text: (a) => `Sofortmeldung für ${name(a)} spätestens am ${am(a)} über das Lohnbüro bestätigen (§ 28a Abs. 4 SGB IV)` },
      ] },
    ],
  },
  {
    id: "austritt-rueckgabe", name: "Austritt: Zugänge und Rückgaben", ersparnis: "1 Std je Austritt", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    nutzen: "Am letzten Tag sind Zugänge gesperrt und Geräte zurück. Erst nach der Kommunikation des Austritts erfährt es die Führungskraft.",
    tage: { vorlauf: { label: "Führungskraft erinnern, Tage vor dem letzten Tag", wert: 3 } },
    teile: [{ ausloeser: { art: "plan", plan: "austritt", aufgaben: ["entzug", "rueckgabe"], datum: "faellig" }, schritte: [
      { id: "fuehrung", art: "mitteilung", an: "fuehrung", ab: "-vorlauf", text: (a) => `Letzter Tag von ${name(a)} am ${am(a)}: Zugänge sperren und Geräte zurücknehmen.` },
      { id: "hr", art: "aufgabe", an: "hr", ab: 1, eskalation: true, text: (a) => `Austritt ${name(a)}: Zugänge oder Rückgabe noch nicht bestätigt` },
    ] }],
  },
  {
    id: "probezeit", name: "Probezeit: rechtzeitig entscheiden", ersparnis: "30 Min",
    nutzen: "Feedbackgespräche nach 30 und 90 Tagen, die Geschäftsführung entscheidet mit Vorlauf, sonst schaut die HR-Leitung drauf.", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    tage: { entscheiden: { label: "Geschäftsführung fragen, Tage vor Probezeitende", wert: 30 }, eskalation: { label: "HR-Leitung einschalten, Tage vor Probezeitende", wert: 14 } },
    teile: [
      { ausloeser: { art: "plan", plan: "eintritt", aufgaben: ["checkin-30", "checkin-90"], datum: "faellig" }, schritte: [
        { id: "fuehrung", art: "mitteilung", an: "fuehrung", ab: 0, wiederholen: { alle: 3, max: 2 }, text: (a) => `Feedbackgespräch mit ${name(a)} bis ${am(a)} führen und in Lintelly abhaken.` },
      ] },
      { ausloeser: { art: "befund", regeln: ["probezeit-ende"] }, schritte: [
        { id: "gf", art: "aufgabe", an: "gf", ab: "-entscheiden", text: (a) => `Probezeit von ${name(a)} endet am ${am(a)}: jetzt entscheiden` },
        { id: "hr", art: "aufgabe", an: "hr", ab: "-eskalation", eskalation: true, text: (a) => `Probezeit-Entscheidung zu ${name(a)} fehlt noch (Ende ${am(a)})` },
      ] },
    ],
  },
  {
    id: "krankheit", name: "Krankheit: eAU, BEM, Entgeltfortzahlung", ersparnis: "30 Min", gesundheit: true,
    nutzen: "Fehlende AU wird beim Lohnbüro abgerufen, BEM und Ende der Entgeltfortzahlung kommen rechtzeitig, vertraulich nur bei der HR-Leitung.",
    tage: { vorlauf: { label: "Ende der Entgeltfortzahlung melden, Tage vorher", wert: 7 } },
    teile: [
      { ausloeser: { art: "befund", regeln: ["au-fehlt"] }, schritte: [
        { id: "hr", art: "aufgabe", an: "hr", ab: 0, wiederholen: { alle: 2, max: 3 }, text: (a) => `AU von ${name(a)} fehlt: eAU beim Lohnbüro abrufen lassen` },
      ] },
      { ausloeser: { art: "befund", regeln: ["bem"] }, schritte: [
        { id: "hr", art: "aufgabe", an: "hr", ab: 0, text: (a) => `BEM für ${name(a)} vorbereiten: Einladung, Datenschutzhinweis, Gesprächstermin` },
      ] },
      { ausloeser: { art: "befund", regeln: ["efz-ende"] }, schritte: [
        { id: "hr", art: "aufgabe", an: "hr", ab: "-vorlauf", text: (a) => `Lohnbüro informieren: Entgeltfortzahlung für ${name(a)} endet am ${am(a)}` },
      ] },
    ],
  },
  {
    id: "mutterschutz", name: "Mutterschutz", ersparnis: "1 Std je Fall", gesundheit: true, // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    nutzen: "Mitteilung an die Aufsichtsbehörde und Gefährdungsbeurteilung gehen nicht unter, nur die HR-Leitung sieht den Fall.",
    tage: { eskalation: { label: "Erneut nachfassen nach … Tagen", wert: 3 } },
    teile: [
      { ausloeser: { art: "befund", regeln: ["mutterschutz-meldung"] }, schritte: [
        { id: "hr", art: "aufgabe", an: "hr", ab: 0, wiederholen: { alle: 1, max: 5 }, schonDa: (x, a) => x.effekt?.typ === "mutterschutz-gemeldet" && x.effekt.personId === a.personId, text: (a) => `Schwangerschaft ${name(a)}: unverzüglich an die Aufsichtsbehörde melden (§ 27 MuSchG)` }, // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
      ] },
      { ausloeser: { art: "befund", regeln: ["mutterschutz-gefaehrdung"] }, schritte: [
        { id: "hr", art: "aufgabe", an: "hr", ab: 0, wiederholen: { alle: "eskalation", max: 3 }, text: (a) => `Gefährdungsbeurteilung für ${name(a)} anpassen (§ 10 MuSchG)` }, // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
      ] },
    ],
  },
  {
    id: "resturlaub", name: "Resturlaub-Hinweis", ersparnis: "1 Std zur Saison", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    nutzen: "Urlaub verfällt nur nach rechtzeitigem Hinweis (BAG). Eine Sammelaufgabe statt einzelner Erinnerungen je Person.",
    tage: { erinnern: { label: "Sammelaufgabe erneut nach oben, alle … Tage", wert: 7 } },
    teile: [{ ausloeser: { art: "befund", regeln: ["urlaub-hinweis"], sammeln: { schluessel: "urlaub-hinweis", titel: (n) => `${n} ${n === 1 ? "Hinweis" : "Hinweise"} auf Urlaubsverfall`, link: "/fristen" } }, schritte: [
      { id: "hr", art: "aufgabe", an: "hr", ab: 0, wiederholen: { alle: "erinnern", max: 8 }, schonDa: (x) => x.effekt?.typ === "urlaub-hinweis", text: (a) => `${a.titel} prüfen und versenden` },
    ] }],
  },
  {
    id: "lesebestaetigung", name: "Richtlinie: Lesebestätigung nachfassen", ersparnis: "30 Min",
    nutzen: "Wer das Handbuch oder ein Dokument noch nicht bestätigt hat, wird erinnert, dann die Führungskraft, dann die HR-Leitung.",
    tage: { person: { label: "Person erinnern nach … Tagen", wert: 3 }, fuehrung: { label: "Führungskraft nach … Tagen", wert: 7 }, hr: { label: "HR-Leitung nach … Tagen", wert: 14 } },
    teile: [{ ausloeser: { art: "lesen" }, schritte: [
      { id: "person", art: "mitteilung", an: "person", ab: "person", text: (a) => `Bitte bestätige, dass du „${a.was}“ gelesen hast.` },
      { id: "fuehrung", art: "mitteilung", an: "fuehrung", ab: "fuehrung", text: (a) => `${a.titel} hat „${a.was}“ noch nicht als gelesen bestätigt.` },
      { id: "hr", art: "aufgabe", an: "hr", ab: "hr", eskalation: true, text: (a) => `${a.titel}: Lesebestätigung für „${a.was}“ fehlt seit ${am(a)}` },
    ] }],
  },
  {
    id: "mindestlohn", name: "Mindestlohn- und Minijob-Check", ersparnis: "1 Std einmalig", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    nutzen: "Verträge unter Mindestlohn oder über der Minijob-Grenze werden vor dem Stichtag angepasst, die Geschäftsführung bekommt eine Sammelaufgabe.",
    tage: { erinnern: { label: "Sammelaufgabe erneut nach oben, alle … Tage", wert: 7 } },
    teile: [{ ausloeser: { art: "befund", regeln: ["mindestlohn", "minijob-grenze", "minijob-mindestlohn"], sammeln: { schluessel: "mindestlohn", titel: (n) => `${n} ${n === 1 ? "Vertrag" : "Verträge"} an Mindestlohn oder Minijob-Grenze anpassen`, link: "/entscheidungen" } }, schritte: [
      { id: "gf", art: "aufgabe", an: "gf", ab: 0, wiederholen: { alle: "erinnern", max: 8 }, text: (a) => a.titel },
    ] }],
  },
  {
    id: "befristung", name: "Befristung: Schriftform vor Start", ersparnis: "15 Min je Fall",
    nutzen: "Ein befristeter Vertrag gilt nur mit Unterschrift vor Arbeitsantritt (§ 14 Abs. 4 TzBfG). Lintelly fragt drei Tage vorher nach.", // kein-recht: Workflow-Text, die Frist selbst rechnet die Regel
    tage: { vorlauf: { label: "Nachfragen, Tage vor Arbeitsantritt", wert: 3 } },
    teile: [{ ausloeser: { art: "plan", plan: "eintritt", aufgaben: ["befristung-schrift"], datum: "stichtag" }, schritte: [
      { id: "gf", art: "aufgabe", an: "gf", ab: "-vorlauf", text: (a) => `Befristeter Vertrag ${name(a)}: Original vor dem ${am(a)} von beiden unterschreiben, sonst gilt er als unbefristet` },
      { id: "hr", art: "aufgabe", an: "hr", ab: -1, eskalation: true, text: (a) => `Befristung ${name(a)}: unterschriebenes Original fehlt, Start am ${am(a)}` },
    ] }],
  },
  {
    // Mit der Zeiterfassung zurück (31.10.2026). Vertraulich wie Gesundheit: der Befund kann auf eine Schwangerschaft zurückgehen (§§ 4, 5 MuSchG).
    id: "arbeitszeit", name: "Arbeitszeit: Verstöße klären", ersparnis: "30 Min", gesundheit: true,
    nutzen: "Findet die Zeiterfassung zu lange Tage, fehlende Pausen oder zu kurze Ruhezeit (§§ 3 bis 5 ArbZG), bekommt die HR-Leitung eine Aufgabe und fasst nach.", // kein-recht: Workflow-Text, die Grenzen rechnet die Regel
    tage: { erinnern: { label: "Erneut erinnern nach Tagen", wert: 7 } },
    teile: [{ ausloeser: { art: "befund", regeln: ["arbeitszeit"] }, schritte: [
      { id: "hr", art: "aufgabe", an: "hr", ab: 0, wiederholen: { alle: "erinnern", max: 2 }, text: (a) => `Arbeitszeit von ${name(a)} mit Person und Führungskraft klären: Pausen, Ruhezeit, Höchstarbeitszeit` },
    ] }],
  },
];

export const workflowZu = (id: string) => WORKFLOWS.find((w) => w.id === id) ?? null;
