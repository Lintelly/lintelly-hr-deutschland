/**
 * Register aller Rechtswerte: zu jedem Wert aus lib/regeln/werte.ts stehen hier Titel, Rechtsgebiet, Norm, amtliche Fundstelle,
 * Gültigkeit, Prüfdatum, nächste Prüfung, Änderungsrhythmus und Status. Die Werte selbst stehen nur in werte.ts; das Register liest sie von dort.
 * Fehlt zu einem Wert in WERTE ein Eintrag hier, meldet der Typprüfer einen Fehler. Ablauf, Kalender und Freigabe: docs/rechtswerte.md.
 *
 * Status "bestätigt": Wert am Prüfdatum im amtlichen Wortlaut unter der Fundstelle gelesen. "Kanzlei prüfen": keine amtliche Fundstelle,
 * Wert nicht im Wortlaut gefunden, eigene Lintelly-Annahme oder in werte.ts als unbestätigt markiert. Keine Rechtsberatung.
 */
import {
  AUFBEWAHRUNG, AUFBEWAHRUNG_MODULE, AUSSTEHEND, BBG_KV_MONAT, DIENSTWAGEN_BATTERIEABZUG_BIS, DIENSTWAGEN_BRUCHTEIL, BBG_RV_MONAT, DRV_RECHENGROESSEN_2027, FAKTOR_F, FEIERTAGE, INSOLVENZGELDUMLAGE,
  MINDESTAUSBILDUNG, MINDESTLOHN, MINIJOB_AG_PAUSCHALE, MINIJOB_GRENZE, SACHBEZUG_MITTAG, SATZ_AV, SATZ_KV_PV, SATZ_RV_AV, WERTE, type FeiertagRegel, type ZeitWert,
} from "./werte";
import { anteil, euro, zahl as dezimal } from "@/lib/format";
import { BAG, EU_DSGVO, gii } from "./fundstellen";
import { addMonths } from "./datum";

export type Status = "bestätigt" | "Kanzlei prüfen";
/**
 * Warum ein Eintrag auf "Kanzlei prüfen" steht (bei "bestätigt" null). Von Hand gesetzt: Umrechnung, Aufbewahrung, Auslegung, Lintelly-Standard,
 * vorläufig, Link tot. Sonst abgeleitet: keine Quelle, Auslegung (k ohne eigenen Grund), Freigabe offen (Prüfdatum, aber werte.ts bestaetigt: false), nie geprüft.
 * Ändert den Status nicht, erklärt ihn nur (Texte fürs MCP und die Seite Rechtswerte: GRUND_TEXT).
 */
export type Grund = "Auslegung" | "Lintelly-Standard" | "Umrechnung" | "Aufbewahrung" | "vorläufig" | "keine Quelle" | "Freigabe offen" | "nie geprüft" | "Link tot";
export const GRUND_TEXT: Record<Grund, string> = {
  Auslegung: "Auslegung der Rechtsprechung oder des Gesetzes, Prüfung durch die Kanzlei offen",
  "Lintelly-Standard": "Lintelly-Standard, kein Gesetzeswert",
  Umrechnung: "Gesetz nennt einen anderen Bezug, Umrechnung durch Lintelly, Kanzlei prüft",
  Aufbewahrung: "Gesetz nennt keine feste Frist, die Kanzlei legt sie fest",
  vorläufig: "Wert für das Folgejahr noch nicht amtlich verkündet",
  "keine Quelle": "Keine amtliche Fundstelle",
  "Freigabe offen": "Wortlaut geprüft, Freigabe durch die Kanzlei offen",
  "nie geprüft": "Noch nicht im amtlichen Wortlaut geprüft",
  "Link tot": "Amtliche Fundstelle derzeit nicht erreichbar",
};
/** Wie sich ein Wert ändert: jährlich per Verordnung oder Bekanntmachung, per Gesetz, durch Urteile, durch Verwaltung (Rundschreiben, DGUV, ASR) oder durch eine Entscheidung von Lintelly. */
export type Rhythmus = "jährlich" | "Gesetz" | "Rechtsprechung" | "Verwaltung" | "Lintelly";
export type Gebiet =
  | "Kündigung und Vertrag" | "Befristung und Teilzeit" | "Urlaub" | "Krankheit und BEM" | "Mutterschutz und Elternzeit" | "Pflege"
  | "Arbeitszeit" | "Arbeitsschutz" | "Datenschutz und Hinweisgeber" | "Lohn und Sozialversicherung" | "Ausbildung und Werkstudium"
  | "Freelancer" | "Entgelttransparenz" | "Schwellenwerte" | "Aufbewahrung" | "Feiertage" | "Abläufe von Lintelly"
  | "Vergütung und Provision" | "Wettbewerb und Vertragsstrafe" | "Erfindungen und Urheberrecht";
/**
 * `ausstehend`: Folgejahr ohne amtlichen Wert, die Zeile nennt nur Quelle und erwarteten Termin (werte.ts AUSSTEHEND).
 * `rotAb`: eigener Tag, ab dem der ausstehende Wert als fehlend gilt, wenn die Bekanntgabe gesetzlich später kommt als der Prüftermin 15.11.
 */
export type Zeitwert = { gueltigAb: string | null; gueltigBis: string | null; wert: string; ausstehend?: true; rotAb?: string };
export type RegisterEintrag = {
  id: string; titel: string; gebiet: Gebiet; norm: string; quelleUrl: string | null; hinweis: string;
  /** Weitere amtliche Seiten, auf denen der Rest der Zahlen steht (die monatliche Prüfung sucht über alle Fundstellen). */
  weitereQuellen?: string[];
  /** Zahlen, die die Prüfung im Wortlaut sucht, wenn der Wert eine Summe ist (die Summe steht nirgends, die Teile schon). */
  pruefzahlen?: string[];
  werte: Zeitwert[]; rhythmus: Rhythmus; stichtag: string | null;
  geprueftAm: string | null; naechstePruefung: string; status: Status;
  /** Grund für "Kanzlei prüfen", bei "bestätigt" null. */
  grund: Grund | null;
};

/** Tag, an dem das Register angelegt wurde. Ohne Prüfdatum rechnet die nächste Prüfung ab hier. */
export const REGISTER_STAND = "2026-10-10";
/** Erlaubte Fundstellen: nur amtliche Seiten von Gesetzgeber, Gerichten, Behörden, Sozialversicherung und Unfallversicherung. */
export const ERLAUBTE_DOMAINS = [
  "gesetze-im-internet.de", "eur-lex.europa.eu", "bgbl.de", "recht.bund.de", "rechtsprechung-im-internet.de", "bundesarbeitsgericht.de",
  "bundesverfassungsgericht.de", "rv.hessenrecht.hessen.de", "gesetze-bayern.de", "gesetze.berlin.de", "dguv.de", "baua.de",
  "deutsche-rentenversicherung.de", "minijob-zentrale.de", "bundesfinanzministerium.de", "bmas.de", "bundesanzeiger.de",
  "bundesgesundheitsministerium.de", "bfdi.bund.de", "datenschutz.hessen.de", "bundestag.de", "bibb.de", "gkv-spitzenverband.de", "arbeitsagentur.de",
  // Landesrecht der übrigen Länder (Feiertagsgesetze, Strang 24)
  "landesrecht-bw.de", "bravors.brandenburg.de", "transparenz.bremen.de", "landesrecht-hamburg.de", "landesrecht-mv.de", "landtag-niedersachsen.de",
  "recht.nrw.de", "landesrecht.rlp.de", "recht.saarland.de", "revosax.sachsen.de", "landesrecht.sachsen-anhalt.de", "gesetze-rechtsprechung.sh.juris.de",
  "landesrecht.thueringen.de",
  // Niedersächsisches Vorschrifteninformationssystem NI-VORIS (amtliches Landesportal, betrieben von Wolters Kluwer)
  "voris.wolterskluwer-online.de",
];

export function erlaubteQuelle(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ERLAUBTE_DOMAINS.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Termine                                                             */
/* ------------------------------------------------------------------ */

/** Prüftermin für jährliche Werte: der 15.11. vor dem nächsten Jahreswechsel (Verordnungen kommen meist im Herbst). */
export const JAEHRLICH_PRUEFUNG = { monat: 11, tag: 15 };
const MONATE_JE_RHYTHMUS: Record<Exclude<Rhythmus, "jährlich">, number> = { Gesetz: 12, Rechtsprechung: 6, Verwaltung: 12, Lintelly: 12 };

/** Nächste Prüfung aus Prüfdatum und Rhythmus (ohne Prüfdatum ab REGISTER_STAND). */
export function naechstePruefungFuer(rhythmus: Rhythmus, geprueftAm: string | null): string {
  const ab = geprueftAm ?? REGISTER_STAND;
  if (rhythmus !== "jährlich") return addMonths(ab, MONATE_JE_RHYTHMUS[rhythmus]);
  const y = Number(ab.slice(0, 4));
  const termin = (j: number) => `${j}-${String(JAEHRLICH_PRUEFUNG.monat).padStart(2, "0")}-${String(JAEHRLICH_PRUEFUNG.tag).padStart(2, "0")}`;
  return ab < termin(y) ? termin(y) : termin(y + 1);
}

/* ------------------------------------------------------------------ */
/* Logik                                                               */
/* ------------------------------------------------------------------ */

const gilt = (w: Zeitwert, datum: string) => (!w.gueltigAb || w.gueltigAb <= datum) && (!w.gueltigBis || datum <= w.gueltigBis);
/** Der Wert, der an einem Tag gilt, oder null (kein Wert für das Datum eingetragen, auch wenn er nur aussteht). */
export function wertAm(e: Pick<RegisterEintrag, "werte">, datum: string): Zeitwert | null {
  return e.werte.find((w) => !w.ausstehend && gilt(w, datum)) ?? null;
}

/** Einträge, deren nächste Prüfung vor `heute` liegt. */
export const faellige = (register: RegisterEintrag[], heute: string) => register.filter((e) => e.naechstePruefung < heute);
/** Vorwarnung: so viele Tage vor dem Prüftermin gilt ein Wert als bald fällig (Test-Warnung und Filter "Fällig" in der App). */
export const VORWARNUNG_TAGE = 30;
/** Einträge, deren Prüfung in den nächsten `tage` Tagen ansteht (noch nicht fällig). */
export const baldFaellig = (register: RegisterEintrag[], heute: string, tage = VORWARNUNG_TAGE) => {
  const [y, m, d] = heute.split("-").map(Number);
  const grenze = new Date(Date.UTC(y, m - 1, d + tage)).toISOString().slice(0, 10);
  return register.filter((e) => e.naechstePruefung >= heute && e.naechstePruefung <= grenze);
};

/** Jährliche Einträge ohne Wert für das Folgejahr, ab dem 1. November. */
function ohneFolgejahr(register: RegisterEintrag[], heute: string): { e: RegisterEintrag; ausstehend: boolean; rot: boolean }[] {
  if (heute.slice(5) < "11-01") return [];
  const folgejahr = `${Number(heute.slice(0, 4)) + 1}-01-01`;
  return register.filter((e) => e.rhythmus === "jährlich" && !wertAm(e, folgejahr)).map((e) => {
    const offen = e.werte.find((w) => w.ausstehend && gilt(w, folgejahr));
    return { e, ausstehend: !!offen, rot: !offen || (offen.rotAb ? heute >= offen.rotAb : nachPruefTermin(heute)) };
  });
}
const nachPruefTermin = (heute: string) => heute.slice(5) > `${String(JAEHRLICH_PRUEFUNG.monat).padStart(2, "0")}-${String(JAEHRLICH_PRUEFUNG.tag).padStart(2, "0")}`;
/**
 * Ab dem 1. November muss bei jährlich wechselnden Werten der Wert für das Folgejahr eingetragen sein. Steht er als "ausstehend" mit Quelle im Register
 * (amtliche Bekanntgabe steht noch aus), zählt er erst nach dem Prüftermin 15.11. als fehlend; bis dahin warnt `ausstehendeFolgejahre`.
 */
export function fehlendeFolgejahre(register: RegisterEintrag[], heute: string): RegisterEintrag[] {
  // Dazu: ein ausstehender Wert, dessen Jahr schon begonnen hat (z. B. Faktor F am 01.01. noch nicht eingetragen).
  const begonnen = register.filter((e) => e.werte.some((w) => w.ausstehend && gilt(w, heute)) && !wertAm(e, heute));
  return [...new Set([...ohneFolgejahr(register, heute).filter((x) => x.rot).map((x) => x.e), ...begonnen])];
}
/** Folgejahreswerte, die bis zur amtlichen Bekanntgabe ausstehen dürfen (Warnung, kein Fehler). */
export function ausstehendeFolgejahre(register: RegisterEintrag[], heute: string): RegisterEintrag[] {
  return ohneFolgejahr(register, heute).filter((x) => x.ausstehend && !x.rot).map((x) => x.e);
}

/* ------------------------------------------------------------------ */
/* Werte als Text                                                      */
/* ------------------------------------------------------------------ */

const zahl = (n: number) => dezimal(n, 4);
const NAMEN: Record<string, string> = {
  wert: "", werte: "", tage: "Tage", monate: "Monate", jahre: "Jahre", stunden: "Stunden", minuten: "Minuten", wochen: "Wochen", prozent: "Prozent",
  monat: "Monat", tag: "Tag", min: "mindestens", max: "höchstens", abStunden: "ab Stunden", wertNach3: "nach dem 3. Geburtstag",
  // Ziele der Ein- und Austrittspläne als Sätze, {} ist der Wert (Prüffund UX-19).
  svAnmeldungTage: "Anmeldung zur Sozialversicherung: {} Tage nach Beginn", nachweisMonatTage: "Nachweis der Vertragsbedingungen: {} Tage nach Beginn",
  abmeldungTage: "Abmeldung: {} Tage nach dem Ende", probezeitVorlaufTage: "Probezeitgespräch: {} Tage vor dem Ende der Probezeit",
  tageJeMonat: "Rechenwert: {} Tage je Monat", postfachWeiterleitungMonate: "Weiterleitung des Postfachs: höchstens {} Monate",
};
/** "svAnmeldungTage" wird "sv Anmeldung Tage". */
const woerter = (k: string) => k.replace(/([a-zäöü])([A-ZÄÖÜ0-9])/g, "$1 $2");
/** Kurzer Text zu einem Wert aus WERTE: Zahlen ohne Quelle, verschachtelte Angaben mit Namen. */
export function wertText(v: unknown): string {
  if (v === null || v === undefined) return "keine Zahl, die Kanzlei legt sie fest";
  if (typeof v === "number") return zahl(v);
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(wertText).join(", ");
  if (typeof v === "object") {
    // Ein Rechenwert mit eigener Schreibweise (z. B. 13/3 Wochen je Monat) steht so im Register, nicht als gerundete Zahl.
    if (typeof (v as { text?: unknown }).text === "string") return (v as { text: string }).text;
    const teile = Object.entries(v as Record<string, unknown>)
      .filter(([k]) => !["quelle", "stand", "url", "bestaetigt", "name", "norm", "bezug"].includes(k))
      .map(([k, x]) => (NAMEN[k] === "" ? wertText(x) : NAMEN[k]?.includes("{}") ? NAMEN[k].replace("{}", wertText(x)) : `${NAMEN[k] ?? woerter(k)} ${wertText(x)}`));
    return teile.length ? teile.join("; ") : "Regel ohne Zahl";
  }
  return String(v);
}

/* ------------------------------------------------------------------ */
/* Angaben je Wert                                                     */
/* ------------------------------------------------------------------ */

/** p: Prüfdatum, k: Kanzlei prüfen, grund: von Hand gesetzter Grund (siehe Grund), ab/bis: Gültigkeit, befund: was beim Lesen der Quelle auffiel (der Wert bleibt, bis Nick und die Kanzlei entscheiden). */
type Optionen = { p?: string; k?: true; ab?: string; bis?: string; stichtag?: string; befund?: string; grund?: Grund };
type Angabe = { titel: string; gebiet: Gebiet; norm: string; url: string | null; rhythmus: Rhythmus } & Optionen;
const EU_ENTGELT = "https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:32023L0970";
const HBUG = "https://www.rv.hessenrecht.hessen.de/bshe/document/jlr-NNLHE000051B6";
const DGUV_V1 = "https://publikationen.dguv.de/regelwerk/dguv-vorschriften/2909/grundsaetze-der-praevention";
const G = "2026-10-10"; // Prüfdatum: Wert an diesem Tag im amtlichen Wortlaut gelesen.
const S29 = "2026-10-11"; // Prüfdatum der Firmenwagen-Werte (Strang 29, Destillat 20).
const LSTH_ANHANG_24 = "https://lsth.bundesfinanzministerium.de/lsth/2026/B-Anhaenge/Anhang-24/IV/IV-6/inhalt.html";
const S30 = "2026-10-11"; // Prüfdatum der Werte zu Zusatzleistungen und Dienstrad (Strang 30, Destillat 20, Abruf 11.10.2026).
const P29 = "2026-10-29"; // Prüfdatum der Nachprüfung vom 29.10.2026 (Session mit Nick): Wert im amtlichen Wortlaut gelesen; Werte mit Vorbehalt in werte.ts bleiben "Kanzlei prüfen".

/** Gesetz oder Verordnung. */
const g = (titel: string, gebiet: Gebiet, norm: string, url: string | null, o: Optionen = {}): Angabe => ({ titel, gebiet, norm, url, rhythmus: "Gesetz", ...o });
/** Urteil. */
const r = (titel: string, gebiet: Gebiet, norm: string, url: string | null, o: Optionen = {}): Angabe => ({ titel, gebiet, norm, url, rhythmus: "Rechtsprechung", ...o });
/** Verwaltungspraxis, Unfallversicherung, Technische Regeln. */
const v = (titel: string, gebiet: Gebiet, norm: string, url: string | null, o: Optionen = {}): Angabe => ({ titel, gebiet, norm, url, rhythmus: "Verwaltung", ...o });
/** Eigene Lintelly-Annahme: keine Rechtsquelle, Nick entscheidet, die Kanzlei sieht drüber. */
const l = (titel: string, gebiet: Gebiet, norm = "Lintelly-Standard"): Angabe => ({ titel, gebiet, norm, url: null, rhythmus: "Lintelly", k: true, grund: "Lintelly-Standard" });

const W: { [K in keyof typeof WERTE]: Angabe } = {
  probezeitHoechstMonate: g("Probezeit mit verkürzter Kündigungsfrist, höchstens", "Kündigung und Vertrag", "§ 622 Abs. 3 BGB", gii("bgb", "622"), { p: G }),
  probezeitKuendigungTage: g("Kündigungsfrist in der Probezeit", "Kündigung und Vertrag", "§ 622 Abs. 3 BGB", gii("bgb", "622"), { p: G }),
  probezeitBefristungAnteil: g("Probezeit im befristeten Vertrag im Verhältnis zur Laufzeit", "Befristung und Teilzeit", "§ 15 Abs. 3 TzBfG", gii("tzbfg", "15"), { p: P29, grund: "Auslegung" }),
  kschgWartezeitMonate: g("Wartezeit Kündigungsschutz", "Kündigung und Vertrag", "§ 1 Abs. 1 KSchG", gii("kschg", "1"), { p: G }),
  kschgSchwelle: g("Kleinbetrieb: Kündigungsschutzgesetz ab mehr als", "Schwellenwerte", "§ 23 Abs. 1 KSchG", gii("kschg", "23"), { p: G }),
  kschgAltfall: g("Kündigungsschutz Altfall: vor 2004 Eingestellte, Schwelle mehr als", "Schwellenwerte", "§ 23 Abs. 1 Satz 2 und 3 KSchG", gii("kschg", "23"), { p: "2026-10-11", k: true }),
  befristungSachgrundlosMonate: g("Sachgrundlose Befristung, Höchstdauer", "Befristung und Teilzeit", "§ 14 Abs. 2 Satz 1 TzBfG", gii("tzbfg", "14"), { p: G }),
  befristungVerlaengerungenMax: g("Sachgrundlose Befristung, Verlängerungen höchstens", "Befristung und Teilzeit", "§ 14 Abs. 2 Satz 1 TzBfG", gii("tzbfg", "14"), { p: G }),
  vorbeschaeftigungAbstandMonate: l("Vorbeschäftigung: Lintelly sperrt die sachgrundlose Befristung innerhalb von", "Befristung und Teilzeit", "Lintelly-Sperrschwelle; § 14 Abs. 2 Satz 2 TzBfG kennt keine Frist (BVerfG 1 BvL 7/14, BAG 7 AZR 733/16)"),
  vorbeschaeftigungVerbot: r("Vorbeschäftigung vor sachgrundloser Befristung: Ausnahme nur im Einzelfall", "Befristung und Teilzeit", "§ 14 Abs. 2 Satz 2 TzBfG, BVerfG 1 BvL 7/14, BAG 7 AZR 733/16", BAG("7-azr-733-16"), { p: "2026-10-11", k: true }),
  befristungSchriftform: g("Befristung nur schriftlich", "Befristung und Teilzeit", "§ 14 Abs. 4 TzBfG", gii("tzbfg", "14"), { p: G }),
  urlaubUebertragBis: g("Übertragung des Urlaubs bis", "Urlaub", "§ 7 Abs. 3 BUrlG", gii("burlg", "7"), { p: G, stichtag: "31.03." }),
  urlaubHinweispflicht: r("Hinweispflicht vor Verfall des Urlaubs", "Urlaub", "BAG 9 AZR 423/16, BAG 9 AZR 266/20", BAG("9-azr-423-16"), { p: P29 }),
  urlaubSonderregel: r("Verfall bei Krankheit, Mutterschutz, Elternzeit", "Urlaub", "§ 7 Abs. 3 BUrlG, § 24 MuSchG, § 17 BEEG, BAG 9 AZR 353/10", BAG("9-azr-353-10"), { k: true }),
  urlaubKrankSonderTage: l("Lange Krankheit für die Urlaubssonderregel ab", "Urlaub"),
  entgeltfortzahlungTage: g("Entgeltfortzahlung im Krankheitsfall", "Krankheit und BEM", "§ 3 Abs. 1 EFZG", gii("entgfg", "3"), { p: G }),
  entgeltAuskunftMonate: g("Entgelttransparenz: Frist für die Auskunft", "Entgelttransparenz", "Art. 7 Abs. 4 RL (EU) 2023/970", EU_ENTGELT, { p: P29 }),
  bemLoeschfrist: g("Löschfrist BEM-Unterlagen nach Abschluss", "Krankheit und BEM", "Art. 5 Abs. 1 lit. e DSGVO, § 26 Abs. 3 BDSG", EU_DSGVO, { grund: "Aufbewahrung" }),
  bemSchwelleTage: g("BEM anbieten ab Arbeitsunfähigkeit von mehr als", "Krankheit und BEM", "§ 167 Abs. 2 SGB IX", gii("sgb_9_2018", "167"), { p: G }),
  mutterschutzVorTage: g("Mutterschutz vor der Entbindung", "Mutterschutz und Elternzeit", "§ 3 Abs. 1 MuSchG", gii("muschg_2018", "3"), { p: G }),
  mutterschutzNachTage: g("Mutterschutz nach der Entbindung", "Mutterschutz und Elternzeit", "§ 3 Abs. 2 MuSchG", gii("muschg_2018", "3"), { p: G }),
  mutterschutzVorzeitig: g("Mutterschutz: vorzeitige Entbindung verlängert die Frist danach", "Mutterschutz und Elternzeit", "§ 3 Abs. 2 Satz 3 MuSchG", gii("muschg_2018", "3"), { p: "2026-10-11" }),
  mutterschutzFehlgeburt: g("Mutterschutz nach Fehlgeburt je Schwangerschaftswoche", "Mutterschutz und Elternzeit", "§ 3 Abs. 5 MuSchG", gii("muschg_2018", "3"), { p: "2026-10-11" }),
  mutterschutzFehlgeburtVerbot: g("Kündigungsverbot nach Fehlgeburt ab Schwangerschaftswoche", "Mutterschutz und Elternzeit", "§ 17 Abs. 1 Satz 1 Nr. 2 MuSchG", gii("muschg_2018", "17"), { p: "2026-10-11" }),
  mutterschutzMeldung: g("Meldung der Schwangerschaft an die Aufsichtsbehörde", "Mutterschutz und Elternzeit", "§ 27 Abs. 1 MuSchG", gii("muschg_2018", "27"), { p: G }),
  mutterschutzGefaehrdung: g("Gefährdungsbeurteilung bei Schwangerschaft", "Mutterschutz und Elternzeit", "§ 10 MuSchG", gii("muschg_2018", "10"), { p: G }),
  mutterschutzKuendigungsverbot: g("Kündigungsverbot im Mutterschutz", "Mutterschutz und Elternzeit", "§ 17 MuSchG", gii("muschg_2018", "17"), { p: G }),
  elternzeitAnmeldungWochen: g("Elternzeit verlangen, Frist bis zum 3. Geburtstag", "Mutterschutz und Elternzeit", "§ 16 Abs. 1 BEEG", gii("beeg", "16"), { p: G }),
  werkstudentStunden: v("Werkstudent: Wochenstunden in der Vorlesungszeit", "Ausbildung und Werkstudium", "§ 6 Abs. 1 Nr. 3 SGB V, Rundschreiben der SV-Spitzenverbände", gii("sgb_5", "6"), { k: true }),
  sachgeschenkAnlass: v("Sachgeschenk zu persönlichem Anlass, steuerfrei bis", "Lohn und Sozialversicherung", "R 19.6 Abs. 1 LStR", null, { k: true }),
  zeugnisAnspruch: g("Anspruch auf Zeugnis", "Kündigung und Vertrag", "§ 109 GewO", gii("gewo", "109"), { p: G }),
  elternzeitKuerzungMonate: g("Urlaubskürzung je Monat Elternzeit (Zwölftel)", "Mutterschutz und Elternzeit", "§ 17 Abs. 1 BEEG", gii("beeg", "17"), { p: G }),
  elternzeitSchutzVorherWochen: g("Kündigungsschutz vor Beginn der Elternzeit", "Mutterschutz und Elternzeit", "§ 18 Abs. 1 BEEG", gii("beeg", "18"), { p: G }),
  elternzeitResturlaub: g("Resturlaub nach der Elternzeit", "Mutterschutz und Elternzeit", "§ 17 Abs. 2 BEEG", gii("beeg", "17"), { p: G }),
  elternzeitTeilzeit: g("Teilzeit in der Elternzeit", "Mutterschutz und Elternzeit", "§ 15 BEEG", gii("beeg", "15"), { p: G }),
  teilzeitWartezeitMonate: g("Teilzeitanspruch nach Wartezeit", "Befristung und Teilzeit", "§ 8 Abs. 1 TzBfG", gii("tzbfg", "8"), { p: G }),
  teilzeitAnkuendigungMonate: g("Teilzeit ankündigen, Frist", "Befristung und Teilzeit", "§ 8 Abs. 2 TzBfG", gii("tzbfg", "8"), { p: G }),
  teilzeitAblehnungMonateVorBeginn: g("Teilzeit ablehnen spätestens vor Beginn", "Befristung und Teilzeit", "§ 8 Abs. 5 TzBfG", gii("tzbfg", "8"), { p: G }),
  teilzeitSchwelle: g("Teilzeitanspruch ab mehr als", "Schwellenwerte", "§ 8 Abs. 7 TzBfG", gii("tzbfg", "8"), { p: G }),
  pflegezeitAnkuendigungArbeitstage: g("Pflegezeit ankündigen, Frist", "Pflege", "§ 3 Abs. 3 PflegeZG", gii("pflegezg", "3"), { p: G }),
  familienpflegezeitAnkuendigungWochen: g("Familienpflegezeit ankündigen, Frist", "Pflege", "§ 2a Abs. 1 FPfZG", gii("fpfzg", "2a"), { p: G }),
  schwerbehindertKuendigung: g("Schwerbehinderung: Zustimmung Integrationsamt nach den ersten Monaten", "Kündigung und Vertrag", "§§ 168, 173 SGB IX", gii("sgb_9_2018", "173"), { p: G }),
  pflegeKuendigungsschutzVorherWochen: g("Kündigungsschutz vor Pflegezeit", "Pflege", "§ 5 Abs. 1 PflegeZG", gii("pflegezg", "5"), { p: P29 }),
  zusatzurlaubSchwerbehindert: g("Zusatzurlaub schwerbehinderter Menschen", "Urlaub", "§ 208 Abs. 1 SGB IX", gii("sgb_9_2018", "208"), { p: G }),
  kuendigungSchriftform: g("Kündigung und Aufhebungsvertrag nur schriftlich", "Kündigung und Vertrag", "§ 623 BGB", gii("bgb", "623"), { p: G }),
  betriebsratAnhoerung: g("Anhörung des Betriebsrats vor jeder Kündigung", "Kündigung und Vertrag", "§ 102 BetrVG", gii("betrvg", "102"), { p: G }),
  betriebsratAnhoerungFrist: g("Frist des Betriebsrats nach der Anhörung", "Kündigung und Vertrag", "§ 102 Abs. 2 BetrVG", gii("betrvg", "102"), { p: P29 }),
  bvKuendigungsfristMonate: g("Kündigungsfrist einer Betriebsvereinbarung", "Kündigung und Vertrag", "§ 77 Abs. 5 BetrVG", gii("betrvg", "77"), { p: "2026-10-11" }),
  fristloseKenntnisWochen: g("Fristlose Kündigung: Frist ab Kenntnis", "Kündigung und Vertrag", "§ 626 Abs. 2 BGB", gii("bgb", "626"), { p: P29 }),
  br99Schwelle: g("Betriebsrat: Zustimmung zu personellen Einzelmaßnahmen ab Unternehmensgröße", "Schwellenwerte", "§ 99 Abs. 1 BetrVG", gii("betrvg", "99"), { p: P29 }),
  br99FristTage: g("Betriebsrat: Frist für die Verweigerung der Zustimmung", "Kündigung und Vertrag", "§ 99 Abs. 3 BetrVG", gii("betrvg", "99"), { p: P29 }),
  br100AntragTage: g("Vorläufige Maßnahme: Antrag beim Arbeitsgericht nach Bestreiten", "Kündigung und Vertrag", "§ 100 Abs. 2 BetrVG", gii("betrvg", "100"), { p: P29 }),
  br102Widerspruch: g("Widerspruch des Betriebsrats gegen die Kündigung", "Kündigung und Vertrag", "§ 102 Abs. 3 bis 5 BetrVG", gii("betrvg", "102"), { p: P29 }),
  br103Zustimmung: g("Kündigung und Versetzung von Mitgliedern des Betriebsrats", "Kündigung und Vertrag", "§ 103 BetrVG", gii("betrvg", "103"), { p: P29 }),
  unfallanzeigeBetriebsrat: g("Unfallanzeige: Mitzeichnung durch den Betriebsrat", "Arbeitsschutz", "§ 193 Abs. 5 SGB VII", gii("sgb_7", "193"), { p: P29 }),
  kuendigungVollmacht: g("Kündigung durch Bevollmächtigte: Vollmacht im Original", "Kündigung und Vertrag", "§ 174 BGB", gii("bgb", "174"), { grund: "Auslegung" }),
  aufhebungSperrzeit: g("Sperrzeit beim Arbeitslosengeld nach Aufhebungsvertrag", "Kündigung und Vertrag", "§ 159 Abs. 1 SGB III", gii("sgb_3", "159"), { p: G }),
  arbzgPause6: g("Pause ab mehr als 6 Stunden", "Arbeitszeit", "§ 4 Satz 1 ArbZG", gii("arbzg", "4"), { p: G }),
  arbzgPause9: g("Pause ab mehr als 9 Stunden", "Arbeitszeit", "§ 4 Satz 1 ArbZG", gii("arbzg", "4"), { p: G }),
  arbzgRuhezeit: g("Ruhezeit zwischen zwei Arbeitstagen", "Arbeitszeit", "§ 5 Abs. 1 ArbZG", gii("arbzg", "5"), { p: G }),
  arbzgAusgleichWochen: g("Ausgleichszeitraum für den Schnitt", "Arbeitszeit", "§ 3 Satz 2 ArbZG", gii("arbzg", "3"), { p: G }),
  arbzgNachtzeit: g("Nachtzeit und Nachtarbeit", "Arbeitszeit", "§ 2 Abs. 3 und 4 ArbZG", gii("arbzg", "2"), { p: G }),
  krankAuAbTag: g("Ärztliche Bescheinigung ab mehr als", "Krankheit und BEM", "§ 5 Abs. 1 EFZG", gii("entgfg", "5"), { p: G }),
  loeschungVorlaufTage: l("Löschliste vor Ablauf der Aufbewahrung", "Aufbewahrung"),
  bildungsurlaubTage: g("Bildungsurlaub Hessen je Jahr", "Urlaub", "§ 2 Abs. 1 HBUG", HBUG, { p: P29, bis: "2029-12-31" }),
  bildungsurlaubWartezeitMonate: g("Bildungsurlaub Hessen, Wartezeit", "Urlaub", "§ 4 HBUG", HBUG, { p: P29, bis: "2029-12-31" }),
  bildungsurlaubMitteilungWochen: g("Bildungsurlaub Hessen, Mitteilung vor Beginn", "Urlaub", "§ 5 Abs. 1 HBUG", HBUG, { p: P29, bis: "2029-12-31" }),
  elternzeitAnmeldungWochenNach3: g("Elternzeit verlangen, Frist nach dem 3. Geburtstag", "Mutterschutz und Elternzeit", "§ 16 Abs. 1 Satz 1 Nr. 2 BEEG", gii("beeg", "16"), { p: G }),
  werkstudentJahreswochen: v("Werkstudent: Wochen über 20 Stunden im Jahr", "Ausbildung und Werkstudium", "Rundschreiben der SV-Spitzenverbände", null, { k: true }),
  dsgvoAntwortMonate: g("Antwort auf Auskunft und Löschwunsch", "Datenschutz und Hinweisgeber", "Art. 12 Abs. 3 DSGVO", EU_DSGVO, { p: G }),
  hinschgDokumentationJahre: g("Hinweisgeber: Dokumentation löschen nach", "Datenschutz und Hinweisgeber", "§ 11 Abs. 5 HinSchG", gii("hinschg", "11"), { p: G }),
  chatLoeschfristMonate: l("Löschfrist für Chatverläufe", "Datenschutz und Hinweisgeber", "Lintelly-Standard (Art. 5 Abs. 1 lit. e DSGVO)"),
  hoechstarbeitszeitWoche: g("Höchstarbeitszeit je Woche im Schnitt", "Arbeitszeit", "§ 3 ArbZG", gii("arbzg", "3"), { k: true, grund: "Umrechnung" }),
  arbzgTagesgrenze: g("Höchstarbeitszeit je Werktag", "Arbeitszeit", "§ 3 ArbZG", gii("arbzg", "3"), { p: G }),
  arbzgRuhepauseMin: g("Kürzeste Ruhepause", "Arbeitszeit", "§ 4 Satz 2 ArbZG", gii("arbzg", "4"), { p: G }),
  arbzgOhnePauseStunden: g("Höchstens am Stück ohne Pause", "Arbeitszeit", "§ 4 Satz 3 ArbZG", gii("arbzg", "4"), { p: G }),
  arbzgWochenSchnitt: g("Wochenarbeitszeit im Schnitt", "Arbeitszeit", "§ 3 ArbZG (8 Stunden mal 6 Werktage)", gii("arbzg", "3"), { k: true }),
  arbzgSonntag: g("Sonn- und Feiertagsruhe", "Arbeitszeit", "§§ 9 bis 11 ArbZG", gii("arbzg", "9"), { p: G }),
  jugendArbeitszeit: g("Arbeitszeit Jugendlicher", "Arbeitszeit", "§§ 8, 11, 13 JArbSchG", gii("jarbschg", "8"), { k: true }),
  arbzgAufzeichnung: g("Aufzeichnung der Arbeitszeit über", "Arbeitszeit", "§ 16 Abs. 2 ArbZG, BAG 1 ABR 22/21", gii("arbzg", "16"), { k: true }),
  arbzgErsatzruhetag: g("Ersatzruhetag nach Sonn- und Feiertagsarbeit", "Arbeitszeit", "§ 11 Abs. 3 ArbZG", gii("arbzg", "11"), { p: G }),
  zeitKorrekturHrAbStunden: l("Zeitkorrektur: HR-Leitung entscheidet ab Änderung des Wochenkontos von mehr als", "Arbeitszeit"),
  arbeitszeitOffenVergessenStunden: l("Offene Schicht gilt als vergessen nach", "Arbeitszeit"),
  azubiProbezeit: g("Ausbildung: Kündigung in der Probezeit", "Ausbildung und Werkstudium", "§§ 20, 22 Abs. 1 BBiG", gii("bbig_2005", "22"), { p: G }),
  azubiProbezeitMonate: g("Ausbildung: Dauer der Probezeit", "Ausbildung und Werkstudium", "§ 20 Satz 2 BBiG", gii("bbig_2005", "20"), { p: G }),
  azubiKuendigungWochen: g("Ausbildung: Kündigung bei Aufgabe oder Berufswechsel", "Ausbildung und Werkstudium", "§ 22 Abs. 2 Nr. 2 BBiG", gii("bbig_2005", "22"), { p: P29 }),
  azubiAufschlag: g("Mindestausbildungsvergütung: Aufschläge 2. bis 4. Jahr", "Ausbildung und Werkstudium", "§ 17 Abs. 2 Satz 1 BBiG", gii("bbig_2005", "17"), { p: G }),
  azubiKuendigungKenntnisWochen: g("Ausbildung: Kündigung aus wichtigem Grund nach Kenntnis", "Ausbildung und Werkstudium", "§ 22 Abs. 4 BBiG", gii("bbig_2005", "22"), { p: G }),
  azubiNiederschriftAufbewahrung: g("Ausbildung: Niederschrift aufbewahren", "Ausbildung und Werkstudium", "§ 11 Abs. 2 BBiG", gii("bbig_2005", "11"), { p: G }),
  azubiEintragung: g("Ausbildung: Eintragung bei der zuständigen Stelle", "Ausbildung und Werkstudium", "§ 36 BBiG", gii("bbig_2005", "36"), { p: P29 }),
  werkstudentSemesterferien: v("Werkstudent: mehr Stunden in der vorlesungsfreien Zeit", "Ausbildung und Werkstudium", "§ 6 Abs. 1 Nr. 3 SGB V, Rundschreiben", gii("sgb_5", "6"), { grund: "Auslegung" }),
  werkstudentNachweis: g("Werkstudent: Immatrikulation zu den Entgeltunterlagen", "Ausbildung und Werkstudium", "§ 8 Abs. 2 BVV", gii("beitrvv", "8"), { grund: "Auslegung" }),
  ausschlussfristMonate: r("Ausschlussfrist im Arbeitsvertrag", "Kündigung und Vertrag", "Rechtsprechung des BAG, marktüblich", null, { k: true }),
  ausschlussfristRecht: r("Ausschlussfrist: Ausnahmen und Textform", "Kündigung und Vertrag", "§ 3 MiLoG, §§ 202, 309 BGB, BAG 9 AZR 162/18", BAG("9-azr-162-18"), { p: P29 }),
  statusfeststellung: v("Statusfeststellung bei der Rentenversicherung", "Freelancer", "§ 7a SGB IV", WERTE.statusfeststellung.url, { p: G }),
  scheinselbststaendigkeit: v("Scheinselbstständigkeit: Merkmale", "Freelancer", "§ 7 Abs. 1 SGB IV", WERTE.scheinselbststaendigkeit.url, { p: G }),
  freierMitarbeiterRentenpflicht: g("Rentenversicherungspflicht Selbstständiger mit einem Auftraggeber", "Freelancer", "§ 2 Satz 1 Nr. 9 SGB VI", gii("sgb_6", "2"), { p: G }),
  efzWartezeitTage: g("Wartezeit Entgeltfortzahlung", "Krankheit und BEM", "§ 3 Abs. 3 EFZG", gii("entgfg", "3"), { p: G }),
  befristungVorlaufTage: l("Vorlauf vor Ende der Befristung", "Befristung und Teilzeit"),
  saeumniszuschlagMonat: g("Säumniszuschlag je angefangenem Monat", "Lohn und Sozialversicherung", "§ 24 Abs. 1 SGB IV", gii("sgb_4", "24"), { p: G }),
  radarBetriebsrat: g("Betriebsrat ab", "Schwellenwerte", "§ 1 Abs. 1 BetrVG", gii("betrvg", "1"), { p: G }),
  radarPflegezeit: g("Pflegezeit ab mehr als", "Schwellenwerte", "§ 3 Abs. 1 PflegeZG", gii("pflegezg", "3"), { p: G }),
  radarDatenschutzbeauftragte: g("Datenschutzbeauftragte ab", "Schwellenwerte", "§ 38 Abs. 1 BDSG", gii("bdsg_2018", "38"), { p: G }),
  radarSchwerbehinderung: g("Beschäftigungspflicht schwerbehinderter Menschen ab", "Schwellenwerte", "§ 154 Abs. 1 SGB IX", gii("sgb_9_2018", "154"), { p: G }),
  radarMassenentlassung: g("Massenentlassungsanzeige ab mehr als", "Schwellenwerte", "§ 17 Abs. 1 Nr. 1 KSchG", gii("kschg", "17"), { p: G }),
  radarFamilienpflege: g("Familienpflegezeit ab mehr als", "Schwellenwerte", "§ 2 Abs. 1 FPfZG", gii("fpfzg", "2"), { p: G }),
  radarBrueckenteilzeit: g("Brückenteilzeit ab mehr als", "Schwellenwerte", "§ 9a Abs. 1 TzBfG", gii("tzbfg", "9a"), { p: G }),
  radarHinweisgeber: g("Interne Meldestelle ab", "Schwellenwerte", "§ 12 Abs. 2 HinSchG", gii("hinschg", "12"), { p: G }),
  kschgTeilzeitFaktor: g("Teilzeit im Zähler des Kündigungsschutzgesetzes", "Schwellenwerte", "§ 23 Abs. 1 Satz 4 KSchG", gii("kschg", "23"), { p: G }),
  pflichtplatzStufen: g("Pflichtplätze schwerbehinderter Menschen", "Schwellenwerte", "§ 154 Abs. 1 SGB IX", gii("sgb_9_2018", "154"), { p: G }),
  mutterschutzArbeitszeit: g("Arbeitszeit in Schwangerschaft und Stillzeit", "Mutterschutz und Elternzeit", "§ 4 Abs. 1 und § 5 Abs. 1 MuSchG", gii("muschg_2018", "4"), { p: "2026-10-11", k: true }),
  uebergangsbereich: g("Übergangsbereich (Midijob): Obergrenze im Monat", "Lohn und Sozialversicherung", "§ 20 Abs. 2 SGB IV", gii("sgb_4", "20"), { p: "2026-10-11" }),
  bavSvFrei: g("Entgeltumwandlung: beitragsfreier Höchstbetrag", "Lohn und Sozialversicherung", "§ 1 Abs. 1 Satz 1 Nr. 9 SvEV", gii("svev", "1"), { p: "2026-10-11" }),
  pfaendungErklaerungWochen: g("Lohnpfändung: Erklärung des Arbeitgebers als Drittschuldner", "Lohn und Sozialversicherung", "§ 840 Abs. 1 ZPO", gii("zpo", "840"), { p: "2026-10-11" }),
  praktikumMindestlohn: g("Praktikum: Mindestlohn ab mehr als drei Monaten", "Lohn und Sozialversicherung", "§ 22 Abs. 1 Satz 2 Nr. 1 bis 3 MiLoG", gii("milog", "22"), { p: "2026-10-11" }),
  umlageTeilzeitFaktor: g("Teilzeit in der Zählung für die Umlage U1", "Lohn und Sozialversicherung", "§ 3 Abs. 1 Satz 6 AAG", gii("aufag", "3"), { p: "2026-10-11" }),
  umlageU1Grenze: g("Umlage U1 bis", "Lohn und Sozialversicherung", "§ 1 Abs. 1 AAG", gii("aufag", "1"), { p: P29 }),
  krankenquoteVergleich: l("Vergleichswert Krankenquote", "Krankheit und BEM", "Lintelly-Vergleichswert, kein amtlicher Wert"),
  gesundheitMinGruppe: l("Kleinste Gruppe für Gesundheitswerte", "Datenschutz und Hinweisgeber", "Lintelly-Regel (Art. 5, Art. 9 DSGVO)"),
  gehaltAenderungZweiteBestaetigung: l("Gehaltsänderung: zweite Bestätigung ab Abweichung", "Lohn und Sozialversicherung"),
  einmalbetragZweiteBestaetigung: l("Einmalbetrag: zweite Bestätigung über einem Monatsgehalt", "Lohn und Sozialversicherung"),
  abmahnungZeitnahTage: r("Abmahnung zeitnah zum Vorfall", "Kündigung und Vertrag", "Verwirkung, kein gesetzlicher Zeitraum", null, { k: true }),
  mindesturlaub: g("Gesetzlicher Mindesturlaub", "Urlaub", "§ 3 Abs. 1 BUrlG", gii("burlg", "3"), { p: G, k: true, grund: "Umrechnung", befund: "24 Werktage stehen im Wortlaut; 20 Arbeitstage bei fünf Tagen je Woche sind die übliche Umrechnung, nicht im Gesetzestext" }),
  urlaubsentgeltWochen: g("Urlaubsentgelt und Abgeltung: Bezugszeitraum", "Urlaub", "§ 11 Abs. 1 BUrlG", gii("burlg", "11"), { p: "2026-10-18" }),
  urlaubWartezeitMonate: g("Wartezeit für den vollen Urlaub", "Urlaub", "§ 4 BUrlG", gii("burlg", "4"), { p: G }),
  urlaubJahreshinweis: l("Jahreshinweis zum Urlaub bis", "Urlaub"),
  urlaubErinnerung: l("Erinnerung an Resturlaub ab", "Urlaub"),
  urlaubLangeNichtTage: l("Hinweis nach langer Zeit ohne Urlaub", "Urlaub"),
  urlaubKrankSonderNachlaufTage: l("Lange Krankheit zählt für die Sonderregel bis", "Urlaub"),
  grundkuendigungsfristTage: g("Grundkündigungsfrist", "Kündigung und Vertrag", "§ 622 Abs. 1 BGB", gii("bgb", "622"), { p: G }),
  kleinbetriebKuendigung: g("Kleinbetrieb: vier Wochen ohne festen Termin", "Kündigung und Vertrag", "§ 622 Abs. 5 Satz 1 Nr. 2 BGB", gii("bgb", "622"), { p: G }),
  kuendigungsStaffel: g("Verlängerte Kündigungsfristen nach Betriebszugehörigkeit", "Kündigung und Vertrag", "§ 622 Abs. 2 BGB", gii("bgb", "622"), { p: G }),
  staffelVorwarnungTage: l("Hinweis vor der nächsten Stufe der Staffel", "Kündigung und Vertrag"),
  kschgKlageWochen: g("Frist für die Kündigungsschutzklage", "Kündigung und Vertrag", "§ 4 Satz 1 KSchG", gii("kschg", "4"), { p: G }),
  arbeitsuchendMeldung: g("Meldung als arbeitsuchend", "Kündigung und Vertrag", "§ 38 Abs. 1 SGB III", gii("sgb_3", "38"), { p: G }),
  verjaehrungJahre: g("Regelmäßige Verjährung", "Lohn und Sozialversicherung", "§ 195 BGB", gii("bgb", "195"), { p: G }),
  nachwgFristen: g("Nachweis der Arbeitsbedingungen, Fristen", "Kündigung und Vertrag", "§ 2 Abs. 1 Satz 4 NachwG", gii("nachwg", "2"), { p: G }),
  nachwgBussgeld: g("Bußgeld bei fehlendem Nachweis bis", "Kündigung und Vertrag", "§ 4 Abs. 2 NachwG", gii("nachwg", "4"), { p: G }),
  integrationsamtAnzeigeTage: g("Anzeige beim Integrationsamt in den ersten sechs Monaten", "Kündigung und Vertrag", "§ 173 Abs. 4 SGB IX", gii("sgb_9_2018", "173"), { p: G }),
  mutterschutzNachTageVerlaengert: g("Mutterschutz nach Früh- oder Mehrlingsgeburt", "Mutterschutz und Elternzeit", "§ 3 Abs. 2 Satz 2 MuSchG", gii("muschg_2018", "3"), { p: G }),
  mutterschutzKuendigungsverbotMonate: g("Kündigungsverbot nach der Entbindung mindestens", "Mutterschutz und Elternzeit", "§ 17 Abs. 1 Satz 1 Nr. 3 MuSchG", gii("muschg_2018", "17"), { p: G }),
  mutterschutzMitteilungWochen: g("Nachträgliche Mitteilung der Schwangerschaft nach Kündigung", "Mutterschutz und Elternzeit", "§ 17 Abs. 1 Satz 2 MuSchG", gii("muschg_2018", "17"), { p: G }),
  mutterschutzMeldungZielTage: l("Meldung der Schwangerschaft, Lintelly-Ziel", "Mutterschutz und Elternzeit"),
  elternzeitErsterAbschnittMonate: g("Elternzeit bis zum 3. Geburtstag", "Mutterschutz und Elternzeit", "§ 16 Abs. 1 Satz 1 BEEG", gii("beeg", "16"), { p: G }),
  elternzeitSichtNachRueckkehrTage: l("Elternzeit-Hinweise nach der Rückkehr sichtbar", "Mutterschutz und Elternzeit"),
  feedbackNachMonaten: l("Feedbackgespräch nach dem Start", "Abläufe von Lintelly"),
  bemZeitraumTage: g("BEM: Zeitraum der Zählung", "Krankheit und BEM", "§ 167 Abs. 2 SGB IX", gii("sgb_9_2018", "167"), { k: true, grund: "Umrechnung" }),
  efzNeuerAnspruch: g("Entgeltfortzahlung: neuer Anspruch bei derselben Krankheit", "Krankheit und BEM", "§ 3 Abs. 1 Satz 2 EFZG", gii("entgfg", "3"), { p: G }),
  werkstudentWarnung: l("Werkstudent: Warnung vor der Jahresgrenze", "Ausbildung und Werkstudium"),
  wochenJeMonat: l("Wochen je Monat (Rechenwert)", "Lohn und Sozialversicherung", "Lintelly-Rechenwert, kein Rechtswert"),
  milogAufzeichnung: g("Minijob: Aufzeichnung der Arbeitszeit", "Arbeitszeit", "§ 17 Abs. 1 MiLoG", gii("milog", "17"), { p: G }),
  datenpanneMeldungStunden: g("Datenpanne: Meldung an die Aufsicht", "Datenschutz und Hinweisgeber", "Art. 33 Abs. 1 DSGVO", EU_DSGVO, { p: G }),
  unfallanzeige: g("Unfallanzeige an die Berufsgenossenschaft", "Arbeitsschutz", "§ 193 Abs. 1 und 4 SGB VII", gii("sgb_7", "193"), { p: G }),
  vorfallZielTage: l("Vorfälle: Ziele ohne gesetzliche Frist", "Abläufe von Lintelly"),
  datenpanneVielePersonen: l("Datenpanne: viele Betroffene ab", "Datenschutz und Hinweisgeber"),
  jugendlicheBisJahre: g("Jugendliche: unter", "Arbeitszeit", "§ 2 Abs. 2 JArbSchG", gii("jarbschg", "2"), { p: G }),
  bildungsurlaubAblehnungWochen: g("Bildungsurlaub Hessen, Ablehnung binnen", "Urlaub", "§ 5 Abs. 6 HBUG", HBUG, { p: P29, bis: "2029-12-31" }),
  pflegezeitHoechstMonate: g("Pflegezeit höchstens", "Pflege", "§ 4 Abs. 1 PflegeZG", gii("pflegezg", "4"), { p: G }),
  familienpflegezeit: g("Familienpflegezeit: Dauer und Mindeststunden", "Pflege", "§ 2 Abs. 1 FPfZG", gii("fpfzg", "2"), { p: G }),
  brueckenteilzeit: g("Brückenteilzeit: Dauer und Zumutbarkeit", "Befristung und Teilzeit", "§ 9a TzBfG", gii("tzbfg", "9a"), { p: G }),
  massenentlassungAnzahl: g("Massenentlassung: Zahl der Entlassungen", "Schwellenwerte", "§ 17 Abs. 1 Satz 1 Nr. 1 KSchG", gii("kschg", "17"), { p: G }),
  betriebsratWahl: g("Betriebsrat: Wahlalter und wählbare Arbeitnehmer", "Schwellenwerte", "§§ 1, 7 BetrVG", gii("betrvg", "7"), { p: G }),
  schwerbehindertAnzeige: g("Anzeige der Beschäftigungspflicht bis", "Schwellenwerte", "§ 163 Abs. 2 SGB IX", gii("sgb_9_2018", "163"), { p: G, stichtag: "31.03." }),
  arbeitsplatzMindestStunden: g("Arbeitsplatz zählt ab Wochenstunden", "Schwellenwerte", "§ 156 Abs. 3 SGB IX", gii("sgb_9_2018", "156"), { p: G }),
  minijobGrenzenFrueher: g("Frühere Minijob-Grenzen (nur Erkennung beim Import)", "Lohn und Sozialversicherung", "§ 8 Abs. 1 Nr. 1 SGB IV, frühere Fassungen", gii("sgb_4", "8"), { k: true }),
  planZiele: l("Ziele der Ein- und Austrittspläne", "Abläufe von Lintelly"),
  deuevMeldungWochen: g("An- und Abmeldung zur Sozialversicherung", "Lohn und Sozialversicherung", "§§ 6, 8 DEÜV", gii("de_v", "6"), { p: G }),
  aufenthaltVorlaufTage: l("Erinnerung vor Ablauf des Aufenthaltstitels", "Abläufe von Lintelly"),
  zeugnisVorlaufTage: l("Zeugnis vorbereiten vor dem Anlass", "Abläufe von Lintelly"),
  immatrikulationVorlaufTage: l("Immatrikulation anfordern vor Semesterende", "Ausbildung und Werkstudium"),
  karenzMindestAnteil: g("Nachvertragliches Wettbewerbsverbot: Karenzentschädigung mindestens", "Wettbewerb und Vertragsstrafe", "§ 74 Abs. 2 HGB", gii("hgb", "74"), { p: G }),
  wettbewerbsverbotHoechstMonate: g("Nachvertragliches Wettbewerbsverbot: Dauer höchstens", "Wettbewerb und Vertragsstrafe", "§ 74a Abs. 1 Satz 3 HGB", gii("hgb", "74a"), { p: G }),
  karenzAnrechnung: g("Karenzentschädigung: Anrechnung anderweitigen Erwerbs", "Wettbewerb und Vertragsstrafe", "§ 74c Abs. 1 HGB", gii("hgb", "74c"), { p: G }),
  karenzVerzichtMonate: g("Verzicht auf das Wettbewerbsverbot: Entschädigung endet nach", "Wettbewerb und Vertragsstrafe", "§ 75a HGB", gii("hgb", "75a"), { p: G }),
  provisionAbrechnungMaxMonate: g("Provision: Abrechnungszeitraum höchstens", "Vergütung und Provision", "§ 87c Abs. 1, § 87a Abs. 4 HGB (über § 65 HGB)", gii("hgb", "87c"), { p: G, befund: "Wortlaut für Handelsvertreter gelesen; ob er für alle Arbeitnehmer mit Provision gilt, klärt die Kanzlei (Frage 1)" }),
  abruf: g("Arbeit auf Abruf: Ankündigung und Schwankung", "Arbeitszeit", "§ 12 TzBfG", gii("tzbfg", "12"), { p: G }),
  milogKonto: g("Arbeitszeitkonto bei Mindestlohn", "Lohn und Sozialversicherung", "§ 2 Abs. 2 MiLoG", gii("milog", "2"), { p: G }),
  efzKuerzungAnteil: g("Kürzung von Sondervergütungen je Krankheitstag höchstens", "Vergütung und Provision", "§ 4a EFZG", gii("entgfg", "4a"), { p: G }),
  zweckbefristungAuslaufTage: g("Zweckbefristung und auflösende Bedingung: Ende frühestens nach Unterrichtung", "Befristung und Teilzeit", "§ 15 Abs. 2, § 21 TzBfG", gii("tzbfg", "15"), { p: G }),
  erfindungBeanstandungMonate: g("Erfindungsmeldung: Ergänzung verlangen binnen", "Erfindungen und Urheberrecht", "§ 5 Abs. 3 ArbnErfG", gii("arbnerfg", "5"), { p: G }),
  erfindungInanspruchnahmeMonate: g("Diensterfindung: Inanspruchnahme gilt als erklärt nach", "Erfindungen und Urheberrecht", "§ 6 Abs. 2 ArbnErfG", gii("arbnerfg", "6"), { p: G }),
  erfindungFestsetzungMonate: g("Erfindervergütung: Festsetzung spätestens nach Erteilung", "Erfindungen und Urheberrecht", "§ 12 Abs. 3 ArbnErfG", gii("arbnerfg", "12"), { p: G }),
  erfindungWiderspruchMonate: g("Erfindervergütung: Widerspruch gegen die Festsetzung binnen", "Erfindungen und Urheberrecht", "§ 12 Abs. 4 ArbnErfG", gii("arbnerfg", "12"), { p: G }),
  erfindungFreiMonate: g("Freie Erfindung: Arbeitgeber bestreitet binnen", "Erfindungen und Urheberrecht", "§ 18 Abs. 2 ArbnErfG", gii("arbnerfg", "18"), { p: G }),
  erfindungAnbietungMonate: g("Freie Erfindung: Annahme des Nutzungsrechts binnen", "Erfindungen und Urheberrecht", "§ 19 Abs. 2 ArbnErfG", gii("arbnerfg", "19"), { p: G }),
  erfindungUnbilligkeitMonate: g("Erfindung: Unbilligkeit geltend machen bis", "Erfindungen und Urheberrecht", "§ 23 Abs. 2 ArbnErfG", gii("arbnerfg", "23"), { p: G }),
  bavZuschussAnteil: g("Entgeltumwandlung: Zuschuss des Arbeitgebers", "Vergütung und Provision", "§ 1a Abs. 1a BetrAVG", gii("betravg", "1a"), { k: true }),
  widerrufAnteil: r("Widerrufsvorbehalt: widerruflicher Anteil höchstens", "Vergütung und Provision", "BAG 5 AZR 364/04, § 308 Nr. 4 BGB", BAG("5-azr-364-04"), { k: true }),
  ueberstundenPauschaleMaxMonat: r("Überstundenpauschale: abgegoltene Stunden im Monat höchstens", "Arbeitszeit", "BAG 5 AZR 331/11, § 307 Abs. 1 Satz 2 BGB", BAG("5-azr-331-11"), { k: true }),
  fortbildungBindung: r("Rückzahlung von Fortbildungskosten: Bindungsdauer je Dauer der Fortbildung", "Kündigung und Vertrag", "BAG 3 AZR 900/07, BAG 9 AZR 260/21, § 307 BGB", null, { k: true }),
  bindungRueckzahlungMaxMonate: r("Umzugskosten und Einstiegsprämie: Bindung höchstens", "Kündigung und Vertrag", "§ 307 BGB, Linie der Rechtsprechung", null, { k: true }),
  sonderzahlungBindung: r("Gratifikation: Bindung nach Höhe der Zahlung", "Vergütung und Provision", "§ 307 BGB, Linie des BAG", null, { k: true }),
  vertragsstrafeGrenze: r("Vertragsstrafe bei Vertragsbruch: Höhe höchstens", "Wettbewerb und Vertragsstrafe", "BAG 8 AZR 65/05, BAG 8 AZR 897/08, § 307 BGB", BAG("8-azr-897-08"), { k: true }),
  rufbereitschaftReaktionMinuten: r("Rufbereitschaft: Warnung bei kurzer Reaktionszeit", "Arbeitszeit", "EuGH C-518/15 (Matzak)", null, { k: true }),
  unbezahlterUrlaubSvMonate: g("Unbezahlter Urlaub: Beschäftigung in der Sozialversicherung gilt fort, längstens", "Lohn und Sozialversicherung", "§ 7 Abs. 3 Satz 1 SGB IV", gii("sgb_4", "7"), { k: true }),
  sonderurlaubUrlaubsrechnung: r("Unbezahlter Sonderurlaub: Umrechnung des Urlaubs nach Arbeitstagen", "Urlaub", "BAG 9 AZR 315/17", BAG("9-azr-315-17"), { k: true }),
  provisionStandards: l("Provision und Bonus: Standards der Bausteine", "Vergütung und Provision"),
  vertragStandards: l("Vertragsbausteine: Standards für Fristen und Warnwerte", "Kündigung und Vertrag"),
  // Strang 29: Firmenwagen. Gesetz am 11.10.2026 im Wortlaut gelesen; BMF-Schreiben und LStR über das Lohnsteuer-Handbuch 2026.
  dienstwagenPrivatProzent: g("Dienstwagen: private Nutzung je Monat vom Listenpreis", "Lohn und Sozialversicherung", "§ 6 Abs. 1 Nr. 4 Satz 2 EStG, § 8 Abs. 2 Satz 2 EStG", gii("estg", "6"), { p: S29 }),
  fuehrerscheinIntervallMonate: l("Führerscheinkontrolle: Standard alle (keine gesetzliche Frist)", "Arbeitsschutz", "Lintelly-Standard; § 21 StVG nennt keine Frist"),
  arbeitnehmerHaftung: g("Haftung der Beschäftigten für Schäden: nur bei Vertretenmüssen", "Kündigung und Vertrag", "§ 619a BGB, BAG GS 1/89", gii("bgb", "619a"), { p: S29, k: true }),
  erholungsbeihilfe: g("Erholungsbeihilfe pauschal im Kalenderjahr bis", "Lohn und Sozialversicherung", "§ 40 Abs. 2 Satz 1 Nr. 3 EStG", gii("estg", "40"), { p: S30 }),
  fahrradUmwandlung: v("Dienstrad aus Gehaltsumwandlung: Vorteil je Monat", "Lohn und Sozialversicherung", "Gleich lautende Ländererlasse vom 09.01.2020, BStBl I S. 174", "https://lsth.bundesfinanzministerium.de/lsth/2026/B-Anhaenge/Anhang-24/IV/IV-4/inhalt.html", { p: S30 }),
  fahrradKfz: v("E-Bike als Kraftfahrzeug: Regeln für Dienstwagen", "Lohn und Sozialversicherung", "BMF-Schreiben vom 03.03.2022, Rn. 3", LSTH_ANHANG_24, { p: S30 }),
};

/* ------------------------------------------------------------------ */
/* Zeitreihen und Listen                                               */
/* ------------------------------------------------------------------ */

const tagDavor = (d: string) => { const [y, m, t] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, t - 1)).toISOString().slice(0, 10); };
/**
 * Zeitreihe aus werte.ts: gültig bis zum Tag vor dem nächsten Eintrag. Der letzte Wert gilt bis Jahresende: jährlich wechselnde Werte
 * gelten nie still weiter, für das Folgejahr braucht es einen eigenen Eintrag (sonst schlägt der Test ab 1. November an).
 */
const reihe = (liste: ZeitWert[], text: (w: number) => string): Zeitwert[] =>
  liste.map((w, i) => ({ gueltigAb: w.gueltigAb, gueltigBis: liste[i + 1] ? tagDavor(liste[i + 1].gueltigAb) : `${w.gueltigAb.slice(0, 4)}-12-31`, wert: `${text(w.wert)}${w.bestaetigt === false ? " (vorläufig, noch nicht verkündet)" : ""}` }));
/** Steht in der Reihe ein vorläufiger Wert, bleibt der Eintrag auf "Kanzlei prüfen", bis er verkündet ist. */
/** Ausstehender Folgejahreswert als eigene Zeile: Quelle und Termin statt einer Zahl. */
const ausstehend = (a: (typeof AUSSTEHEND)[keyof typeof AUSSTEHEND]): Zeitwert => ({ gueltigAb: a.gueltigAb, gueltigBis: `${a.gueltigAb.slice(0, 4)}-12-31`, wert: `ausstehend, erwartet: ${a.erwartet}. ${a.quelle}`, ausstehend: true, ...(a.rotAb ? { rotAb: a.rotAb } : {}) });
const vorlaeufig = (liste: ZeitWert[]) => (liste.some((w) => w.bestaetigt === false) ? { k: true as const, grund: "vorläufig" as const } : {});
const prozent = (n: number) => anteil(n, 2);
const letzteQuelle = (liste: ZeitWert[]) => liste[liste.length - 1].quelle;

type Reihe = Omit<RegisterEintrag, "naechstePruefung" | "status" | "stichtag" | "rhythmus" | "hinweis" | "grund"> & { hinweis?: string; k?: true; grund?: Grund };
const MINIJOB = "https://magazin.minijob-zentrale.de/";
const BMG = "https://www.bundesgesundheitsministerium.de/";
const REIHEN: Reihe[] = [
  { id: "mindestlohn", titel: "Gesetzlicher Mindestlohn je Stunde", gebiet: "Lohn und Sozialversicherung", norm: "§ 1 MiLoV5 (vorher MiLoV4)", quelleUrl: gii("milov5", "1"), werte: reihe(MINDESTLOHN, euro), geprueftAm: G, hinweis: letzteQuelle(MINDESTLOHN) },
  { id: "minijobGrenze", titel: "Minijob-Verdienstgrenze im Monat", gebiet: "Lohn und Sozialversicherung", norm: "§ 8 Abs. 1a SGB IV (Mindestlohn mal 130 durch 3)", quelleUrl: `${MINIJOB}minijob-verdienstgrenze/`, weitereQuellen: [`${MINIJOB}minijob-grenze-2027/`], werte: reihe(MINIJOB_GRENZE, euro), geprueftAm: G, hinweis: letzteQuelle(MINIJOB_GRENZE) },
  { id: "bbgRv", titel: "Beitragsbemessungsgrenze Rentenversicherung je Monat", gebiet: "Lohn und Sozialversicherung", norm: "§ 4 Abs. 1 Nr. 1 SVBezGrV 2026, 2027 Kabinettsbeschluss", quelleUrl: gii("svbezgrv_2026", "4"), weitereQuellen: [DRV_RECHENGROESSEN_2027], werte: reihe(BBG_RV_MONAT, euro), geprueftAm: G, hinweis: letzteQuelle(BBG_RV_MONAT), ...vorlaeufig(BBG_RV_MONAT) },
  { id: "bbgKv", titel: "Beitragsbemessungsgrenze Kranken- und Pflegeversicherung je Monat", gebiet: "Lohn und Sozialversicherung", norm: "§ 2 Abs. 2 SVBezGrV 2026, 2027 Kabinettsbeschluss", quelleUrl: gii("svbezgrv_2026", "2"), weitereQuellen: [DRV_RECHENGROESSEN_2027], werte: reihe(BBG_KV_MONAT, euro), geprueftAm: G, hinweis: letzteQuelle(BBG_KV_MONAT), ...vorlaeufig(BBG_KV_MONAT) },
  { id: "satzRvAv", titel: "Beitragssatz Renten- und Arbeitslosenversicherung zusammen", gebiet: "Lohn und Sozialversicherung", norm: "§ 158 SGB VI, § 341 Abs. 2 SGB III", quelleUrl: "https://www.deutsche-rentenversicherung.de/Nord/DE/Presse/Pressemitteilungen-und-Pressearchiv/Pressemitteilungen/20251218_Aenderung-RV-01012026.html", weitereQuellen: [gii("sgb_3", "341")], pruefzahlen: ["18,6", "2,6"], werte: [...reihe(SATZ_RV_AV, prozent), ausstehend(AUSSTEHEND.satzRvAv)], geprueftAm: G, hinweis: `${letzteQuelle(SATZ_RV_AV)}. Summe aus 18,6 % (DRV) und 2,6 % (§ 341 Abs. 2 SGB III), beide am Prüfdatum im Wortlaut gelesen` },
  { id: "satzAv", titel: "Beitragssatz Arbeitslosenversicherung", gebiet: "Lohn und Sozialversicherung", norm: "§ 341 Abs. 2 SGB III", quelleUrl: gii("sgb_3", "341"), werte: reihe(SATZ_AV, prozent), geprueftAm: G, hinweis: letzteQuelle(SATZ_AV) },
  { id: "satzKvPv", titel: "Beitragssatz Kranken- und Pflegeversicherung mit Zusatzbeitrag", gebiet: "Lohn und Sozialversicherung", norm: "§ 241 SGB V, § 242a SGB V, § 55 SGB XI", quelleUrl: `${BMG}beitraege`, weitereQuellen: [`${BMG}themen/pflege/online-ratgeber-pflege/die-pflegeversicherung/finanzierung`, "https://www.gesetze-im-internet.de/pbav_2025/BJNR1BE0A0024.html"], pruefzahlen: ["14,6", "2,9", "3,6"], werte: [...reihe(SATZ_KV_PV, prozent), ausstehend(AUSSTEHEND.satzKvPv)], geprueftAm: G, hinweis: `${letzteQuelle(SATZ_KV_PV)}. Teile am Prüfdatum im Wortlaut gelesen: 14,6 % und 2,9 % (BMG), 3,6 % (BMG Pflege). Der Zusatzbeitrag ist ein Durchschnitt, die Kasse der Person setzt ihren eigenen Satz; die 3,6 % setzt § 1 Abs. 1 PBAV 2025 ab 01.01.2025 fest (am 29.10.2026 im Wortlaut gelesen), § 55 Abs. 1 SGB XI nennt im Text noch 3,4 %`, k: true },
  { id: "sachbezugMittag", titel: "Sachbezugswert Mittag- oder Abendessen je Tag (Essenmarke)", gebiet: "Lohn und Sozialversicherung", norm: "§ 2 Abs. 1 Nr. 2 und 3 SvEV", quelleUrl: gii("svev", "2"), werte: reihe(SACHBEZUG_MITTAG, euro), geprueftAm: S30, hinweis: letzteQuelle(SACHBEZUG_MITTAG), ...vorlaeufig(SACHBEZUG_MITTAG) },
  { id: "insolvenzgeldumlage", titel: "Insolvenzgeldumlage (nur Arbeitgeber)", gebiet: "Lohn und Sozialversicherung", norm: "§ 360 SGB III, Bemessung § 358 Abs. 2 SGB III", quelleUrl: gii("sgb_3", "360"), weitereQuellen: [gii("sgb_3", "358")], werte: reihe(INSOLVENZGELDUMLAGE, prozent), geprueftAm: P29, hinweis: letzteQuelle(INSOLVENZGELDUMLAGE) },
  { id: "minijobAgPauschale", titel: "Minijob: Pauschalen des Arbeitgebers", gebiet: "Lohn und Sozialversicherung", norm: "§ 249b SGB V, § 172 Abs. 3 SGB VI, § 40a Abs. 2 EStG", quelleUrl: gii("sgb_5", "249b"),
    weitereQuellen: [gii("sgb_6", "172"), gii("estg", "40a")], pruefzahlen: ["13", "15", "2"],
    werte: [...reihe(MINIJOB_AG_PAUSCHALE, prozent), ausstehend(AUSSTEHEND.minijobAgPauschale)], geprueftAm: P29, hinweis: `${letzteQuelle(MINIJOB_AG_PAUSCHALE)}. Teile am Prüfdatum im Wortlaut gelesen: 13 % (§ 249b Satz 1 SGB V), 15 % (§ 172 Abs. 3 Satz 1 SGB VI), 2 % (§ 40a Abs. 2 EStG); ohne Umlagen U1, U2 und Insolvenzgeldumlage`, k: true },
  // Faktor F 2026 am 29.10.2026 im Wortlaut der Bekanntmachung (Bundesanzeiger) gelesen; Formeln in § 20 Abs. 2a SGB IV, Beispieltabelle der DRV (tests/midijob.test.ts).
  { id: "faktorF", titel: "Übergangsbereich (Midijob): Faktor F", gebiet: "Lohn und Sozialversicherung", norm: "§ 20 Abs. 2a SGB IV, Bekanntmachung des BMAS je Jahr",
    quelleUrl: "https://www.bundesanzeiger.de/pub/publication/tEVvKJtcxc4VdUgfyAg/content/tEVvKJtcxc4VdUgfyAg/BAnz%20AT%2018.12.2025%20B5.pdf",
    weitereQuellen: ["https://rvrecht.deutsche-rentenversicherung.de/SharedDocs/rvRecht/07_AktuelleWerte/D-G/awert_glzre.html", gii("sgb_4", "20")],
    werte: [...reihe(FAKTOR_F, zahl), ausstehend(AUSSTEHEND.faktorF)], geprueftAm: "2026-10-29", hinweis: letzteQuelle(FAKTOR_F) },
  { id: "mindestausbildung", titel: "Mindestausbildungsvergütung je Beginnjahr (1. bis 4. Jahr)", gebiet: "Ausbildung und Werkstudium", norm: "§ 17 Abs. 2 BBiG, Bekanntmachung je Jahr", quelleUrl: "https://www.gesetze-im-internet.de/bbimindvergfbek_2027/BJNR11F0A0026.html", weitereQuellen: ["https://www.gesetze-im-internet.de/bbimindvergfbek_2026/BJNR0EB0A0025.html"],
    werte: Object.entries(MINDESTAUSBILDUNG).map(([jahr, e]) => ({ gueltigAb: `${jahr}-01-01`, gueltigBis: `${jahr}-12-31`, wert: e.jahre.map((n) => euro(n)).join(", ") })), geprueftAm: "2026-10-23", hinweis: "Maßgeblich ist das Jahr des Ausbildungsbeginns. Beträge 2026 und 2027 am 23.10.2026 im Wortlaut beider Bekanntmachungen gelesen (Rechtsradar, BGBl. 2026 I Nr. 287)" },
];

const listeEintraege: RegisterEintrag[] = [
  ...Object.entries(AUFBEWAHRUNG).map(([id, a]) => eintrag(`aufbewahrung.${id}`, { titel: `Aufbewahrung ${id}`, gebiet: "Aufbewahrung", norm: a.norm, url: EU_DSGVO, rhythmus: "Gesetz", k: true, grund: "Aufbewahrung" },
    [{ gueltigAb: null, gueltigBis: null, wert: `${a.jahre} Jahre ab ${a.bezug === "austritt" ? "Austritt" : "Datum des Dokuments"}` }], a.norm)),
  ...Object.entries(AUFBEWAHRUNG_MODULE).map(([id, a]) => eintrag(`aufbewahrung.modul.${id}`, { titel: `Aufbewahrung: ${a.name}`, gebiet: "Aufbewahrung", norm: a.norm, url: id === "verbandbuch" ? DGUV_V1 : EU_DSGVO, rhythmus: "Gesetz", k: true, grund: "Aufbewahrung" },
    [{ gueltigAb: null, gueltigBis: null, wert: a.jahre === null ? "keine Zahl, die Kanzlei legt sie fest" : `${a.jahre} Jahre ab ${a.bezug === "austritt" ? "Austritt" : a.bezug === "ende" ? "Ende der Runde" : "Ereignis"}` }], a.norm)),
  eintrag("feiertage.bund", { titel: "Gesetzliche Feiertage bundesweit", gebiet: "Feiertage", norm: FEIERTAGE.bund.quelle, url: "https://www.rv.hessenrecht.hessen.de/bshe/document/jlr-NNLHE000051B5", rhythmus: "Gesetz", p: P29 },
    [{ gueltigAb: null, gueltigBis: null, wert: FEIERTAGE.bund.tage.map((t) => t.name).join(", ") }], FEIERTAGE.bund.quelle),
  // Alle 16 Länder (Bayern in drei Gebieten, alle aus demselben Gesetz), Strang 24. Nur Bayern war am Prüfdatum im Wortlaut gelesen; die übrigen
  // Länder stehen mit amtlicher Fundstelle, aber ohne Wortlaut-Prüfung im Register und gelten bis dahin als "Kanzlei prüfen" (wie bisher Hessen und Berlin).
  // Strang 29: Bruchteil des Listenpreises je Antrieb und Anschaffungszeitraum (Gültigkeit = Anschaffungsdatum).
  ...DIENSTWAGEN_BRUCHTEIL.map((z) => eintrag(`dienstwagenBruchteil.${z.antrieb}-${z.anschaffungAb.slice(0, 7)}${z.maxListenpreis ? `-bis-${z.maxListenpreis}` : ""}`, {
    titel: `Dienstwagen ${z.antrieb === "elektro" ? "Elektro" : "Hybrid"}: Anteil am Listenpreis${z.maxListenpreis ? ` bis ${euro(z.maxListenpreis)}` : z.antrieb === "elektro" ? " über der Grenze" : ""}${z.maxCo2 ? ` (höchstens ${z.maxCo2} g CO2/km oder mindestens ${z.minReichweiteKm} km elektrisch)` : ""}`,
    gebiet: "Lohn und Sozialversicherung", norm: z.quelle.split(";")[0], url: z.url, rhythmus: "Gesetz", p: S29, ...(z.bestaetigt === false ? { k: true as const } : {}),
  }, [{ gueltigAb: z.anschaffungAb, gueltigBis: z.anschaffungBis, wert: `${anteil(z.bruchteil)} des Listenpreises (Anschaffung im Zeitraum)` }], z.quelle, z.bestaetigt !== false)),
  eintrag("dienstwagenBatterieabzug", { titel: "Dienstwagen Elektro und Hybrid: Batterieabzug bei Anschaffung bis", gebiet: "Lohn und Sozialversicherung", norm: "§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 1 EStG", url: DIENSTWAGEN_BATTERIEABZUG_BIS.url, rhythmus: "Gesetz", p: S29 },
    [{ gueltigAb: null, gueltigBis: DIENSTWAGEN_BATTERIEABZUG_BIS.datum, wert: "Abzug für das Batteriesystem, rechnet das Lohnbüro" }], DIENSTWAGEN_BATTERIEABZUG_BIS.quelle),
  ...(Object.keys(FEIERTAGE.laender) as (keyof typeof FEIERTAGE.laender)[]).map((l) => {
    const x = FEIERTAGE.laender[l];
    // Bayern am 10.10.2026, alle übrigen Länder am 29.10.2026 im amtlichen Landesportal im Wortlaut gelesen.
    return eintrag(`feiertage.${l}`, { titel: `Feiertage ${x.name} zusätzlich`, gebiet: "Feiertage", norm: x.quelle, url: x.url, rhythmus: "Gesetz", p: l.startsWith("BY") ? G : P29 },
      [{ gueltigAb: null, gueltigBis: null, wert: x.tage.map((t: FeiertagRegel) => (t.nurJahr ? `${t.name} (nur ${t.nurJahr})` : t.ab ? `${t.name} (seit ${t.ab})` : t.name)).join(", ") }], x.quelle);
  }),
];

function eintrag(id: string, a: Angabe, werte: Zeitwert[], quelle: string, bestaetigtInWerte = true): RegisterEintrag {
  const hinweis = a.befund ? `${quelle}. Befund: ${a.befund}` : quelle;
  const geprueftAm = a.p ?? null;
  const status: Status = a.k || !a.url || !geprueftAm || !bestaetigtInWerte ? "Kanzlei prüfen" : "bestätigt";
  const grund: Grund | null = status === "bestätigt" ? null
    : a.grund ?? (!a.url ? "keine Quelle" : a.k ? "Auslegung" : !bestaetigtInWerte && geprueftAm ? "Freigabe offen" : "nie geprüft");
  return {
    id, titel: a.titel, gebiet: a.gebiet, norm: a.norm, quelleUrl: a.url, hinweis, werte, rhythmus: a.rhythmus, stichtag: a.stichtag ?? null,
    geprueftAm, naechstePruefung: naechstePruefungFuer(a.rhythmus, geprueftAm), status, grund,
  };
}

/** Steht ein ausstehender Wert mit eigenem `rotAb` im Eintrag, ist die Prüfung erst am Tag davor fällig (Bekanntgabe kommt gesetzlich später). */
function mitRotAb(e: RegisterEintrag): RegisterEintrag {
  const rotAb = e.werte.map((w) => w.rotAb).filter((d): d is string => !!d).sort().pop();
  return rotAb && e.naechstePruefung < tagDavor(rotAb) ? { ...e, naechstePruefung: tagDavor(rotAb) } : e;
}

/** Das ganze Register: Werte aus WERTE, Zeitreihen, Aufbewahrung, Arbeitsschutz-Quoten und Feiertage. */
export const REGISTER: RegisterEintrag[] = [
  ...(Object.keys(W) as (keyof typeof WERTE)[]).map((id) => {
    const wert = WERTE[id] as { quelle: string; bestaetigt?: boolean };
    const a = W[id];
    return eintrag(id, a, [{ gueltigAb: a.ab ?? null, gueltigBis: a.bis ?? null, wert: wertText(wert) }], wert.quelle, wert.bestaetigt !== false);
  }),
  ...REIHEN.map((x) => ({
    ...mitRotAb(eintrag(x.id, { titel: x.titel, gebiet: x.gebiet, norm: x.norm, url: x.quelleUrl, rhythmus: "jährlich", p: x.geprueftAm ?? undefined, k: x.k, grund: x.grund, stichtag: "01.01." }, x.werte, x.hinweis ?? "")),
    ...(x.weitereQuellen && { weitereQuellen: x.weitereQuellen }), ...(x.pruefzahlen && { pruefzahlen: x.pruefzahlen }),
  })),
  ...listeEintraege,
];
