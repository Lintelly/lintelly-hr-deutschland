/**
 * Kündigungsfristen nach § 622 BGB mit Fristberechnung nach §§ 187, 188 BGB.
 *
 * Reine Funktionen ohne Seiteneffekte, nutzbar im Browser und auf dem Server.
 * Genutzt von: components/tools/kuendigungsfrist-rechner.tsx (Batch 1),
 * components/tools/kuendigungsschreiben-generator.tsx (Batch 4), probezeit-rechner (Batch 2).
 *
 * Datumswerte sind ISO-Strings "JJJJ-MM-TT" ohne Uhrzeit. Intern wird in UTC gerechnet,
 * damit Sommerzeit und Zeitzonen keine Tage verschieben.
 *
 * Stand: 04.10.2026. § 622 Abs. 2 Satz 2 BGB (Jahre vor dem 25. Lebensjahr zählen nicht)
 * ist seit 01.01.2019 aufgehoben, alle Beschäftigungsjahre zählen.
 * § 193 BGB (Verschiebung auf den nächsten Werktag) gilt für Kündigungsfristen nicht.
 */

import { FEIERTAGE, feiertagGiltIm, fristText, jahreTextDativ, monateText, WERTE, type FeiertagRegel } from "./werte";

/** Datum als "JJJJ-MM-TT". */
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Datumshilfen                                                        */
/* ------------------------------------------------------------------ */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** true, wenn der String ein gültiges Kalenderdatum "JJJJ-MM-TT" ist (z. B. kein 31.04.). */
export function isISODate(s: string | null | undefined): s is ISODate {
  if (!s) return false;
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

/** Schaltjahr nach gregorianischem Kalender. */
export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Anzahl der Tage im Monat (Monat 1 bis 12). */
export function daysInMonth(y: number, m: number): number {
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/** Zerlegt ein ISO-Datum in Jahr, Monat (1 bis 12), Tag. */
export function parts(d: ISODate): { y: number; m: number; d: number } {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, d: day };
}

/** Baut ein ISO-Datum. Monat darf über- oder unterlaufen (13 = Januar Folgejahr), der Tag muss passen. */
export function iso(y: number, m: number, d: number): ISODate {
  const yy = y + Math.floor((m - 1) / 12);
  const mm = ((((m - 1) % 12) + 12) % 12) + 1;
  return `${String(yy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function toUTC(d: ISODate): number {
  const p = parts(d);
  return Date.UTC(p.y, p.m - 1, p.d);
}
function fromUTC(t: number): ISODate {
  const x = new Date(t);
  return iso(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
}

/** Addiert Kalendertage (auch negativ). */
export function addDays(d: ISODate, n: number): ISODate {
  return fromUTC(toUTC(d) + n * 86_400_000);
}

/** Tage von a bis b (b minus a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

/** Vergleich für sort(): negativ, wenn a vor b liegt. */
export function compare(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Letzter Tag des Monats, in dem d liegt, verschoben um `offset` Monate. */
export function monatsende(d: ISODate, offset = 0): ISODate {
  const p = parts(d);
  const first = iso(p.y, p.m + offset, 1);
  const q = parts(first);
  return iso(q.y, q.m, daysInMonth(q.y, q.m));
}

/** Letzter Tag des Kalenderquartals (31.03., 30.06., 30.09., 31.12.), in dem d liegt. */
export function quartalsende(d: ISODate): ISODate {
  const p = parts(d);
  const qm = Math.ceil(p.m / 3) * 3;
  return iso(p.y, qm, daysInMonth(p.y, qm));
}

/**
 * Addiert Monate und kappt auf den Monatsletzten, wenn es den Tag nicht gibt (§ 188 Abs. 3 BGB).
 * 31.01. + 1 Monat = 28.02. bzw. 29.02. im Schaltjahr.
 */
export function addMonths(d: ISODate, n: number): ISODate {
  const p = parts(d);
  const first = parts(iso(p.y, p.m + n, 1));
  return iso(first.y, first.m, Math.min(p.d, daysInMonth(first.y, first.m)));
}

/** Wochentag 0 = Sonntag bis 6 = Samstag. */
export function wochentag(d: ISODate): number {
  return new Date(toUTC(d)).getUTCDay();
}

const WT = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/** "TT.MM.JJJJ" */
export function formatDE(d: ISODate): string {
  const p = parts(d);
  return `${String(p.d).padStart(2, "0")}.${String(p.m).padStart(2, "0")}.${p.y}`;
}

/** "Freitag, 31.10.2026" */
export function formatDELang(d: ISODate): string {
  return `${WT[wochentag(d)]}, ${formatDE(d)}`;
}

/** Ostersonntag (gregorianisch, Gauß/Meeus). */
export function ostersonntag(y: number): ISODate {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(y, monat, tag);
}

/**
 * Name des bundesweiten gesetzlichen Feiertags oder null. Landesfeiertage (z. B. Fronleichnam,
 * Reformationstag, Allerheiligen) fehlen bewusst, weil sie vom Bundesland abhängen.
 */
export function bundesFeiertag(d: ISODate): string | null {
  return feiertagAus(FEIERTAGE.bund.tage, d);
}

/** Name des Feiertags aus einer Liste des Registers (fest oder ab Ostersonntag), sonst null. */
function feiertagAus(tage: readonly FeiertagRegel[], d: ISODate): string | null {
  const y = parts(d).y;
  return tage.find((t) => feiertagGiltIm(t, y) && feiertagDatum(t, y) === d)?.name ?? null;
}

/** Datum eines Feiertags im Jahr y. Buß- und Bettag: der Mittwoch vor dem 23. November. */
function feiertagDatum(t: FeiertagRegel, y: number): ISODate {
  if (t.fest) return iso(y, t.fest[0], t.fest[1]);
  if (t.bettag) { const d = iso(y, 11, 22); return addDays(d, -((wochentag(d) + 4) % 7)); } // kein-recht: Kalender, 22.11. zurück bis Mittwoch
  return addDays(ostersonntag(y), t.ostern ?? 0);
}

/**
 * Gesetzliche Feiertage je Bundesland (alle 16, Bayern in drei Gebieten), jeweils mit amtlicher Quelle. Die Tage stehen im Register
 * (FEIERTAGE in lib/regeln/werte.ts), hier werden sie für ein Jahr ausgerechnet. Ein Rückfall auf ein Standardland gibt es nicht:
 * fehlt das Land der Firma, ist es ein Pflichtfeld (lib/db.ts `bundesland`).
 */
export type Bundesland = keyof typeof FEIERTAGE.laender;
export const BUNDESLAENDER = Object.fromEntries((Object.keys(FEIERTAGE.laender) as Bundesland[]).map((l) => [l, land(l)])) as Record<Bundesland, ReturnType<typeof land>>;
function land(l: Bundesland) {
  const { name, quelle, url, tage } = FEIERTAGE.laender[l];
  return { name, quelle, url, zusaetzlich: (y: number) => tage.filter((t) => feiertagGiltIm(t, y)).map((t) => ({ datum: feiertagDatum(t, y), name: t.name })) };
}
/** Land der Demo-Firma Nordhang (Sitz Frankfurt am Main). Nur die Demo nutzt es, im Echtbetrieb gibt es keinen Rückfall. */
export const DEMO_BUNDESLAND: Bundesland = "HE";
export const istBundesland = (s: string | null | undefined): s is Bundesland => !!s && Object.hasOwn(BUNDESLAENDER, s);

/** Name des gesetzlichen Feiertags in diesem Bundesland oder null. */
export function feiertagIn(d: ISODate, land: Bundesland): string | null {
  const y = parts(d).y;
  const k = `${land}${y}`;
  let jahr = feiertageCache.get(k);
  if (!jahr) {
    jahr = new Map(BUNDESLAENDER[land].zusaetzlich(y).map((x) => [x.datum, x.name]));
    for (const t of FEIERTAGE.bund.tage) jahr.set(feiertagDatum(t, y), t.name);
    feiertageCache.set(k, jahr);
  }
  return jahr.get(d) ?? null;
}
/**
 * Letzter Tag einer Frist von `tage` Tagen ab `am`. Fällt er auf Wochenende oder Feiertag, endet sie am nächsten Werktag (§ 193 BGB, § 222 Abs. 2 ZPO).
 * Ohne Land zählen die bundesweiten Feiertage (Prüffund T-20).
 */
export function fristEndeWerktag(am: ISODate, tage: number, land?: Bundesland): ISODate {
  let ende = addDays(am, tage);
  while (wochentag(ende) === 0 || wochentag(ende) === 6 || istFeiertag(ende, land)) ende = addDays(ende, 1);
  return ende;
}
/** Feiertag im Land, ohne Land nur die bundesweiten (Echtbetrieb ohne eingetragenes Bundesland, Prüffund T-3). */
export const istFeiertag = (d: ISODate, land?: Bundesland) => (land ? !!feiertagIn(d, land) : FEIERTAGE.bund.tage.some((t) => feiertagDatum(t, parts(d).y) === d));
/** Feiertage je Land und Jahr, einmal ausgerechnet (die Krankenquote fragt jeden Tag einzeln). */
const feiertageCache = new Map<string, Map<ISODate, string>>();

/* ------------------------------------------------------------------ */
/* Fristberechnung §§ 187, 188 BGB                                     */
/* ------------------------------------------------------------------ */

/**
 * Ende einer Ereignisfrist (§ 187 Abs. 1 BGB): der Zugangstag zählt nicht mit.
 * Eine Frist von n Monaten endet mit dem Tag, der durch seine Zahl dem Zugangstag entspricht
 * (§ 188 Abs. 2 BGB), fehlt er, am Monatsletzten (§ 188 Abs. 3 BGB).
 */
export function fristendeMonate(zugang: ISODate, monate: number): ISODate {
  return addMonths(zugang, monate);
}

/** Ende einer Ereignisfrist in Tagen bzw. Wochen (Wochen × 7). Zugang Mittwoch + 4 Wochen = Mittwoch. */
export function fristendeTage(zugang: ISODate, tage: number): ISODate {
  return addDays(zugang, tage);
}

/**
 * Letzter Tag eines Zeitraums, der mit dem Beginn eines Tages anfängt (§ 187 Abs. 2 BGB),
 * z. B. Probezeit oder Wartezeit ab Arbeitsbeginn.
 * Eintritt 01.04. + 6 Monate = 30.09.; Eintritt 15.04. = 14.10.; Eintritt 31.08. = 28.02. (§ 188 Abs. 3).
 */
export function zeitraumEnde(beginn: ISODate, monate: number): ISODate {
  const p = parts(beginn);
  const ziel = parts(iso(p.y, p.m + monate, 1));
  const dim = daysInMonth(ziel.y, ziel.m);
  if (p.d > dim) return iso(ziel.y, ziel.m, dim);
  return addDays(iso(ziel.y, ziel.m, p.d), -1);
}

/**
 * Letzter Tag einer Rückwärtsfrist "spätestens n Monate oder Wochen vor Beginn" (§ 8 Abs. 2 und 5 TzBfG, auch mit § 9a Abs. 3,
 * § 2a Abs. 1 FPfZG, § 16 Abs. 1 BEEG, § 5 Abs. 1 HBUG). §§ 187 Abs. 1, 188 Abs. 2 BGB rückwärts gelesen: der Tag des Beginns zählt
 * nicht mit, vor ihm müssen die vollen n Monate oder Wochen liegen. Erklärung oder Antwort muss also am Tag vor dem gleich benannten Tag
 * zugehen, Beginn 01.07. und drei Monate: bis 31.03. Die Fiktion nach Schweigen gilt ab dem Tag danach. Vorsichtige Lesart, damit eine
 * Ablehnung nie zu spät kommt. Kanzlei bestätigen.
 */
export function spaetestensVor(beginn: ISODate, n: { monate: number } | { wochen: number }): ISODate {
  return addDays("monate" in n ? addMonths(beginn, -n.monate) : addDays(beginn, -n.wochen * 7), -1);
}

/** Letzter Tag der Probezeit. Gesetzlich zählt für § 622 Abs. 3 BGB höchstens 6 Monate. */
export function probezeitEnde(eintritt: ISODate, monate: number): ISODate {
  return zeitraumEnde(eintritt, monate);
}

/** Volle Monate zwischen Beginn und letztem Tag (einschließlich), z. B. 11.11.2024 bis 10.11.2026 ergibt 24. */
export function laufzeitMonate(von: ISODate, bis: ISODate): number {
  const a = parts(von), b = parts(addDays(bis, 1));
  return Math.max(0, (b.y - a.y) * 12 + (b.m - a.m) - (b.d < a.d ? 1 : 0));
}

/**
 * Volle Beschäftigungsjahre am Stichtag. Ein Jahr ist voll, wenn der Stichtag am oder nach
 * dem Jahrestag des Eintritts liegt (Eintritt 01.10.2024: 2 volle Jahre ab 01.10.2026).
 * Eintritt am 29.02.: Jahrestag in Nicht-Schaltjahren ist der 01.03.
 */
export function volleJahre(eintritt: ISODate, stichtag: ISODate): number {
  if (compare(stichtag, eintritt) < 0) return 0;
  const e = parts(eintritt);
  const s = parts(stichtag);
  let j = s.y - e.y;
  if (jahrestag(eintritt, j) > stichtag) j -= 1;
  return Math.max(0, j);
}

/** Datum, an dem `jahre` volle Beschäftigungsjahre erreicht sind. */
export function jahrestag(eintritt: ISODate, jahre: number): ISODate {
  const e = parts(eintritt);
  const y = e.y + jahre;
  if (e.m === 2 && e.d === 29 && !isLeapYear(y)) return iso(y, 3, 1); // kein-recht: Kalender, 29.02. im Nichtschaltjahr
  return iso(y, e.m, e.d);
}

/* ------------------------------------------------------------------ */
/* § 622 BGB                                                           */
/* ------------------------------------------------------------------ */

/** Staffel nach § 622 Abs. 2 BGB: ab `jahre` Beschäftigungsjahren `monate` Monate zum Monatsende. */
export const STAFFEL_622: readonly { jahre: number; monate: number }[] = WERTE.kuendigungsStaffel.stufen;

/** Monate Kündigungsfrist nach Staffel für volle Beschäftigungsjahre, 0 unter 2 Jahren. */
export function staffelMonate(jahre: number): number {
  let m = 0;
  for (const s of STAFFEL_622) if (jahre >= s.jahre) m = s.monate;
  return m;
}

/** Wer kündigt. */
export type Kuendigender = "arbeitgeber" | "arbeitnehmer";

/** Zu welchen Terminen eine Frist enden darf. */
export type Termin = "beliebig" | "15-oder-monatsende" | "monatsende" | "quartalsende";

/** Eine angewandte Fristregel. Genau eins von `tage` und `monate` ist gesetzt. */
export type FristRegel = {
  art: "probezeit" | "grundfrist" | "kleinbetrieb" | "staffel" | "vertrag";
  /** z. B. "4 Wochen zum 15. oder zum Monatsende" */
  label: string;
  /** z. B. "§ 622 Abs. 1 BGB" */
  quelle: string;
  tage?: number;
  monate?: number;
  termin: Termin;
};

/** Vertraglich vereinbarte längere Frist, z. B. 3 Monate zum Quartalsende. */
export type VertragsFrist = { monate: number; termin: "monatsende" | "quartalsende" };

export type KuendigungsEingabe = {
  /** erster Tag des Arbeitsverhältnisses (Ausbildung im selben Betrieb zählt mit) */
  eintritt: ISODate;
  /** Tag, an dem die Kündigung zugeht (nicht das Datum des Schreibens) */
  zugang: ISODate;
  /** Standard: arbeitgeber */
  kuendigender?: Kuendigender;
  /** vereinbarte Probezeit in Monaten, 0 oder leer = keine */
  probezeitMonate?: number;
  /** § 622 Abs. 5 Nr. 2 BGB: höchstens 20 Beschäftigte und vertraglich 4 Wochen ohne festen Termin vereinbart */
  kleinbetriebVierWochen?: boolean;
  /** längere vertragliche Frist, gilt dann auch in die andere Richtung (§ 622 Abs. 6 BGB) */
  vertrag?: VertragsFrist | null;
  /** Vertrag erstreckt die Staffel des Abs. 2 auch auf Kündigungen durch Arbeitnehmende */
  staffelAuchFuerArbeitnehmer?: boolean;
  /** ein Tarifvertrag gilt (Fristen können nach § 622 Abs. 4 BGB abweichen, hier nicht berechnet) */
  tarifvertrag?: boolean;
  /** Bundesland der Firma für die Feiertagswarnung. Ohne Angabe zählen nur bundesweite Feiertage. */
  bundesland?: Bundesland;
};

export type Hinweis = { typ: "info" | "warnung"; text: string };

/** Ein möglicher Beendigungstermin mit dem letzten Tag, an dem die Kündigung dafür zugehen muss. */
export type MoeglicherTermin = { termin: ISODate; spaetesterZugang: ISODate };

export type KuendigungsErgebnis = {
  /** Beendigungsdatum (letzter Tag des Arbeitsverhältnisses) */
  ende: ISODate;
  /** Tag, an dem die reine Frist abläuft, bevor auf den Termin aufgerundet wird */
  fristablauf: ISODate;
  /** angewandte (gewinnende) Regel */
  regel: FristRegel;
  /** gesetzliche Regel für diesen Fall */
  gesetzlich: FristRegel;
  /** Ende nach gesetzlicher Regel (zum Vergleich mit dem Vertrag) */
  endeGesetzlich: ISODate;
  /** Ende nach Vertrag, falls angegeben und anwendbar */
  endeVertrag?: ISODate;
  /** volle Beschäftigungsjahre am Zugangstag */
  jahre: number;
  inProbezeit: boolean;
  probezeitEnde?: ISODate;
  /** spätester Zugang, damit genau `ende` erreicht wird */
  spaetesterZugang: ISODate;
  /** `ende` und die nächsten Termine danach (bei Termin "beliebig" nur `ende`) */
  termine: MoeglicherTermin[];
  rechenweg: string[];
  hinweise: Hinweis[];
};

/** Erster zulässiger Termin am oder nach `ab` für die Terminart. */
export function naechsterTermin(ab: ISODate, termin: Termin): ISODate {
  if (termin === "beliebig") return ab;
  if (termin === "monatsende") return monatsende(ab);
  if (termin === "quartalsende") return quartalsende(ab);
  const p = parts(ab);
  const t = WERTE.grundkuendigungsfristTage.termin;
  return p.d <= t ? iso(p.y, p.m, t) : monatsende(ab);
}

/** Termin, der auf `termin` folgt (für Listen möglicher Termine). */
export function folgeTermin(termin: ISODate, art: Termin): ISODate {
  return naechsterTermin(addDays(termin, 1), art);
}

/** Tag, an dem die Frist der Regel abläuft, wenn die Kündigung am `zugang` zugeht. */
export function fristablauf(zugang: ISODate, regel: FristRegel): ISODate {
  return regel.monate ? fristendeMonate(zugang, regel.monate) : fristendeTage(zugang, regel.tage ?? 0);
}

/** Beendigungstermin für einen Zugangstag nach einer Regel. */
export function beendigung(zugang: ISODate, regel: FristRegel): ISODate {
  return naechsterTermin(fristablauf(zugang, regel), regel.termin);
}

/**
 * Spätester Zugangstag, damit das Arbeitsverhältnis zum `termin` endet.
 * Tage-Fristen: Termin minus Tage. Monats-Fristen: der späteste Tag, dessen Fristablauf
 * noch am oder vor dem Termin liegt (bei Termin Monatsende: Monatsletzter n Monate vorher).
 */
export function spaetesterZugangFuer(termin: ISODate, regel: FristRegel): ISODate {
  if (!regel.monate) return addDays(termin, -(regel.tage ?? 0));
  // Kandidat: gleicher Tag n Monate vorher; ist der Termin ein Monatsletzter, der Monatsletzte n Monate vorher.
  const t = parts(termin);
  const istMonatsletzter = t.d === daysInMonth(t.y, t.m);
  let kandidat = istMonatsletzter ? monatsende(termin, -regel.monate) : addMonths(termin, -regel.monate);
  // Sicherheitsnetz für Randfälle der Monatskappung.
  while (compare(fristendeMonate(addDays(kandidat, 1), regel.monate), termin) <= 0) kandidat = addDays(kandidat, 1);
  while (compare(fristendeMonate(kandidat, regel.monate), termin) > 0) kandidat = addDays(kandidat, -1);
  return kandidat;
}

/** Die nächsten `anzahl` möglichen Termine ab einem Zugangstag, jeweils mit spätestem Zugang. */
export function moeglicheTermine(zugang: ISODate, regel: FristRegel, anzahl = 3): MoeglicherTermin[] {
  const erster = beendigung(zugang, regel);
  if (regel.termin === "beliebig") return [{ termin: erster, spaetesterZugang: spaetesterZugangFuer(erster, regel) }];
  const out: MoeglicherTermin[] = [];
  let t = erster;
  for (let i = 0; i < anzahl; i++) {
    out.push({ termin: t, spaetesterZugang: spaetesterZugangFuer(t, regel) });
    t = folgeTermin(t, regel.termin);
  }
  return out;
}

const PROBEZEIT_TAGE = WERTE.probezeitKuendigungTage.wert, GRUND_TAGE = WERTE.grundkuendigungsfristTage.wert;
export const REGEL_PROBEZEIT: FristRegel = { art: "probezeit", label: `${fristText(PROBEZEIT_TAGE)} zu jedem Tag`, quelle: "§ 622 Abs. 3 BGB", tage: PROBEZEIT_TAGE, termin: "beliebig" };
export const REGEL_GRUNDFRIST: FristRegel = { art: "grundfrist", label: `${fristText(GRUND_TAGE)} zum ${WERTE.grundkuendigungsfristTage.termin}. oder zum Monatsende`, quelle: "§ 622 Abs. 1 BGB", tage: GRUND_TAGE, termin: "15-oder-monatsende" };
export const REGEL_KLEINBETRIEB: FristRegel = { art: "kleinbetrieb", label: `${fristText(WERTE.kleinbetriebKuendigung.tage)} zu jedem Tag`, quelle: "§ 622 Abs. 5 Satz 1 Nr. 2 BGB", tage: WERTE.kleinbetriebKuendigung.tage, termin: "beliebig" };

/** Regel der Staffel für n Monate. */
export function regelStaffel(monate: number): FristRegel {
  return { art: "staffel", label: `${monate} ${monate === 1 ? "Monat" : "Monate"} zum Monatsende`, quelle: "§ 622 Abs. 2 BGB", monate, termin: "monatsende" };
}

/** Regel aus einer vertraglichen Frist. */
export function regelVertrag(v: VertragsFrist): FristRegel {
  return {
    art: "vertrag",
    label: `${v.monate} ${v.monate === 1 ? "Monat" : "Monate"} zum ${v.termin === "quartalsende" ? "Quartalsende" : "Monatsende"}`,
    quelle: "Arbeitsvertrag",
    monate: v.monate,
    termin: v.termin,
  };
}

/** Gesetzliche Regel für den Fall ohne Probezeit. */
export function gesetzlicheRegel(jahre: number, kuendigender: Kuendigender, opts: { kleinbetriebVierWochen?: boolean; staffelAuchFuerArbeitnehmer?: boolean } = {}): FristRegel {
  const staffel = kuendigender === "arbeitgeber" || opts.staffelAuchFuerArbeitnehmer ? staffelMonate(jahre) : 0;
  if (staffel > 0) return regelStaffel(staffel);
  return opts.kleinbetriebVierWochen ? REGEL_KLEINBETRIEB : REGEL_GRUNDFRIST;
}

/**
 * Berechnet den Beendigungstermin einer ordentlichen Kündigung.
 *
 * - Probezeit (höchstens 6 Monate zählen): Zugang am oder vor dem letzten Probezeittag, 2 Wochen zu jedem Tag.
 * - Sonst Grundfrist 4 Wochen zum 15. oder Monatsende, im Kleinbetrieb mit Vereinbarung 4 Wochen zu jedem Tag.
 * - Arbeitgeberkündigung ab 2 vollen Jahren: Staffel 1 bis 7 Monate zum Monatsende.
 * - Vertragliche längere Frist: es gilt der spätere Termin.
 *
 * Wirft einen Error bei ungültigen Daten.
 */
export function berechneKuendigung(e: KuendigungsEingabe): KuendigungsErgebnis {
  if (!isISODate(e.eintritt)) throw new Error("Eintrittsdatum fehlt oder ist ungültig.");
  if (!isISODate(e.zugang)) throw new Error("Zugangsdatum fehlt oder ist ungültig.");
  const wer: Kuendigender = e.kuendigender ?? "arbeitgeber";
  const hinweise: Hinweis[] = [];
  const rechenweg: string[] = [];
  const vorAntritt = compare(e.zugang, e.eintritt) < 0;
  const jahre = volleJahre(e.eintritt, e.zugang);

  if (vorAntritt) {
    hinweise.push({ typ: "info", text: "Die Kündigung geht vor dem ersten Arbeitstag zu. Das ist möglich. Die Frist läuft in der Regel ab Zugang, nicht erst ab Arbeitsbeginn, sofern der Vertrag nichts anderes sagt." });
  }

  // Probezeit
  let pzMonate = Math.max(0, Math.floor(e.probezeitMonate ?? 0));
  const pzHoechst = WERTE.probezeitHoechstMonate.wert;
  if (pzMonate > pzHoechst) {
    hinweise.push({ typ: "warnung", text: `Vereinbart sind ${pzMonate} Monate Probezeit. Die verkürzte Frist von ${fristText(PROBEZEIT_TAGE)} gilt höchstens für ${monateText(pzHoechst)}. Gerechnet wird mit ${pzHoechst} Monaten.` });
    pzMonate = pzHoechst;
  }
  const pzEnde = pzMonate > 0 ? probezeitEnde(e.eintritt, pzMonate) : undefined;
  const inProbezeit = !!pzEnde && compare(e.zugang, pzEnde) <= 0;

  rechenweg.push(`Eintritt ${formatDE(e.eintritt)}, Zugang der Kündigung ${formatDE(e.zugang)}.`);
  rechenweg.push(vorAntritt ? "Betriebszugehörigkeit am Zugangstag: noch nicht begonnen." : `Betriebszugehörigkeit am Zugangstag: ${jahre} volle ${jahre === 1 ? "Jahr" : "Jahre"}.`);
  if (pzEnde) rechenweg.push(`Probezeit von ${pzMonate} ${pzMonate === 1 ? "Monat" : "Monaten"} endet am ${formatDE(pzEnde)}. Der Zugang liegt ${inProbezeit ? "innerhalb" : "nach"} der Probezeit.`);

  let gesetzlich: FristRegel;
  if (inProbezeit) {
    gesetzlich = REGEL_PROBEZEIT;
  } else {
    gesetzlich = gesetzlicheRegel(jahre, wer, e);
    if (e.kleinbetriebVierWochen && gesetzlich.art === "staffel") {
      hinweise.push({ typ: "info", text: `Die Kleinbetriebsregel verkürzt nur die Grundfrist. Ab ${jahreTextDativ(STAFFEL_622[0].jahre)} Betriebszugehörigkeit gilt für den Arbeitgeber trotzdem die Staffel nach § 622 Abs. 2 BGB.` });
    }
  }
  const ablaufG = fristablauf(e.zugang, gesetzlich);
  const endeG = naechsterTermin(ablaufG, gesetzlich.termin);
  rechenweg.push(`Gesetzliche Frist: ${gesetzlich.label} (${gesetzlich.quelle}).`);
  rechenweg.push(
    gesetzlich.termin === "beliebig"
      ? `Die Frist beginnt am Tag nach dem Zugang und endet am ${formatDE(ablaufG)}.`
      : `Die Frist beginnt am Tag nach dem Zugang und läuft am ${formatDE(ablaufG)} ab. Nächster zulässiger Termin: ${formatDE(endeG)}.`,
  );

  let regel = gesetzlich;
  let ende = endeG;
  let ablauf = ablaufG;
  let endeV: ISODate | undefined;
  if (e.vertrag && e.vertrag.monate > 0) {
    if (inProbezeit) {
      hinweise.push({ typ: "info", text: `Während der Probezeit gilt hier die Frist von ${fristText(PROBEZEIT_TAGE)}. Sieht dein Vertrag auch für die Probezeit eine längere Frist vor, gilt diese.` });
    } else {
      const rv = regelVertrag(e.vertrag);
      const ablaufV = fristablauf(e.zugang, rv);
      endeV = naechsterTermin(ablaufV, rv.termin);
      rechenweg.push(`Vertragliche Frist: ${rv.label}. Ende danach: ${formatDE(endeV)}.`);
      if (compare(endeV, endeG) > 0) {
        regel = rv;
        ende = endeV;
        ablauf = ablaufV;
        rechenweg.push("Der Vertrag führt zum späteren Termin und gilt deshalb.");
      } else if (compare(endeV, endeG) < 0) {
        rechenweg.push("Das Gesetz führt zum späteren Termin. Eine kürzere vertragliche Frist darf die gesetzliche nicht unterschreiten, es gilt das Gesetz.");
      } else {
        rechenweg.push("Gesetz und Vertrag führen zum selben Termin.");
      }
    }
  }

  // Hinweise
  if (e.tarifvertrag) {
    hinweise.push({ typ: "warnung", text: "Ein Tarifvertrag darf eigene Kündigungsfristen festlegen, auch kürzere (§ 622 Abs. 4 BGB). Dieses Ergebnis zeigt nur die gesetzliche und vertragliche Frist. Prüf die Fristen im Tarifvertrag." });
  }
  if (wer === "arbeitnehmer" && !inProbezeit) {
    hinweise.push({
      typ: "info",
      text: e.staffelAuchFuerArbeitnehmer
        ? "Laut Vertrag gilt die verlängerte Staffel auch für Kündigungen durch Mitarbeitende. Das ist zulässig, solange die Frist für Mitarbeitende nicht länger ist als die für den Arbeitgeber (§ 622 Abs. 6 BGB)."
        : `Für Kündigungen durch Mitarbeitende gilt gesetzlich nur die Grundfrist von ${fristText(GRUND_TAGE)}. Die längeren Fristen der Staffel gelten nur, wenn der Arbeitsvertrag sie auch für diese Richtung vorsieht.`,
    });
  }
  if (!vorAntritt && !inProbezeit && (wer === "arbeitgeber" || e.staffelAuchFuerArbeitnehmer)) {
    const naechste = STAFFEL_622.find((s) => s.jahre > jahre);
    if (naechste) {
      const stufe = jahrestag(e.eintritt, naechste.jahre);
      const tage = diffDays(e.zugang, stufe);
      if (tage > 0 && tage <= WERTE.staffelVorwarnungTage.wert) {
        hinweise.push({ typ: "warnung", text: `Am ${formatDE(stufe)} erreicht die Betriebszugehörigkeit ${naechste.jahre} Jahre. Geht die Kündigung erst an diesem Tag oder später zu, gilt eine Frist von ${naechste.monate} ${naechste.monate === 1 ? "Monat" : "Monaten"} zum Monatsende.` });
      }
    }
  }
  if (pzEnde && inProbezeit) {
    const rest = diffDays(e.zugang, pzEnde);
    if (rest <= 14) hinweise.push({ typ: "warnung", text: `Die Probezeit endet in ${rest === 0 ? "weniger als einem Tag" : rest === 1 ? "einem Tag" : rest + " Tagen"}. Es kommt auf den Zugang der Kündigung bis spätestens ${formatDE(pzEnde)} an, nicht auf das Ende der Frist.` });
  }
  const wt = wochentag(e.zugang);
  if (wt === 0) {
    hinweise.push({ typ: "warnung", text: "Der Zugangstag ist ein Sonntag. Briefkästen werden sonntags üblicherweise nicht geleert. Ein Einwurf gilt dann meist erst am Montag als zugegangen. Rechne lieber mit dem nächsten Werktag." });
  } else if (wt === 6) {
    hinweise.push({ typ: "info", text: "Der Zugangstag ist ein Samstag. Ein Einwurf in den Briefkasten zur üblichen Zustellzeit kann reichen. Am sichersten ist die persönliche Übergabe oder ein Bote, der den Einwurf bezeugt." });
  }
  const feiertag = e.bundesland ? feiertagIn(e.zugang, e.bundesland) : bundesFeiertag(e.zugang);
  if (feiertag && wt !== 0) {
    hinweise.push({ typ: "warnung", text: `Der Zugangstag ist ${e.bundesland ? `ein gesetzlicher Feiertag in ${BUNDESLAENDER[e.bundesland].name}` : "ein bundesweiter Feiertag"} (${feiertag}). An Feiertagen wird keine Post zugestellt und mit einem Blick in den Briefkasten muss niemand rechnen. Ein Einwurf gilt dann meist erst am nächsten Werktag als zugegangen. Übergib die Kündigung persönlich oder rechne mit dem nächsten Werktag.` });
  }
  hinweise.push({ typ: "info", text: "Fällt das Ende auf ein Wochenende oder einen Feiertag, verschiebt es sich nicht. § 193 BGB gilt für Kündigungsfristen nicht." });

  return {
    ende,
    fristablauf: ablauf,
    regel,
    gesetzlich,
    endeGesetzlich: endeG,
    endeVertrag: endeV,
    jahre,
    inProbezeit,
    probezeitEnde: pzEnde,
    spaetesterZugang: spaetesterZugangFuer(ende, regel),
    termine: moeglicheTermine(e.zugang, regel, 3),
    rechenweg,
    hinweise,
  };
}
