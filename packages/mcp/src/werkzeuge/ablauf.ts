/**
 * Abläufe mit Daten (Plan Abschnitt 2, Grundsatz 3) und die elf Workflow-Vorlagen der Werkbank.
 * Ein- und Austritt rechnet erzeugePlan aus lib/module/plaene.ts (dieselben Fälligkeiten wie die Werkbank), die übrigen Abläufe
 * nehmen Fristen aus WERTE mit Register-Quelle und Tage aus den Workflows. Werkbank-Begriffe ohne Lintelly-Konto sind neutral gefasst
 * (Tabelle NEUTRAL), die Rechtsangaben bleiben wörtlich. Normen außerhalb von WERTE am 23.10.2026 auf gesetze-im-internet.de gelesen.
 */
import { erzeugePlan, GRUND_TEXT, ROLLE_TEXT } from "@/lib/module/plaene";
import { addDays, addMonths, berechneKuendigung, formatDE, fristEndeWerktag, monatsende, probezeitEnde, zeitraumEnde, type Bundesland } from "@/lib/regeln/datum";
import { REGISTER, wertAm } from "@/lib/regeln/register";
import { WERTE } from "@/lib/regeln/werte";
import { SOFORTMELDUNG_BEREICHE } from "@/lib/sofortmeldung";
import type { AustrittGrund, Beschaeftigung, Person, Plan } from "@/lib/types";
import { kette } from "@/lib/workflows/anzeige";
import { WORKFLOWS } from "@/lib/workflows/vorlagen";
import { antwort, fehler, normQuelle, registerQuelle, type Quelle } from "../antwort";
import { datum, ganzzahl, janein, schema, text, zahl } from "../eingabe";
import { LAENDER, type Werkzeug } from "../werkzeug";

/* ---------- Arten, Bedeutung des Datums, Pflichtangaben ---------- */

type Art = "erste_einstellung" | "eintritt" | "austritt" | "krankheit" | "mutterschutz" | "elternzeit" | "kuendigung_vorbereiten" | "probezeit_ende" | "befristung_ende" | "monatsende_lohn";
const ARTEN: Record<Art, { titel: string; wofuer: string; datum: string; pflicht: string[] }> = {
  erste_einstellung: { titel: "Erste Einstellung", wofuer: "Alles, was bei der ersten Mitarbeiterin oder dem ersten Mitarbeiter anfällt, vom Vertrag bis zur ersten Lohnsteuer-Anmeldung.", datum: "erster Arbeitstag", pflicht: ["datum"] },
  eintritt: { titel: "Eintritt", wofuer: "Was vor und nach dem ersten Arbeitstag einer neuen Person zu tun ist.", datum: "erster Arbeitstag", pflicht: ["datum"] },
  austritt: { titel: "Austritt", wofuer: "Was zu tun ist, wenn jemand geht: Fristen ab dem Zugang, Urlaub, Zeugnis, Papiere, Abmeldung.", datum: "letzter Arbeitstag", pflicht: ["datum", "grund"] },
  krankheit: { titel: "Krankheit", wofuer: "Entgeltfortzahlung, Erstattung über die U1, eAU und BEM, wenn jemand krank ist.", datum: "erster Krankheitstag", pflicht: ["datum"] },
  mutterschutz: { titel: "Mutterschutz", wofuer: "Was zu tun ist, wenn eine Mitarbeiterin schwanger ist: Meldung, Schutz, Fristen, Geld.", datum: "voraussichtlicher Entbindungstermin", pflicht: ["datum"] },
  elternzeit: { titel: "Elternzeit", wofuer: "Fristen und Schritte vor dem Beginn einer Elternzeit.", datum: "Beginn der Elternzeit", pflicht: ["datum"] },
  kuendigung_vorbereiten: { titel: "Kündigung vorbereiten", wofuer: "Was vor einer Kündigung durch die Firma zu prüfen ist und was danach folgt.", datum: "geplanter Tag des Zugangs der Kündigung", pflicht: ["datum"] },
  probezeit_ende: { titel: "Ende der Probezeit", wofuer: "Gespräche, Entscheidung und letzter Tag für eine Kündigung mit kurzer Frist.", datum: "erster Arbeitstag (Beginn der Probezeit)", pflicht: ["datum", "probezeit_monate"] },
  befristung_ende: { titel: "Ende einer Befristung", wofuer: "Verlängern, entfristen oder enden lassen, und was bis zum letzten Tag zu tun ist.", datum: "letzter Tag der Befristung", pflicht: ["datum"] },
  monatsende_lohn: { titel: "Monatsende Lohn", wofuer: "Lohn-Input, Beiträge, Beitragsnachweis und Lohnsteuer in einem Monat.", datum: "ein Tag im Lohnmonat", pflicht: ["datum"] },
};
const ART_IDS = Object.keys(ARTEN) as Art[];

/* ---------- Schritte ---------- */

type Schritt = { was: string; bis: string | null; wer: string; pflicht?: string; hinweis?: string; ueberfaellig?: true };
/** register: Kennungen im Rechtswerte-Register. ab: Sortiertag, wenn bis fehlt oder der Schritt früher beginnt. */
type Intern = Schritt & { register?: string[]; ab?: string };

const GF = "Geschäftsführung", LB = "Lohnbüro", BP = "Beschäftigte Person";
/** Rollen der Werkbank in Worten. Ohne Personalabteilung macht das Personal meist die Geschäftsführung. */
const WER: Record<string, string> = { ...ROLLE_TEXT, hr: "Geschäftsführung oder Personal", lintelly: GF };
const BIS_HINWEIS = "Unter bis steht der Tag, bis zu dem der Schritt erledigt sein sollte. Die gesetzliche Frist steht unter pflicht; wo das Gesetz keinen Tag nennt, ist bis ein Ziel.";
const sortiere = (s: Intern[]) => [...s].sort((a, b) => (a.ab ?? a.bis ?? "").localeCompare(b.ab ?? b.bis ?? ""));
const quelleOhne = (q: string) => q.split(" (")[0];

/** Normen aus einem Pflicht-Text: vor dem ersten Doppelpunkt, ohne Klammern, je Norm ein Eintrag. */
const normenAus = (p: string) => p.split(":")[0].replace(/\s*\([^)]*\)/g, "").split(/;\s*|,\s*(?=§)/).map((x) => x.trim()).filter((x) => /§|Art\.|BAG/.test(x));

/* ---------- Werkbank-Pläne, neutral gefasst ---------- */

/** Texte der Werkbank, die es für Gründer ohne Lintelly nicht gibt. text/hinweis ersetzen ganz, ersetze tauscht Teile. */
const NEUTRAL: Record<string, { text?: string; hinweis?: string | null; ersetze?: [string, string][] }> = {
  vertrag: { text: "Unterschriebenen Arbeitsvertrag zurück, Probezeit und Befristung im Vertrag prüfen" },
  geraete: { text: "Laptop und Zugänge bestellen" },
  willkommen: { text: "Infos zum ersten Tag schicken: Ablauf, Team, Buddy, Anfahrt" },
  "team-info": { text: "Team über den Start informieren, Begrüßung vorbereiten" },
  probezeit: { hinweis: "Die Kündigung muss vor dem Ende zugehen (§ 622 Abs. 3 BGB)." },
  zugang: { text: "Tag des Zugangs festhalten: Tag, an dem die Kündigung zuging (bei Aufhebung der Tag der Unterschrift). Erst damit lassen sich Meldefrist und Klagefrist rechnen", hinweis: "Mit dem Tag des Zugangs (Angabe zugang) rechnet dieser Ablauf Meldefrist und Klagefrist." },
  uebergabe: { text: "Übergabe: offene Aufgaben und Zuständigkeiten an eine benannte Person übergeben", hinweis: null },
  urlaub: { ersetze: [["(Zahlen und Rechenweg im Plan)", "(Zahlen und Rechenweg: Werkzeug urlaubsabgeltung)"]] },
  zeugnis: { ersetze: [["(Neues Dokument, Anlass „Jemand geht“)", "(Werkzeug arbeitszeugnis)"]] },
  wettbewerb: { ersetze: [["Steht im Vertrag nichts davon (oder liegt er nicht in Lintelly), die Aufgabe ohne Folgen abhaken.", "Steht im Vertrag nichts davon, entfällt der Schritt."]] },
  "karenz-lohn": { text: "Wurde nicht verzichtet: Karenzentschädigung für die Folgemonate an das Lohnbüro melden" },
  entzug: { ersetze: [[" (Liste unten)", ""], ["trägt Empfänger und Zweck ein und hält die Frist", "hält Empfänger, Zweck und die Frist"]] },
  rueckgabe: { ersetze: [[" in Mein Lintelly", ""]] },
  abrechnung: { text: "Schlussabrechnung mit Urlaubsabgeltung an das Lohnbüro (Tage und Rechenweg: Werkzeug urlaubsabgeltung)" },
};

/**
 * Erste Einstellung ohne Team (Review 29.10.2026): Buddy und Team gibt es noch nicht, auch keinen Betriebsrat. null heißt: Schritt entfällt.
 * Was Führungskraft, IT oder Personal tun würden, macht die Geschäftsführung.
 */
const OHNE_TEAM: Record<string, { text?: string; ersetze?: [string, string][] } | null> = {
  buddy: null, begruessung: null, "buddy-60": null, "team-info": null,
  willkommen: { text: "Infos zum ersten Tag schicken: Ablauf und Anfahrt" },
  fragebogen: { ersetze: [[" Mit Betriebsrat: Zustimmung nach § 94 BetrVG.", ""]] },
};

function ausPlan(p: Plan, bereich?: string, ohneTeam = false): Intern[] {
  return p.aufgaben.filter((a) => !(ohneTeam && OHNE_TEAM[a.id] === null)).map((a) => {
    const t = ohneTeam ? OHNE_TEAM[a.id] : undefined;
    const n = { ...NEUTRAL[a.id], ...t, ersetze: [...(NEUTRAL[a.id]?.ersetze ?? []), ...(t?.ersetze ?? [])] };
    const tausche = (s: string | undefined) => (s === undefined ? undefined : (n.ersetze ?? []).reduce((t, [x, y]) => t.replace(x, y), s));
    const hinweis = n.hinweis === null ? undefined : tausche(n.hinweis ?? a.hinweis);
    let pflicht = a.pflicht;
    if (a.id === "sofortmeldung" && bereich) pflicht = pflicht?.replace("(Einrichtung, Firmenangaben)", `(${bereich})`);
    return { was: n.text ?? tausche(a.text)!, bis: a.faellig, wer: ohneTeam && a.wer !== "person" ? GF : WER[a.wer], ...(pflicht ? { pflicht } : {}), ...(hinweis ? { hinweis } : {}) };
  });
}

type E = {
  art: Art; datum?: string; beschaeftigungsart?: Beschaeftigung; befristet?: boolean; probezeit_monate?: number; branche_sofortmeldung?: string;
  drittstaat?: boolean; grund?: AustrittGrund; zugang?: string; wettbewerbsverbot?: boolean; sonderkuendigungsschutz?: boolean; eintritt?: string;
  nach_drittem_geburtstag?: boolean; abgabetag?: string; beschaeftigte?: number; betriebsrat?: boolean; bundesland?: Bundesland;
};

/**
 * erzeugePlan liest von der Person nur id, art, befristung, geburtstag, eintritt (Erstuntersuchung Azubi), aufenthalt, schwerbehindert,
 * mutterschutz und elternzeit (plaene.ts: fuer, hinweisFuer). Keine Namen, kein Geburtstag: ohne ihn erscheint die Erstuntersuchung für
 * Azubis immer, der Text sagt „nur unter 18“. Sonderkündigungsschutz setzt schwerbehindert, das reicht für den Hinweis zur Klagefrist.
 */
const personAus = (e: E, beginn: string) => ({
  id: "ablauf", art: e.beschaeftigungsart ?? "vollzeit", geburtstag: "", eintritt: beginn,
  befristung: e.befristet ? { start: beginn, bis: null, verlaengerungen: 0, sachgrund: false } : null,
  ...(e.drittstaat ? { aufenthalt: { gueltigBis: beginn, art: "" } } : {}),
  ...(e.sonderkuendigungsschutz ? { schwerbehindert: true } : {}),
}) as unknown as Person;

const bereichText = (e: E) => SOFORTMELDUNG_BEREICHE.find((b) => b.id === e.branche_sofortmeldung)?.text;
const austrittPlan = (e: E, heute: string, stichtag: string, grund: AustrittGrund, kenntnis: string | null) =>
  ausPlan(erzeugePlan({ id: "ablauf", art: "austritt", person: personAus(e, stichtag), stichtag, grund, erstellt: heute, kenntnis, wettbewerb: e.wettbewerbsverbot, land: e.bundesland }));

/* ---------- Die Abläufe ---------- */

type Ergebnis = { daten?: Record<string, unknown>; schritte: Intern[]; fallen?: string[]; weiter: string[] };
const merken = "Fristen merken: Werkzeug frist_merken";

function eintritt(e: E, heute: string, d: string, ohneTeam = false): Ergebnis {
  const pm = e.probezeit_monate || undefined;
  const plan = erzeugePlan({ id: "ablauf", art: "eintritt", person: personAus(e, d), stichtag: d, erstellt: heute, probezeitMonate: pm, sofortmeldung: !!bereichText(e), land: e.bundesland });
  const schritte = ausPlan(plan, bereichText(e), ohneTeam);
  const ende = pm ? probezeitEnde(d, Math.min(pm, WERTE.probezeitHoechstMonate.wert)) : null;
  if (ende) schritte.push({ was: "Probezeit endet: Eine Kündigung mit 2 Wochen Frist muss bis zu diesem Tag zugegangen sein", bis: ende, wer: GF, pflicht: WERTE.probezeitKuendigungTage.quelle, register: ["probezeitKuendigungTage"] });
  return {
    daten: { arbeitsbeginn: d, ...(ende ? { probezeit_ende: ende } : {}), ...(bereichText(e) ? { sofortmeldepflicht: bereichText(e) } : {}) },
    schritte: sortiere(schritte),
    fallen: [
      ...(e.branche_sofortmeldung ? [] : ["Ob eine Sofortmeldung vor Arbeitsbeginn nötig ist, hängt von der Branche ab (§ 28a Abs. 4 SGB IV). Prüfen mit sofortmeldepflicht."]),
      "Die Unterweisung im Arbeitsschutz und der Nachweis der wichtigsten Bedingungen müssen am ersten Tag da sein, nicht erst mit dem Lohn.",
    ],
    weiter: ["Pflichtangaben im Nachweis: nachweis_pflichtangaben.", "Kosten und Abgaben: arbeitgeberkosten, Stundenlohn: mindestlohn_check.", ...(e.befristet ? ["Befristung prüfen: befristung."] : []), ...(ende ? ["Probezeit im Detail: probezeit."] : []), merken],
  };
}

function ersteEinstellung(e: E, heute: string, d: string): Ergebnis {
  const ohneTeam = !e.beschaeftigte;
  const basis = eintritt(e, heute, d, ohneTeam);
  const ml = REGISTER.find((x) => x.id === "mindestlohn")!;
  const lohn = wertAm(ml, d)?.wert;
  // Ändert sich der Mindestlohn in den 3 Monaten nach dem Start, gehört der neue Wert in den Check (Review 29.10.2026).
  const neu = ml.werte.find((w) => !w.ausstehend && !!w.gueltigAb && w.gueltigAb > d && w.gueltigAb <= addMonths(d, 3));
  const erst: Intern[] = [
    { was: "Betriebsnummer beim Betriebsnummern-Service der Bundesagentur für Arbeit elektronisch beantragen", bis: d, wer: GF, pflicht: "§ 18i Abs. 1 SGB IV", hinweis: "Ohne Betriebsnummer keine Meldung zur Sozialversicherung. Sie gilt je Beschäftigungsbetrieb." },
    { was: "Firma bei der zuständigen Berufsgenossenschaft (gesetzliche Unfallversicherung) anmelden, falls noch nicht geschehen", bis: d, wer: GF, pflicht: "§ 192 Abs. 1 SGB VII", hinweis: "Die Meldung ist binnen einer Woche nach Beginn des Unternehmens fällig. Eine Gewerbeanzeige in derselben Woche gilt als Meldung." },
    { was: "Lohnabrechnung klären: Lohnbüro oder Steuerberatung beauftragen und den Abgabetag für den Lohn-Input vereinbaren", bis: d, wer: GF, hinweis: "Das Lohnbüro meldet bei der Krankenkasse an, rechnet ab und kümmert sich um Beiträge und Lohnsteuer." },
    { was: "Krankenkasse der Person erfragen (Personalfragebogen). Über sie laufen die Anmeldung und die Umlagen U1 und U2", bis: d, wer: GF, pflicht: "§ 7 Abs. 1 AAG; § 1 AAG; § 2 Abs. 2 AAG",
      hinweis: "Mit der U1 bekommst du bei Krankheit 80 Prozent der Entgeltfortzahlung zurück (Betriebe mit in der Regel bis zu 30 Beschäftigten), mit der U2 die Kosten im Mutterschutz voll. Erstattet wird nur auf Antrag.", register: ["umlageU1Grenze"] },
    { was: "Gefährdungsbeurteilung für den Arbeitsplatz erstellen und festhalten", bis: d, wer: GF, pflicht: "§ 5 Abs. 1 ArbSchG" },
    { was: "Arbeitszeit erfassen: festlegen, wie Beginn, Ende und Dauer aufgezeichnet werden", bis: d, wer: GF, pflicht: "§ 3 Abs. 2 Nr. 1 ArbSchG; BAG, 13.09.2022, 1 ABR 22/21; § 16 Abs. 2 ArbZG",
      hinweis: `Beim Minijob spätestens ${WERTE.milogAufzeichnung.tage} Tage nach dem Arbeitstag aufzeichnen und ${WERTE.milogAufzeichnung.jahre} Jahre aufbewahren (§ 17 Abs. 1 MiLoG).` },
    { was: `Mindestlohn-Check: Bruttolohn geteilt durch die vereinbarten Stunden muss mindestens ${lohn ?? "den Mindestlohn"} je Stunde ergeben`, bis: d, wer: GF, pflicht: ml.norm, register: ["mindestlohn"],
      ...(neu ? { hinweis: `Ab ${formatDE(neu.gueltigAb!)} gilt ${neu.wert} je Stunde. Vereinbare den Lohn so, dass er dann noch reicht, sonst musst du ihn zu diesem Tag erhöhen.` } : {}) },
    { was: "Lohnsteuer anmelden und abführen, zum ersten Mal nach dem ersten Lohnmonat (über das Lohnbüro)", bis: null, ab: monatsende(d), wer: LB, pflicht: "§ 41a Abs. 1 EStG",
      hinweis: "Spätestens am 10. Tag nach Ende des Anmeldungszeitraums. Der Zeitraum ist Monat, Vierteljahr oder Jahr, je nach Lohnsteuer des Vorjahres (§ 41a Abs. 2 EStG). Welcher für dich gilt, sagt dir das Lohnbüro oder das Finanzamt." },
  ];
  return {
    ...basis, schritte: sortiere([...erst, ...basis.schritte]), weiter: [...basis.weiter, "Jeden Monat: ablauf mit art monatsende_lohn."],
    fallen: [...(basis.fallen ?? []), ...(ohneTeam ? ["Ohne Team: Schritte mit Buddy und Team entfallen, Aufgaben von Führungskraft, IT und Personal liegen bei der Geschäftsführung. Mit beschaeftigte über 0 kommen sie zurück."] : [])],
  };
}

function austritt(e: E, heute: string, d: string): Ergebnis {
  const grund = e.grund!;
  return {
    daten: { letzter_arbeitstag: d, grund: GRUND_TEXT[grund], ...(e.zugang ? { zugang: e.zugang } : {}) },
    schritte: sortiere(austrittPlan(e, heute, d, grund, e.zugang ?? null)),
    fallen: [
      ...(grund === "arbeitgeber" ? ["Die Klagefrist gilt auch im Kleinbetrieb. Erst nach ihrem Ende ist die Kündigung sicher."] : []),
      ...(["arbeitnehmer", "arbeitgeber", "aufhebung"].includes(grund) && !e.zugang ? ["Ohne den Tag des Zugangs rechnet der Ablauf keine Melde- und Klagefrist. Nie einen Tag raten."] : []),
    ],
    weiter: ["Resturlaub in Geld: urlaubsabgeltung.", "Zeugnis: arbeitszeugnis.", ...(grund === "arbeitgeber" || grund === "arbeitnehmer" ? ["Frist prüfen: kuendigungsfrist_rechnen."] : []), merken],
  };
}

function krankheit(e: E, heute: string, d: string): Ergebnis {
  const anspruchAb = e.eintritt ? addDays(e.eintritt, WERTE.efzWartezeitTage.wert) : d;
  const start = anspruchAb > d ? anspruchAb : d;
  const ende = addDays(start, WERTE.entgeltfortzahlungTage.wert - 1);
  const bem = addDays(d, WERTE.bemSchwelleTage.wert);
  const vorlauf = WORKFLOWS.find((w) => w.id === "krankheit")!.tage.vorlauf.wert;
  const u1 = e.beschaeftigte === undefined || e.beschaeftigte <= WERTE.umlageU1Grenze.wert;
  return {
    daten: { erster_krankheitstag: d, entgeltfortzahlung_ab: start, entgeltfortzahlung_bis: ende, bem_ab: bem },
    schritte: sortiere([
      { was: "Krankmeldung festhalten: erster Tag und voraussichtliche Dauer, keine Diagnose", bis: d, wer: GF, pflicht: "§ 5 Abs. 1 EFZG", hinweis: "Die Person muss die Krankheit unverzüglich mitteilen." },
      { was: "eAU bei der Krankenkasse abrufen (über das Lohnbüro), wenn die Krankheit länger als 3 Kalendertage dauert", bis: fristEndeWerktag(d, WERTE.krankAuAbTag.wert, e.bundesland), wer: LB,
        pflicht: "§ 5 Abs. 1a EFZG; § 109 Abs. 1 SGB IV", register: ["krankAuAbTag"],
        hinweis: "Gesetzlich Versicherte legen keinen gelben Schein mehr vor, die Krankenkasse stellt die Daten zum Abruf bereit. Privat Versicherte legen weiter eine ärztliche Bescheinigung vor. Gerechnet mit Werktagen Montag bis Freitag." },
      { was: "U1: Erstattung der Entgeltfortzahlung bei der Krankenkasse beantragen, sobald der Lohn gezahlt ist", bis: null, ab: monatsende(d), wer: LB, pflicht: "§ 1 Abs. 1 AAG; § 2 Abs. 2 AAG", register: ["umlageU1Grenze"],
        hinweis: u1 ? "Betriebe mit in der Regel bis zu 30 Beschäftigten bekommen 80 Prozent des fortgezahlten Lohns und der Arbeitgeberbeiträge zurück. Für kleine Firmen ist das der größte Posten. Ohne Antrag gibt es nichts." : "Mit mehr als 30 Beschäftigten nimmt die Firma in der Regel nicht an der U1 teil. Mit der Krankenkasse klären." },
      { was: "Lohnbüro Bescheid geben: Ende der Entgeltfortzahlung steht an", bis: addDays(ende, -vorlauf), wer: GF, hinweis: "Ab dem Tag danach zahlt bei gesetzlich Versicherten die Krankenkasse Krankengeld." },
      { was: "Entgeltfortzahlung endet (6 Wochen)", bis: ende, wer: LB, pflicht: WERTE.entgeltfortzahlungTage.quelle, register: ["entgeltfortzahlungTage", ...(e.eintritt ? ["efzWartezeitTage"] : [])] },
      { was: "BEM anbieten: Einladung, Datenschutzhinweis, Gesprächstermin", bis: bem, wer: GF, pflicht: WERTE.bemSchwelleTage.quelle, register: ["bemSchwelleTage"],
        hinweis: "Pflicht ab mehr als 6 Wochen Arbeitsunfähigkeit in 12 Monaten, am Stück oder zusammengezählt, in jeder Firmengröße. Die Person darf ablehnen." },
    ]),
    fallen: [
      `Fortsetzungserkrankung: Bei derselben Krankheit gibt es die 6 Wochen nur einmal, neu erst nach den Regeln in ${WERTE.efzNeuerAnspruch.quelle}.`,
      "Hat die Person am ersten Krankheitstag noch gearbeitet, beginnt die Zählung am Tag danach.",
      ...(e.eintritt ? [] : [`In den ersten ${WERTE.efzWartezeitTage.wert / 7} Wochen der Beschäftigung gibt es keine Entgeltfortzahlung (${WERTE.efzWartezeitTage.quelle}). Mit der Angabe eintritt rechnet der Ablauf das mit.`]),
      `War es ein Arbeitsunfall und dauert die Arbeitsunfähigkeit mehr als ${WERTE.unfallanzeige.abAuTage} Tage, zeigst du ihn binnen ${WERTE.unfallanzeige.fristTage} Tagen der Berufsgenossenschaft an (§ 193 Abs. 1 und 4 SGB VII).`,
      "Gesundheitsdaten nur so weit wie nötig weitergeben, auch im Team.",
    ],
    weiter: ["Rechnung mit Fortsetzungserkrankung: entgeltfortzahlung.", "BEM im Detail: bem_pflicht.", merken],
  };
}

function mutterschutz(e: E, heute: string, et: string): Ergebnis {
  const vor = addDays(et, -WERTE.mutterschutzVorTage.wert);
  const nach = addDays(et, WERTE.mutterschutzNachTage.wert);
  const k4 = addMonths(et, WERTE.mutterschutzKuendigungsverbotMonate.wert);
  const verbotBis = k4 > nach ? k4 : nach;
  const ziel = addDays(heute, WERTE.mutterschutzMeldungZielTage.wert);
  const ezBeginn = addDays(nach, 1);
  const az = WERTE.mutterschutzArbeitszeit;
  return {
    daten: { errechneter_termin: et, schutzfrist_ab: vor, schutzfrist_bis: nach, kuendigungsverbot_bis: verbotBis, vorlaeufig: true },
    schritte: sortiere([
      { was: "Schwangerschaft an die Aufsichtsbehörde für Mutterschutz in deinem Bundesland melden", bis: ziel, wer: GF, pflicht: WERTE.mutterschutzMeldung.quelle, register: ["mutterschutzMeldung"],
        hinweis: `Das Gesetz sagt unverzüglich. Ziel: binnen ${WERTE.mutterschutzMeldungZielTage.wert} Tagen ab heute.` },
      { was: "Gefährdungsbeurteilung für die Schwangere anpassen und Schutzmaßnahmen festlegen", bis: ziel, wer: GF, pflicht: WERTE.mutterschutzGefaehrdung.quelle, register: ["mutterschutzGefaehrdung", "mutterschutzArbeitszeit"],
        hinweis: `Höchstens ${String(az.tagStunden).replace(".", ",")} Stunden am Tag und ${az.doppelwocheStunden} Stunden in der Doppelwoche, keine Arbeit zwischen ${az.nachtVonStunde} und ${az.nachtBisStunde} Uhr (§ 4 Abs. 1 und § 5 Abs. 1 MuSchG).` },
      { was: `Kündigungsverbot beachten: keine Kündigung von jetzt bis mindestens ${formatDE(verbotBis)}`, bis: verbotBis, ab: heute, wer: GF, pflicht: WERTE.mutterschutzKuendigungsverbot.quelle, register: ["mutterschutzKuendigungsverbot", "mutterschutzKuendigungsverbotMonate"],
        hinweis: "Vorläufig, gerechnet ab dem errechneten Termin. Mindestens bis vier Monate nach der Entbindung." },
      { was: "Resturlaub festhalten: Er bleibt erhalten und kann nach dem Mutterschutz genommen werden", bis: vor, wer: GF, pflicht: "§ 24 MuSchG", hinweis: "Die Schutzfristen zählen für den Urlaubsanspruch als Beschäftigungszeit." },
      { was: "Lohnbüro Bescheid geben: Zuschuss zum Mutterschaftsgeld für die Schutzfristen, Erstattung über die U2", bis: vor, wer: GF, pflicht: "§ 20 Abs. 1 MuSchG; § 1 Abs. 2 AAG; § 2 Abs. 2 AAG",
        hinweis: "Den Zuschuss zahlst du, die Krankenkasse erstattet ihn über die U2 voll, auf Antrag. Das gilt auch für den Lohn bei einem Beschäftigungsverbot (§ 18 MuSchG)." },
      { was: "Schutzfrist vor der Geburt beginnt", bis: vor, wer: BP, pflicht: WERTE.mutterschutzVorTage.quelle, register: ["mutterschutzVorTage"] },
      { was: "Schutzfrist nach der Geburt endet (vorläufig)", bis: nach, wer: BP, pflicht: WERTE.mutterschutzNachTage.quelle, register: ["mutterschutzNachTage", "mutterschutzNachTageVerlaengert"],
        hinweis: `Bei Früh- oder Mehrlingsgeburt und Behinderung des Kindes ${WERTE.mutterschutzNachTageVerlaengert.wert / 7} Wochen. Kommt das Kind früher, hängen die fehlenden Tage hinten an (§ 3 Abs. 2 Satz 3 MuSchG).` },
      { was: "Elternzeit direkt danach: Die Person muss sie spätestens an diesem Tag schriftlich verlangen", bis: addDays(ezBeginn, -WERTE.elternzeitAnmeldungWochen.wert * 7), wer: BP, pflicht: WERTE.elternzeitAnmeldungWochen.quelle, register: ["elternzeitAnmeldungWochen"],
        hinweis: `Gerechnet mit Beginn am ${formatDE(ezBeginn)}, dem Tag nach der Schutzfrist. Die Elternzeit bescheinigst du (§ 16 Abs. 1 Satz 8 BEEG).` },
    ]),
    fallen: [
      "Alle Daten sind vorläufig, bis das Kind da ist. Danach mit dem Tag der Geburt neu rechnen (Werkzeug mutterschutz).",
      "Die Schwangerschaft nicht ohne Zustimmung der Mitarbeiterin im Team weitersagen.",
    ],
    weiter: ["Schutzfristen nach der Geburt: mutterschutz.", "Elternzeit: elternzeit_fristen.", "Vor jeder Kündigung: sonderkuendigungsschutz_check.", merken],
  };
}

function elternzeit(e: E, _heute: string, beginn: string): Ergebnis {
  const nach3 = !!e.nach_drittem_geburtstag;
  const wochen = nach3 ? WERTE.elternzeitAnmeldungWochenNach3 : WERTE.elternzeitAnmeldungWochen;
  const schutz = nach3 ? WERTE.elternzeitSchutzVorherWochen.wertNach3 : WERTE.elternzeitSchutzVorherWochen.wert;
  const verlangen = addDays(beginn, -wochen.wert * 7);
  return {
    daten: { beginn, verlangen_spaetestens: verlangen, kuendigungsschutz_fruehestens: addDays(beginn, -schutz * 7) },
    schritte: sortiere([
      { was: "Kündigungsschutz beginnt mit dem Verlangen, frühestens an diesem Tag", bis: addDays(beginn, -schutz * 7), wer: GF, pflicht: WERTE.elternzeitSchutzVorherWochen.quelle, register: ["elternzeitSchutzVorherWochen"] },
      { was: `Elternzeit verlangen: Das schriftliche Verlangen muss spätestens ${wochen.wert} Wochen vor Beginn bei dir sein`, bis: verlangen, wer: BP, pflicht: wochen.quelle, register: [nach3 ? "elternzeitAnmeldungWochenNach3" : "elternzeitAnmeldungWochen"] },
      { was: "Elternzeit bescheinigen", bis: null, ab: addDays(verlangen, 1), wer: GF, pflicht: "§ 16 Abs. 1 Satz 8 BEEG" },
      { was: "Entscheiden, ob du den Urlaub kürzt: je vollem Kalendermonat Elternzeit um ein Zwölftel", bis: beginn, wer: GF, pflicht: WERTE.elternzeitKuerzungMonate.quelle, register: ["elternzeitKuerzungMonate"],
        hinweis: "Die Kürzung geschieht nicht von selbst. Erkläre sie der Person." },
      { was: "Lohnbüro Bescheid geben: Beginn und Ende der Elternzeit", bis: beginn, wer: GF },
    ]),
    fallen: [
      `Teilzeit in der Elternzeit ist möglich (${WERTE.elternzeitTeilzeit.quelle}).`,
      `Resturlaub von vor der Elternzeit bleibt (${WERTE.elternzeitResturlaub.quelle}).`,
    ],
    weiter: ["Fristen im Detail: elternzeit_fristen.", "Vor jeder Kündigung: sonderkuendigungsschutz_check.", merken],
  };
}

function kuendigungVorbereiten(e: E, heute: string, zugang: string): Ergebnis {
  const klein = e.beschaeftigte !== undefined && e.beschaeftigte <= WERTE.kschgSchwelle.wert;
  const wartezeitVorbei = e.eintritt ? zeitraumEnde(e.eintritt, WERTE.kschgWartezeitMonate.wert) < zugang : null;
  const kschg = e.beschaeftigte === undefined ? null : klein ? false : wartezeitVorbei;
  const r = e.eintritt ? berechneKuendigung({ eintritt: e.eintritt, zugang, probezeitMonate: e.probezeit_monate, bundesland: e.bundesland }) : null;
  const tf = WERTE.kschgTeilzeitFaktor;
  const kschgSchritt: Intern = kschg === false
    ? { was: klein ? "Kündigungsschutzgesetz prüfen: Mit 10 oder weniger Beschäftigten gilt es nicht. Ein Grund nach dem Gesetz ist nicht nötig, Frist, Schriftform und Zugang aber schon" : "Kündigungsschutzgesetz prüfen: Die Person ist noch keine 6 Monate da, es gilt noch nicht",
      bis: zugang, wer: GF, pflicht: klein ? WERTE.kschgSchwelle.quelle : WERTE.kschgWartezeitMonate.quelle, register: [klein ? "kschgSchwelle" : "kschgWartezeitMonate"] }
    : kschg === true
      ? { was: "Kündigungsschutzgesetz gilt: Die Kündigung braucht einen Grund in der Person, im Verhalten oder im Betrieb", bis: zugang, wer: GF, pflicht: "§ 1 KSchG", register: ["kschgSchwelle", "kschgWartezeitMonate"] }
      : { was: "Prüfen, ob das Kündigungsschutzgesetz gilt: mehr als 10 Beschäftigte und länger als 6 Monate im Betrieb", bis: zugang, wer: GF, pflicht: WERTE.kschgSchwelle.quelle, register: ["kschgSchwelle", "kschgWartezeitMonate", "kschgTeilzeitFaktor"],
        hinweis: `Teilzeit zählt anteilig: bis ${tf.bis20Std.stunden} Stunden mit ${String(tf.bis20Std.faktor).replace(".", ",")}, bis ${tf.bis30Std.stunden} Stunden mit ${String(tf.bis30Std.faktor).replace(".", ",")}. Auszubildende zählen nicht.` };
  const vorher: Intern[] = [
    kschgSchritt,
    { was: "Sonderkündigungsschutz prüfen: Schwangerschaft, Elternzeit, Schwerbehinderung, Pflegezeit, Amt im Betriebsrat", bis: zugang, wer: GF, pflicht: "§ 17 MuSchG; § 18 Abs. 1 BEEG; § 168 SGB IX; § 5 Abs. 1 PflegeZG; § 15 KSchG",
      hinweis: "Dann ist die Kündigung verboten oder braucht vorher die Zustimmung einer Behörde. Werkzeug sonderkuendigungsschutz_check." },
    ...(e.betriebsrat ? [{ was: "Betriebsrat vor der Kündigung anhören: Person, Art der Kündigung, Gründe", bis: null, ab: addDays(zugang, -WERTE.betriebsratAnhoerungFrist.ordentlichTage), wer: GF,
      pflicht: WERTE.betriebsratAnhoerung.quelle, register: ["betriebsratAnhoerung", "betriebsratAnhoerungFrist"],
      hinweis: `Ohne Anhörung ist die Kündigung unwirksam. Bei der ordentlichen Kündigung hat der Betriebsrat ${WERTE.betriebsratAnhoerungFrist.ordentlichTage} Tage für Bedenken (§ 102 Abs. 2 BetrVG), erst danach kündigen.` }] : []),
    r ? { was: `Kündigung muss spätestens an diesem Tag zugehen, damit das Arbeitsverhältnis am ${formatDE(r.ende)} endet (${r.regel.label})`, bis: r.spaetesterZugang, wer: GF, pflicht: r.regel.quelle }
      : { was: "Kündigungsfrist rechnen: Ende und spätester Zugang (Werkzeug kuendigungsfrist_rechnen)", bis: zugang, wer: GF, pflicht: "§ 622 BGB" },
    { was: "Kündigung schreiben: auf Papier mit Originalunterschrift der Geschäftsführung", bis: zugang, wer: GF, pflicht: WERTE.kuendigungSchriftform.quelle, register: ["kuendigungSchriftform", "kuendigungVollmacht"],
      hinweis: `E-Mail, PDF oder Messenger reichen nicht. Unterschreibt jemand anderes, gehört die Vollmacht im Original dazu (${quelleOhne(WERTE.kuendigungVollmacht.quelle)}).` },
    { was: "Zugang sichern: Kündigung persönlich übergeben oder von einem Boten einwerfen lassen, der es bezeugen kann", bis: zugang, wer: GF, hinweis: "Es zählt der Tag, an dem die Kündigung zugeht, nicht das Datum im Schreiben." },
  ];
  const danach = r
    ? austrittPlan(e, heute, r.ende, "arbeitgeber", zugang).filter((s) => !s.was.startsWith("Kündigung im Original"))
    : [{ was: "Klagefrist läuft bis zu diesem Tag (3 Wochen nach Zugang)", bis: fristEndeWerktag(zugang, WERTE.kschgKlageWochen.wert * 7, e.bundesland), wer: GF, pflicht: WERTE.kschgKlageWochen.quelle, register: ["kschgKlageWochen"] },
       { was: "Danach: Resturlaub, Zeugnis, Arbeitsbescheinigung und Abmeldung planen (ablauf mit art austritt und dem letzten Arbeitstag)", bis: null, ab: addDays(zugang, 1), wer: GF }];
  return {
    daten: { geplanter_zugang: zugang, kuendigungsschutzgesetz: kschg, ...(r ? { ende: r.ende, spaetester_zugang: r.spaetesterZugang, regel: r.regel.label, beschaeftigungsjahre: r.jahre } : {}) },
    schritte: [...sortiere(vorher), ...sortiere(danach)],
    fallen: [
      ...(r ? r.hinweise.filter((h) => h.typ === "warnung").map((h) => h.text) : ["Ohne Arbeitsbeginn (Angabe eintritt) rechnet der Ablauf kein Ende und keine Schritte bis zum letzten Tag."]),
      "Eine Kündigung trotz Sonderkündigungsschutz oder ohne Schriftform ist unwirksam und lässt sich nicht nachbessern.",
    ],
    weiter: ["Frist im Detail: kuendigungsfrist_rechnen.", "Sonderkündigungsschutz: sonderkuendigungsschutz_check.", "Schreiben: kuendigungsschreiben und kuendigung_pflichtangaben.", "Resturlaub in Geld: urlaubsabgeltung.", "Zeugnis: arbeitszeugnis.", merken],
  };
}

function probezeitEndeAblauf(e: E, heute: string, d: string): Ergebnis {
  const pm = Math.min(e.probezeit_monate!, WERTE.probezeitHoechstMonate.wert);
  const ende = probezeitEnde(d, pm);
  const wf = WORKFLOWS.find((w) => w.id === "probezeit")!.tage;
  const plan = erzeugePlan({ id: "ablauf", art: "eintritt", person: personAus(e, d), stichtag: d, erstellt: heute, probezeitMonate: pm, land: e.bundesland });
  const aus = ausPlan({ ...plan, aufgaben: plan.aufgaben.filter((a) => ["checkin-30", "checkin-90", "probezeit"].includes(a.id)) });
  const klein = e.beschaeftigte !== undefined && e.beschaeftigte <= WERTE.kschgSchwelle.wert;
  const nachKuendigung = addDays(ende, WERTE.probezeitKuendigungTage.wert);
  return {
    daten: { beginn: d, probezeit_ende: ende, ende_bei_kuendigung_am_letzten_tag: nachKuendigung },
    schritte: sortiere([
      ...aus,
      { was: "Geschäftsführung entscheidet: Person bleibt oder Kündigung in der Probezeit", bis: addDays(ende, -wf.entscheiden.wert), wer: GF },
      { was: "Nachfassen, falls noch nicht entschieden", bis: addDays(ende, -wf.eskalation.wert), wer: GF },
      { was: "Kündigung muss zugehen, spätestens am letzten Tag der Probezeit", bis: ende, wer: GF, pflicht: WERTE.probezeitKuendigungTage.quelle, register: ["probezeitKuendigungTage", "probezeitHoechstMonate"],
        hinweis: `Dann endet das Arbeitsverhältnis ${WERTE.probezeitKuendigungTage.wert} Tage nach Zugang, bei Zugang am letzten Tag am ${formatDE(nachKuendigung)}. Fällt der Tag aufs Wochenende, übergib die Kündigung vorher persönlich, das Ende der Probezeit verschiebt sich nicht. Schriftform nach § 623 BGB.` },
      { was: "Wartezeit des Kündigungsschutzgesetzes endet", bis: zeitraumEnde(d, WERTE.kschgWartezeitMonate.wert), wer: GF, pflicht: WERTE.kschgWartezeitMonate.quelle, register: ["kschgWartezeitMonate"],
        hinweis: klein ? "Mit 10 oder weniger Beschäftigten gilt das Kündigungsschutzgesetz nicht (§ 23 Abs. 1 KSchG)." : "Danach braucht eine Kündigung bei mehr als 10 Beschäftigten einen Grund nach § 1 KSchG." },
    ]),
    fallen: [...(e.probezeit_monate! > pm ? [`Die kurze Frist gilt höchstens ${pm} Monate (${WERTE.probezeitHoechstMonate.quelle}). Gerechnet mit ${pm} Monaten.`] : [])],
    weiter: ["Probezeit im Detail: probezeit.", "Vor einer Kündigung: sonderkuendigungsschutz_check, kuendigungsschreiben, kuendigung_pflichtangaben.", merken],
  };
}

function befristungEnde(e: E, heute: string, ende: string): Ergebnis {
  return {
    daten: { ende },
    schritte: sortiere([
      { was: "Entscheiden: verlängern, entfristen oder enden lassen", bis: addDays(ende, -WERTE.befristungVorlaufTage.wert), wer: GF, register: ["befristungVorlaufTage", "befristungSachgrundlosMonate", "befristungVerlaengerungenMax"],
        hinweis: `Ohne Sachgrund höchstens ${WERTE.befristungSachgrundlosMonate.wert} Monate und ${WERTE.befristungVerlaengerungenMax.wert} Verlängerungen (§ 14 Abs. 2 Satz 1 TzBfG). Eine Verlängerung vor dem Ende schriftlich vereinbaren (§ 14 Abs. 4 TzBfG).` },
      ...austrittPlan(e, heute, ende, "befristung", null),
    ]),
    fallen: ["Arbeitet die Person nach dem letzten Tag mit deinem Wissen weiter und widersprichst du nicht unverzüglich, gilt der Vertrag als unbefristet (§ 15 Abs. 6 TzBfG)."],
    weiter: ["Befristung prüfen: befristung.", "Resturlaub in Geld: urlaubsabgeltung.", "Zeugnis: arbeitszeugnis.", merken],
  };
}

function monatsendeLohn(e: E, _heute: string, d: string): Ergebnis {
  const m = monatsende(d), n = addDays(m, 1);
  const wf = WORKFLOWS.find((w) => w.id === "lohn-stichtag")!.tage;
  const t = e.abgabetag;
  const input: Intern[] = t
    ? [{ was: "Führungskräfte melden Änderungen ihres Teams: Urlaub, Krankheit, Stunden", bis: addDays(t, -wf.vorlauf.wert), wer: WER.fuehrung },
       { was: "Lohn-Input prüfen: Eintritte, Austritte, Krankheit, Urlaub, Stunden, Einmalzahlungen", bis: addDays(t, -wf.pruefen.wert), wer: GF },
       { was: "Lohn-Input an das Lohnbüro geben", bis: t, wer: GF }]
    : [{ was: "Lohn-Input an das Lohnbüro geben: Eintritte, Austritte, Krankheit, Urlaub, Stunden, Einmalzahlungen", bis: null, wer: GF, hinweis: "Den Abgabetag legt dein Lohnbüro fest. Mit der Angabe abgabetag rechnet der Ablauf Erinnerung und Prüfung." }];
  const aenderungen: Intern[] = ["mindestlohn", "minijobGrenze"].flatMap((id) => {
    const x = REGISTER.find((r) => r.id === id)!, a = wertAm(x, m), b = wertAm(x, n);
    return a && b && a.wert !== b.wert ? [{ was: `${x.titel}: ab ${formatDE(n)} ${b.wert} statt ${a.wert}. Verträge und Stunden prüfen`, bis: m, wer: GF, pflicht: x.norm, register: [id] }] : [];
  });
  return {
    daten: { monat: d.slice(0, 7), monatsende: m },
    schritte: [
      ...input,
      { was: "Beitragsnachweis an die Krankenkassen senden (über das Lohnbüro)", bis: null, wer: LB, pflicht: "§ 28f Abs. 3 Satz 1 SGB IV", hinweis: "Zwei Arbeitstage vor Fälligkeit der Beiträge." },
      { was: "Beiträge zur Sozialversicherung zahlen", bis: null, wer: GF, pflicht: "§ 23 Abs. 1 Satz 2 SGB IV",
        hinweis: "Fällig in voraussichtlicher Höhe am drittletzten Bankarbeitstag des Monats, der Rest im Folgemonat. Du darfst auch den Betrag des Vormonats zahlen (§ 23 Abs. 1 Satz 3 SGB IV)." },
      { was: "U1 und U2: Erstattung beantragen, falls jemand krank oder im Mutterschutz war", bis: null, wer: LB, pflicht: "§ 2 Abs. 2 AAG", hinweis: "Erstattet wird nur auf Antrag, nachdem der Lohn gezahlt ist." },
      ...aenderungen,
      ...(e.beschaeftigungsart === "minijob" ? [{ was: "Arbeitszeit aufzeichnen: Beginn, Ende und Dauer, für den letzten Tag des Monats spätestens an diesem Tag", bis: addDays(m, WERTE.milogAufzeichnung.tage), wer: GF, pflicht: WERTE.milogAufzeichnung.quelle, register: ["milogAufzeichnung"],
        hinweis: `Für jeden Arbeitstag gilt: bis zum ${WERTE.milogAufzeichnung.tage}. Kalendertag danach. Aufbewahren ${WERTE.milogAufzeichnung.jahre} Jahre.` }] : []),
      { was: "Lohnsteuer anmelden und abführen (über das Lohnbüro)", bis: null, wer: LB, pflicht: "§ 41a Abs. 1 EStG",
        hinweis: "Spätestens am 10. Tag nach Ende des Anmeldungszeitraums. Der Zeitraum ist Monat, Vierteljahr oder Jahr, je nach Lohnsteuer des Vorjahres (§ 41a Abs. 2 EStG)." },
    ],
    fallen: [
      "Den genauen Tag der Beiträge und des Beitragsnachweises nennt der Fälligkeitskalender deiner Krankenkasse oder das Lohnbüro. Bankarbeitstage rechnet dieser Ablauf nicht.",
      `Zu spät gezahlte Beiträge kosten ${WERTE.saeumniszuschlagMonat.wert * 100} Prozent Säumniszuschlag je angefangenem Monat (${quelleOhne(WERTE.saeumniszuschlagMonat.quelle)}).`,
    ],
    weiter: ["Kosten je Person: arbeitgeberkosten.", "Stundenlohn prüfen: mindestlohn_check.", "Erstattung bei Krankheit: entgeltfortzahlung.", merken],
  };
}

const ABLAEUFE: Record<Art, (e: E, heute: string, d: string) => Ergebnis> = {
  erste_einstellung: ersteEinstellung, eintritt, austritt, krankheit, mutterschutz, elternzeit,
  kuendigung_vorbereiten: kuendigungVorbereiten, probezeit_ende: probezeitEndeAblauf, befristung_ende: befristungEnde, monatsende_lohn: monatsendeLohn,
};

/** Rechnet einen Ablauf. Fehlt eine Pflichtangabe, ist das ein Fehler, der sie nennt, statt zu raten. Schritte mit bis vor heute sind überfällig. */
function rechne(e: E, heute: string) {
  const a = ARTEN[e.art];
  const fehlt = a.pflicht.filter((k) => e[k as keyof E] === undefined);
  if (fehlt.length) return fehler(`Für ablauf mit art ${e.art} fehlt: ${fehlt.join(", ")}. datum bedeutet hier: ${a.datum}.`);
  const r = ABLAEUFE[e.art](e, heute, e.datum!);
  const schritte: Schritt[] = r.schritte.map(({ register: _r, ab: _a, ...s }) => ({ ...s, bis: s.bis ?? null, ...(s.bis && s.bis < heute ? { ueberfaellig: true as const } : {}) }));
  const quellen: Quelle[] = r.schritte.flatMap((s) => [...(s.register ?? []).map((id) => registerQuelle(id, heute)), ...normenAus(s.pflicht ?? "").map((n) => normQuelle(n))]);
  return { r, a, schritte, quellen };
}

const ablauf: Werkzeug = {
  name: "ablauf",
  titel: "HR-Ablauf mit Daten",
  beschreibung:
    "German employment law, Germany only: a complete HR workflow (Ablauf) with dates, roles and legal norms for a situation, e.g. first hire (erste Einstellung), onboarding (Eintritt), leaving (Austritt), sick employee (Krankheit, Entgeltfortzahlung, U1, BEM), pregnancy (Mutterschutz), parental leave (Elternzeit), preparing a dismissal (Kündigung), end of probation, end of a fixed-term contract, monthly payroll (Lohn). Use it when a founder describes a situation such as a first hire, a sick employee, a pregnancy or a planned dismissal. Takes only dates, numbers and choices, never names.",
  eingabe: schema({
    art: text("Which workflow", { enum: ART_IDS }),
    datum: datum(`Anchor date, meaning per art: ${ART_IDS.map((k) => `${k} = ${ARTEN[k].datum}`).join("; ")}`),
    beschaeftigungsart: text("Type of employment (Beschäftigungsart)", { enum: ["vollzeit", "teilzeit", "werkstudent", "azubi", "minijob", "praktikum"] }),
    befristet: janein("Fixed-term contract (befristet), eintritt and erste_einstellung"),
    probezeit_monate: ganzzahl("Agreed probation in whole months (Probezeit), required for probezeit_ende", 0, 12),
    branche_sofortmeldung: text("Sector with immediate registration duty (Sofortmeldung, § 28a Abs. 4 SGB IV) or keine", { enum: [...SOFORTMELDUNG_BEREICHE.map((b) => b.id), "keine"] }),
    drittstaat: janein("Person needs a residence and work permit (Drittstaat)"),
    grund: text("Reason for leaving (Austrittsgrund), required for austritt; arbeitgeber = dismissal by the company", { enum: Object.keys(GRUND_TEXT) }),
    zugang: datum("Day the notice or termination agreement was received (Zugang), austritt"),
    wettbewerbsverbot: janein("Contract has a post-contractual non-compete or customer protection clause (austritt, befristung_ende, kuendigung_vorbereiten)"),
    sonderkuendigungsschutz: janein("Person is pregnant, on parental leave or severely disabled (austritt with dismissal)"),
    eintritt: datum("First working day of the person, for krankheit (waiting period) and kuendigung_vorbereiten (notice period)"),
    nach_drittem_geburtstag: janein("Parental leave lies between the 3rd and 8th birthday of the child (elternzeit)"),
    abgabetag: datum("Day the payroll input is due at the payroll office (monatsende_lohn)"),
    beschaeftigte: zahl("Employees in the business, part-time pro rata, apprentices not counted", 0, 100000),
    betriebsrat: janein("A works council (Betriebsrat) exists"),
    bundesland: text("Federal state of the company for public holidays (Bundesland), e.g. HE", { enum: LAENDER }),
  }, ["art"]),
  baender: (e) => ({
    ...(e.beschaeftigte !== undefined ? { groesse: e.beschaeftigte as number } : {}),
    ...(e.beschaeftigungsart ? { art: e.beschaeftigungsart as string } : {}),
    ...(e.bundesland ? { land: e.bundesland as string } : {}),
    ablauf: e.art as string,
  }),
  ausfuehren(roh, heute) {
    const e = { ...roh, branche_sofortmeldung: roh.branche_sofortmeldung === "keine" ? undefined : roh.branche_sofortmeldung } as unknown as E;
    const x = rechne(e, heute);
    const vorbei = x.schritte.filter((s) => s.ueberfaellig).length;
    return antwort({
      ergebnis: { art: e.art, titel: x.a.titel, datum_bedeutet: x.a.datum, ...x.r.daten, schritte: x.schritte },
      quellen: x.quellen,
      fallen: [
        ...(vorbei ? [`${vorbei === 1 ? "1 Schritt liegt" : `${vorbei} Schritte liegen`} mit bis vor heute (ueberfaellig): sofort erledigen oder prüfen, ob schon erledigt.`] : []),
        ...(x.r.fallen ?? []), BIS_HINWEIS,
      ],
      naechster_schritt: x.r.weiter,
    }, heute);
  },
};

/* ---------- Workflow-Vorlagen der Werkbank ---------- */

const workflow_vorlage: Werkzeug = {
  name: "workflow_vorlage",
  titel: "HR-Workflow",
  beschreibung:
    `German employment law, Germany only: ${WORKFLOWS.length} follow-up workflows for HR tasks (HR-Workflows), e.g. payroll input deadline, missing onboarding documents, sick leave with eAU and BEM, maternity protection, probation decision, fixed-term contract signed before start. Each shows the chain 'when ... then ...' with default days and roles. Use it as a template for your own reminders. Without kennung it lists all.`,
  eingabe: schema({ kennung: text("Key of the workflow, leave out for the list", { enum: WORKFLOWS.map((w) => w.id) }) }),
  ausfuehren(e, heute) {
    const w = WORKFLOWS.find((x) => x.id === e.kennung);
    if (!w) return antwort({ ergebnis: { workflows: WORKFLOWS.map((x) => ({ kennung: x.id, name: x.name, nutzen: x.nutzen })) }, naechster_schritt: ["Mit kennung gibt es die Kette mit Tagen und Rollen."] }, heute);
    const tage = Object.fromEntries(Object.entries(w.tage).map(([k, t]) => [k, t.wert]));
    return antwort({
      ergebnis: {
        kennung: w.id, name: w.name, nutzen: w.nutzen,
        // „Erinnerung in Mein Lintelly“ gibt es ohne Lintelly-Konto nicht: hier nur „Erinnerung“ (Werkbank 28.10.2026).
        kette: kette(w, tage).map((k) => ({ ...k, dann: k.dann.map((d) => d.replace(" in Mein Lintelly", "")) })),
        tage: Object.values(w.tage).map((t) => ({ was: t.label, standard: t.wert })),
        ...(w.gesundheit ? { vertraulich: "Gesundheit: Aufgaben nur für die Person, die das Personal macht, keine Mitteilung an Führungskräfte." } : {}),
        einordnung: "Nimm die Kette als Vorlage für deinen eigenen Ablauf, zum Beispiel mit Erinnerungen im Kalender.",
      },
      naechster_schritt: ["Daten für einen konkreten Fall: ablauf.", merken],
    }, heute);
  },
};

export const ABLAUF: Werkzeug[] = [ablauf, workflow_vorlage];

/* ---------- Vorlagen als Markdown (Ressourcen), aus denselben Daten ---------- */

/** Beispiel-Eingaben je Art, relativ zu heute. */
function beispiel(art: Art, heute: string): E {
  const naechster = addDays(monatsende(heute), 1);
  const b: Record<Art, Omit<E, "art">> = {
    erste_einstellung: { datum: naechster, beschaeftigungsart: "teilzeit", probezeit_monate: 6 },
    eintritt: { datum: naechster, beschaeftigungsart: "vollzeit", probezeit_monate: 6 },
    austritt: { datum: monatsende(heute, 2), grund: "arbeitgeber", zugang: heute },
    krankheit: { datum: heute },
    mutterschutz: { datum: addMonths(heute, 5) },
    elternzeit: { datum: addMonths(heute, 4) },
    kuendigung_vorbereiten: { datum: heute, eintritt: addMonths(heute, -24), beschaeftigte: 6 },
    probezeit_ende: { datum: naechster, probezeit_monate: 6 },
    befristung_ende: { datum: monatsende(heute, 6) },
    monatsende_lohn: { datum: heute },
  };
  return { art, ...b[art] };
}

const ohnePunkt = (s: string) => s.replace(/\.$/, "");

export const ABLAUF_VORLAGEN: { art: string; titel: string; markdown: (heute: string) => string }[] = ART_IDS.map((art) => ({
  art,
  titel: ARTEN[art].titel,
  markdown(heute: string) {
    const e = beispiel(art, heute);
    const x = rechne(e, heute);
    const zeilen = x.schritte.map((s) => `- **${s.bis ? formatDE(s.bis) : "ohne festen Tag"}**${s.ueberfaellig ? " (überfällig)" : ""}: ${ohnePunkt(s.was)}. Wer: ${s.wer}.${s.pflicht ? ` Norm: ${ohnePunkt(s.pflicht)}.` : ""}${s.hinweis ? ` ${s.hinweis}` : ""}`);
    return [
      `# ${ARTEN[art].titel}`, "", ARTEN[art].wofuer, "", `Beispiel mit ${ARTEN[art].datum} am ${formatDE(e.datum!)}. Die Schritte stehen in zeitlicher Reihenfolge.`, "",
      ...zeilen, "", ...(x.r.fallen ?? []).map((f) => `Achtung: ${f}`), "",
      "Allgemeine Auskunft, keine Rechtsberatung im Einzelfall. Quelle: Lintelly, lintelly.com (CC BY 4.0)", "",
    ].join("\n");
  },
}));
