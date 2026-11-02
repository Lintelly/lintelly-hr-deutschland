/**
 * Datenmodell der Werkbank. Personen liegen als JSON in SQLite (lib/db.ts), damit das Modell
 * beim Bauen wachsen kann. Später 1:1 nach Supabase (Postgres jsonb) übertragbar.
 */
import type { ISODate } from "@/lib/regeln/datum";

export type Beschaeftigung = "vollzeit" | "teilzeit" | "werkstudent" | "azubi" | "minijob" | "praktikum";

/** Kind krank (Kinderkrankentage), Sonderurlaub und unbezahlter Urlaub zählen nicht für die BEM-Schwelle und die Krankenquote. */
export type Abwesenheit = {
  art: "krank" | "urlaub" | "bildungsurlaub" | "kind-krank" | "sonderurlaub" | "unbezahlt" | "wiedereingliederung"; von: ISODate; bis: ISODate;
  /** Stufenweise Wiedereingliederung: Stunden pro Tag je Stufe. Die Person bleibt arbeitsunfähig, die Tage zählen als krank (lib/wiedereingliederung.ts). */
  stufen?: { von: ISODate; bis: ISODate; stundenTag: number }[];
  /** Krankmeldung: Stand der Arbeitsunfähigkeitsbescheinigung, gesetzt von HR-Leitung oder Geschäftsführung (Paket D). Nie eine Diagnose. */
  au?: { stand: AuStand; am: ISODate; von: string };
  /** Urlaub: erster beziehungsweise letzter Tag nur halb, aus dem Antrag (zählt in der Saldenneuberechnung halb). */
  vonHalb?: "vormittag" | "nachmittag" | null;
  bisHalb?: "vormittag" | "nachmittag" | null;
};
export type AuStand = "liegt_vor" | "fehlt" | "eau_angefragt";

/** Weiterbildung einer Person (ISO/TS 30428): Datum (letzter Tag), Stunden und Kosten in Euro. Jede eingetragene Weiterbildung zählt als formal. */
export type Weiterbildung = { id: string; titel: string; am: ISODate; stunden: number; kosten: number };

export type Nebentaetigkeit = { id: string; beschreibung: string; stundenWoche: number; beginn: ISODate; stand: "angezeigt" | "genehmigt" | "abgelehnt"; angezeigtAm: ISODate; entschiedenAm?: ISODate; begruendung?: string };

export type Person = {
  id: string;
  /** Lintelly-Nummer (Strang 21), z. B. "P-0001": vergibt die Datenbank beim Anlegen, je Mandant fortlaufend, nie wiederverwendet. Nur lesen. */
  nummer?: string;
  vorname: string;
  nachname: string;
  rolle: string;
  team: string;
  art: Beschaeftigung;
  /** Anrede für Zeugnis und förmliche Schreiben. */
  anrede?: "Herr" | "Frau" | null;
  /**
   * Geschlecht für die Entgeltgleichheit (Vergütung Nr. 11), freiwillig: w, m, d (divers) oder k (keine Angabe),
   * vgl. § 22 Abs. 3 PStG. Nie aus der Anrede abgeleitet; ohne Angabe zählt die Person in der Auswertung nicht mit.
   */
  geschlecht?: "w" | "m" | "d" | "k" | null;
  /** Stufe im Gehaltsband (J Junior, M Professional, S Senior), gepflegt statt aus dem Titel geraten (Vergütung Nr. 16). */
  stufe?: "J" | "M" | "S" | null;
  /** Arbeitstage pro Woche, Grundlage für Urlaub und BEM-Zählung. Standard 5. */
  arbeitstage?: number;
  /** Arbeitstage-Muster: Wochentage, an denen die Person arbeitet (0 Sonntag bis 6 Samstag), z. B. [1, 3, 5]. Ohne Angabe bei 5 Tagen Montag bis Freitag (lib/regeln/arbeitstage.ts). */
  wochentage?: number[];
  /** Schwerbehindert oder gleichgestellt (nur wenn bekannt): Sonderkündigungsschutz. */
  schwerbehindert?: boolean;
  /** Aufenthaltstitel oder Arbeitserlaubnis (Drittstaaten): Art und Gültigkeit. Nur für die HR-Leitung sichtbar. */
  aufenthalt?: { gueltigBis: ISODate; art: string };
  /** Davon: nur gleichgestellt (§ 2 Abs. 3 SGB IX). Gleichgestellte haben keinen Zusatzurlaub (§ 208 SGB IX), Kündigungsschutz aber schon. */
  gleichgestellt?: boolean;
  /** Elternzeit verlangt oder laufend, ab Verlangen gilt Kündigungsschutz (§ 18 BEEG). */
  elternzeit?: { verlangtAm: ISODate; ab: ISODate; bis: ISODate; /** Geburtstag des Kindes (bei Verlangen vor der Geburt: errechneter Termin). Bestimmt die Frist des Verlangens. */ kindGeboren?: ISODate };
  /** Bei sachgrundloser Befristung: gab es früher schon ein Arbeitsverhältnis? null = unbekannt. */
  /** Früheres Arbeitsverhältnis bei uns: Ende und Art. true (alter Stand) = ja, ohne Datum. false = nein. null = unbekannt. */
  vorbeschaeftigung?: boolean | null | { ende: ISODate | null; art?: "befristet" | "unbefristet" | "unklar" };
  /** Einschätzung der Führungskraft, z. B. vor Probezeitende. */
  feedback?: { von: string; datum: ISODate; text: string };
  /** Praktikum: Art (Pflicht laut Studien- oder Ausbildungsordnung, Orientierung, freiwillig), Beginn und Ende. Nur bei art "praktikum"; ohne Befristung, sie läuft nicht über die Befristungsregeln. */
  praktikum?: { art: "pflicht" | "orientierung" | "freiwillig"; beginn: ISODate; ende: ISODate | null };
  /** Nebentätigkeiten, von der Person angezeigt und von der HR-Leitung genehmigt oder abgelehnt (Lücken Nr. 19). Stunden zählen mit der Hauptbeschäftigung zusammen (§ 2 Abs. 1 ArbZG). */
  nebentaetigkeiten?: Nebentaetigkeit[];
  /** Weiterbildungen, von der HR-Leitung eingetragen. Grundlage für Kosten, Quote und Stunden je FTE (lib/analyse/iso30414.ts). */
  weiterbildungen?: Weiterbildung[];
  /** Werkstudenten: Beginn der aktuellen Vorlesungszeit und Wochen über 20 Std. in den letzten 12 Monaten. */
  vorlesungAb?: ISODate;
  wochenUeber20Jahr?: number;
  /** Geschäftsführung als Organ (GmbH): eigener Lohn, Bonus und Urlaub in Lintelly, aber kein Arbeitnehmer. Zählt bei keiner Schwelle, Arbeitnehmerregeln greifen nicht, Eigenes prüft die HR-Leitung (Feedback Nick 15.10.2026 A9). */
  organ?: boolean;
  /** "startet": Vertrag unterschrieben, noch nicht begonnen. */
  status: "aktiv" | "startet" | "ausgetreten";
  /** Aus Excel oder Ordnern übernommen (Datum). Leere Felder heißen dann "unbekannt", nicht "nie". */
  importiert?: ISODate;
  eintritt: ISODate;
  /** Vertragsende, das rechtliche Ende des Arbeitsverhältnisses (Status, Lohn, Abmeldung, Aufbewahrung). */
  austritt?: ISODate;
  /** Letzter Arbeitstag, nur wenn er vor dem Vertragsende liegt (Freistellung). Sonst gilt `austritt`. Zugang endet am Tag danach (Paket A). */
  letzterArbeitstag?: ISODate;
  /** Je Fall: Zugang erst nach dem Vertragsende beenden statt nach dem letzten Arbeitstag. */
  zugangBisVertragsende?: boolean;
  austrittGrund?: AustrittGrund;
  /** Personalnummer Lohnbüro (aus dem Lohnbüro oder Personalsystem), getrennt von der Lintelly-Nummer. Eindeutiger Schlüssel beim Import. */
  personalnummer?: string;
  /** Id der Führungskraft, null = berichtet an die Geschäftsführung. */
  fuehrung?: string | null;
  geburtstag: ISODate;
  /** Einwilligung, dass der Geburtstag der Geschäftsführung angezeigt wird. */
  geburtstagSichtbar: boolean;
  /** Datum, an dem die Person der Anzeige des Geburtstags im Team zugestimmt hat (Art. 7 DSGVO). Beim Widerruf null. */
  geburtstagEinwilligungAm?: ISODate | null;
  /** Probezeit in Monaten, null = im Personio nicht gepflegt (Datencheck). */
  probezeitMonate: number | null;
  befristung: null | { start: ISODate; bis: ISODate | null; verlaengerungen: number; sachgrund: boolean };
  wochenstunden: number;
  /** Import ohne Spalte Wochenstunden: der Wert ist eine Annahme je Beschäftigungsart. FTE und Kennzahlen daraus rechnen dann nicht. */
  wochenstundenUnbekannt?: boolean;
  /** Bruttomonatsgehalt in Euro. */
  gehalt: number;
  /** Personenbild (UX-Fundament 11.10.2026): Art und Stand des hochgeladenen Fotos, Datei in data/bilder. Ohne: Initialen. URL über bildUrl (lib/person-bild.ts). */
  bild?: { typ: "jpeg" | "png" | "webp"; stand: string } | null;
  letzteGehaltsanpassung: ISODate | null;
  letztesGespraech: ISODate | null;
  urlaub: { anspruch: number; rest: number; /** Kalenderjahr, auf das das Konto gerechnet ist (Jahreswechsel bucht den Übertrag). */ jahr?: number; /** Rest aus dem Vorjahr, der in `rest` steckt. verfaelltAm: 31.03., null = kein Verfall (Hinweis nicht nachgewiesen). */ uebertrag?: { tage: number; verfaelltAm: ISODate | null }; hinweisAm: ISODate | null; erinnerungAm?: ISODate | null; letzterUrlaubBis: ISODate | null; /** Resturlaub wurde nicht angegeben (Import ohne Spalte): der Wert ist nur geschätzt, der Datencheck fragt nach. */ restUnbekannt?: boolean; /** Genehmigte Urlaubstage im Folgejahr: gehen beim Jahreswechsel vom neuen Anspruch ab, nicht vom Rest dieses Jahres. */ vorgemerkt?: number };
  abwesenheiten: Abwesenheit[];
  /** Werkstudenten: Stunden der letzten Wochen, ältester Wert zuerst. */
  wochenstundenVerlauf?: number[];
  /** Überstunden je Woche, letzte 6 Wochen. */
  ueberstunden?: number[];
  /** Überstunden, die der Vertrag im Monat erlaubt. null: keine Grenze (Pauschale, Führungskraft). Ohne Angabe gilt der Standardwert. */
  ueberstundenGrenzeMonat?: number | null;
  /** BEM-Ablauf: Zustimmung der Person mit Datum, Ergebnis und Abschluss. Aus dem Abschluss rechnet sich das Löschdatum (WERTE.bemLoeschfrist). */
  bem?: { zustimmungAm?: ISODate | null; ergebnis?: "laufend" | "abgeschlossen" | "abgelehnt"; abgeschlossenAm?: ISODate | null };
  /** Datum des letzten BEM-Angebots. */
  bemAngebotenAm?: ISODate | null;
  /** Funktion mit besonderem Kündigungsschutz (Betriebsrat, Datenschutzbeauftragte, Wehrdienst). Nur die HR-Leitung pflegt und sieht sie. */
  sonderfunktion?: Sonderfunktion[];
  mutterschutz?: { mitteilungAm: ISODate; entbindungstermin: ISODate; behoerdeGemeldet: boolean; gefaehrdungsbeurteilung: boolean; /** Tatsächliche Entbindung (Frist rechnet ab hier), Früh-, Mehrlings- oder Behinderungsfall mit verlängerter Schutzfrist, Fehlgeburt mit Schwangerschaftswoche (bestimmt Schutzfrist und Kündigungsverbot, § 3 Abs. 5, § 17 Abs. 1 Nr. 2 MuSchG). */ entbindungAm?: ISODate; verlaengert?: boolean; fehlgeburtAm?: ISODate; fehlgeburtWoche?: number };
  /** Anschrift der Person für Arbeitsvertrag und Nachweis (§ 2 Abs. 1 Nr. 1 NachwG), z. B. "Lindenweg 4, 60318 Frankfurt am Main". */
  anschrift?: string;
  /** E-Mail-Adresse, Pflicht für alle Beschäftigten (Nick 18.10.2026): Anmeldung und Wiederherstellung laufen darüber (lib/email.ts). Ohne Angabe meldet der Datencheck. */
  email?: string;
  /** Fehlende Pflichtangaben im Vertrag nach Nachweisgesetz (Datencheck). */
  nachweisLuecken?: string[];
  interessen?: string;
  /** Interessen wurden von der Person selbst angegeben (nur dann werden sie gezeigt). */
  interessenSelbst?: boolean;
  /**
   * Die Person hat gebeten, ein Thema nicht an die Geschäftsführung weiterzugeben.
   * Ohne diesen Wunsch sieht die Geschäftsführung als Arbeitgeber auch Gesundheit und Schwangerschaft (Nick 06.10.2026).
   */
  verschwiegenheit?: { seit: ISODate; thema: string };
  /** Stammdaten aus Personio für Lohn und Meldungen. In der Demo erfunden. */
  stammdaten?: { svNummer: string; steuerId: string; steuerklasse: string; krankenkasse: string; iban: string; /** Konfession leer = unbekannt (nicht „keine“); Kinderfreibeträge null = unbekannt (nicht 0). */ konfession: string; kinderfreibetrag: number | null };
  /** Arbeitet ständig am Computer mit personenbezogenen Daten (zählt für die Pflicht zur Datenschutzbeauftragten, § 38 Abs. 1 BDSG). Ohne Angabe gilt der Standard aus der Beschäftigungsart. */
  dsbStaendig?: boolean;
  /** Aufgaben laut Stellenbeschreibung (Personio oder Stellen-Modul in Lintelly). Grundlage für Zeugnisse. */
  aufgaben?: string[];
  /** Jobprofil aus dem Modul Stellen. Geht dem Feld aufgaben vor. */
  jobprofilId?: string | null;
};

/** Austrittsgrund (Paket A). Texte in lib/module/plaene.ts GRUND_TEXT. "arbeitgeber" ist die Kündigung durch die Firma, "vergleich" auch das Ende per Gericht. */
export type AustrittGrund = "arbeitnehmer" | "arbeitgeber" | "aufhebung" | "befristung" | "rente" | "tod" | "vergleich" | "sonstiges";

export type Sonderfunktion = "betriebsrat" | "schwerbehindertenvertretung" | "wahlvorstand" | "wahlbewerber" | "datenschutzbeauftragte" | "wehrdienst";




export type Akteur = "agent" | "regel" | "mensch" | "system";

export type Schritt = { art: Akteur; text: string; status: "wartet" | "laeuft" | "fertig" | "fehler"; warum?: string };

export type Vorgang = {
  id: string;
  typ: string;
  titel: string;
  personId: string | null;
  status: "laeuft" | "pruefung" | "entscheidung" | "fertig" | "fehler" | "abgebrochen";
  erstellt: string;
  /** Tag, an dem der Vorgang fertig wurde (für "gestern fertig geworden"). */
  fertigAm?: string;
  /** Warum der Vorgang abgebrochen wurde (Dokument verworfen, Antrag zurückgezogen, Austritt zurückgenommen). */
  abbruchGrund?: string;
  schritte: Schritt[];
  /**
   * Der Schrittplan als Daten (Umbau Schritt 11): Art "daten" mit den Schritten selbst, sonst der Baumeister (lib/agent/lauf.ts,
   * registriereAblauf) und seine Eingaben. Daraus baut jede Fortsetzung die Schritte neu, auch nach einem Neustart (HR-Tag Nr. 5).
   */
  plan?: { art: string; daten: Record<string, unknown> };
  /** Ältere Vorgänge (vor dem 11.10.2026): Entscheidung, aus der der Ablauf gebaut wurde. Gilt wie plan { art: "entscheidung" }. */
  quelle?: { entscheidungId: string; varianteId: string; kommentar?: string };
  /** Was die Schritte bisher abgelegt haben (Dokument-Id, letzter Tag ...). */
  ctx?: Record<string, string>;
  /** Wer gerade einen automatischen Schritt ausführt: Prozess und Beginn. Leer, solange keiner läuft. */
  lauf?: { schritt: number; prozess: string; seit: string };
  /** Vertrauliche Vorgänge (Gesundheit, Schwangerschaft, persönliche Fragen) sieht die Geschäftsführung nur als Thema. */
  vertraulich?: string;
};

export type Variante = {
  id: string; titel: string; folgen: string[]; empfohlen?: boolean; nurInfo?: boolean;
  /** Was nach dem Klick passiert, wenn es nicht der Weg über Unterlagen und Unterschrift ist (z. B. "Geht sofort an Felix in Mein Lintelly"). */
  danach?: string;
  /** Ohne eigenen Grund in der Notiz lehnt der Server ab: der Grund steht wörtlich im Schreiben. */
  grundPflicht?: boolean;
};

export type Entscheidung = {
  id: string;
  titel: string;
  kontext: string;
  /** Die Zeilen des Rechenwegs einzeln (kontext ist sie nur zusammengesetzt). */
  rechenweg?: string[];
  personId: string | null;
  bis: ISODate;
  varianten: Variante[];
  status: "offen" | "entschieden";
  gewaehlt: string | null;
  quelle?: string;
  /** Stabile Kennung für "entschieden" und "zurückgestellt", unabhängig vom Datum in der id. */
  schluessel?: string;
  /** Vorschlag aus MCP oder CLI: nur vorgemerkt, ausgeführt wird erst mit dem Klick in der App (lib/werkzeug-vorschlag.ts). */
  werkzeugVorschlag?: { variante: string; von: string; am: string; notiz?: string };
  /** Betrifft die Geschäftsführung selbst: entscheidet nur die HR-Leitung (A9). */
  nurHr?: boolean;
  /** Urlaubsantrag, der bei einer Führungskraft liegen geblieben ist: an sie zurückgeben (Nick 16.10.2026). */
  zurueckAn?: { id: string; name: string };
};

export type Aufgabe = {
  id: string;
  titel: string;
  art: "dokument" | "frage" | "pruefung" | "unterschrift";
  personId: string | null;
  vorgangId: string | null;
  status: "offen" | "freigegeben" | "zurueck";
  /** Spätester Termin, danach sortiert die Arbeitsliste. Ohne Datum ans Ende. */
  faellig?: ISODate;
  erstellt: string;
  notiz?: string;
  /** Wer die Aufgabe erledigt. Standard: HR-Leitung. */
  zustaendig?: "hr" | "gf";
  /** Prüfpunkte, die vor der Freigabe einzeln bestätigt werden müssen. */
  pruefliste?: Pruefpunkt[];
  /** Zu prüfender Inhalt, z. B. Antwortentwurf. */
  inhalt?: string;
  dokumentId?: string;
  /** Das Dokument zu dieser Aufgabe wurde erwartet, ist aber nicht entstanden: Freigabe nicht möglich. */
  dokumentFehlt?: boolean;
  /** Tag der Freigabe (Berliner Tag bzw. Demo-Tag), für die Zählung "heute erledigt". */
  erledigtAm?: ISODate;
  /** Chat, in den eine freigegebene Antwort zurückgeht. */
  chatId?: string;
  /** Gesprächsabschnitt vor der Frage, als Kopie bei der Übergabe, damit die HR-Leitung Rückfragen wie "ja genau sophie" versteht (Nick 24.10.2026). */
  verlauf?: { von: ChatNachricht["von"]; text: string; ts: string }[];
  kommentar?: string;
  /** Aus einem Befund entstanden (z. B. von der Geschäftsführung weitergegeben). Das Ergebnis wird am Befund angezeigt. */
  befundId?: string;
  /** Nur die HR-Leitung darf Inhalt und Beteiligte sehen (z. B. Hinweisgebermeldung, § 8 HinSchG). Die Geschäftsführung sieht eine neutrale Seite. */
  nurHr?: boolean;
  /** Freigabe-Schritt eines Workflows: freigeben oder ablehnen, abgelehnt endet der Workflow (Nick 24.10.2026). */
  workflowFreigabe?: boolean;
  /** Die Geschäftsführung möchte das Ergebnis wissen: Abschluss nur mit kurzer Rückmeldung. */
  rueckmeldung?: boolean;
  /** Die Aufgabe fragt das tatsächliche Zugangsdatum ab (Übergabe der Kündigung). Ohne Datum keine Freigabe. */
  fragtZugang?: boolean;
  zugang?: ISODate;
  /** Entwurf der Geschäftsführung für ein rechtlich wichtiges Dokument: die HR-Leitung erstellt es mit einem Klick (lib/dokumente/rechtlich.ts). */
  dokumentVorschlag?: { typ: DokumentTyp; eingaben: Record<string, string> };
  /** Die Aufgabe prüft diesen Änderungswunsch zu Stammdaten (Karte mit Übernehmen und Ablehnen). */
  wunschId?: string;
  erledigtVon?: string;
  /** Was die Freigabe in den Daten bewirkt. */
  effekt?: { typ: "urlaub-hinweis"; personIds: string[] } | { typ: "urlaub-erinnerung"; personIds: string[] } | { typ: "bem-angeboten"; personId: string } | { typ: "mutterschutz-gemeldet"; personId: string } | { typ: "urlaub-gutschreiben"; personId: string; von: ISODate; bis: ISODate };
};

export type ProtokollEintrag = {
  id: number;
  ts: string;
  /** Datum in der Demo-Zeit. */
  tag: ISODate;
  akteur: Akteur;
  wer: string;
  text: string;
  personId: string | null;
  vorgangId: string | null;
  /** Kennung eines Externen (Freelancer-Id, Strang 21): Auskunft und Löschung finden den Eintrag darüber, nicht über den Namen. */
  externId?: string | null;
  /** Wenn gesetzt: Thema, das die Geschäftsführung statt des Textes sieht. */
  vertraulich?: string | null;
  /** Nur im Live-Kanal, nicht gespeichert: wer den nächsten Schritt tun muss, und die Aufgabe dazu (für Hinweis und Link). */
  zustaendig?: "gf" | "hr";
  aufgabeId?: string;
};

export type LiveEvent =
  | { typ: "protokoll"; eintrag: ProtokollEintrag }
  | { typ: "vorgang"; vorgang: Vorgang }
  | { typ: "refresh"; grund: string };

export type Pruefpunkt = {
  id: string;
  text: string;
  /** Ergebnis der automatischen Prüfung: true gefunden, false fehlt, null nicht automatisch prüfbar. */
  auto: boolean | null;
  /** Vom Menschen bestätigt. */
  ok: boolean;
  quelle?: string;
  /** Erklärt, was bei auto === false zu tun ist (z. B. Frist trägt nicht mehr). */
  hinweis?: string;
};

export type DokumentTyp =
  | "arbeitsvertrag" | "aenderungsvertrag" | "zwischenzeugnis" | "endzeugnis" | "abmahnung" | "probezeitkuendigung"
  | "bem-einladung" | "urlaub-hinweis" | "glueckwunsch" | "freelancer-angebot" | "vertragsende-mitteilung"
  | "kuendigung-ordentlich" | "kuendigung-fristlos" | "aufhebungsvertrag" | "elternzeit-bestaetigung" | "teilzeit-gespraech" | "teilzeit-ablehnung"
  | "befristungsverlaengerung" | "werkstudentenvertrag" | "ausbildungsvertrag" | "freelancervertrag" | "erfindungsmeldung" | "praktikumsvertrag"
  | "verzicht-wettbewerb" | "wiedereingliederungsplan" | "entgeltumwandlung" | "nebentaetigkeit-bescheid"
  | "arbeitsmittel-uebergabe" | "arbeitsmittel-rueckgabe" | "dienstwagen-ueberlassung" | "kostenbeteiligung"
  | "beschaeftigungsbestaetigung" | "unbezahlter-urlaub" | "rufbereitschaft-nachtrag" | "austrittsbestaetigung";

/** "verworfen": zurückgezogener Entwurf (Dokumente Nr. 15), bleibt für das Protokoll, fehlt in Liste und Doppelt-Prüfung. */
export type DokumentStatus = "entwurf" | "pruefung" | "freigegeben" | "unterschrieben-gf" | "versendet" | "geoeffnet" | "abgeschlossen" | "verworfen";

/**
 * Englische Fassung eines Abschnitts (Zweisprachigkeit, Nick 23.10.2026): feste Texte aus Vorlage und Baustein. `ki`: freie Eingaben
 * darin hat die KI übersetzt (sichtbar markiert). `offen`: freie Eingabe ohne Übersetzung oder deutscher Text danach geändert.
 */
export type AbschnittEn = { ueberschrift: string; text: string; ki?: boolean; offen?: boolean };
export type Abschnitt = { ueberschrift: string; text: string; en?: AbschnittEn };

export type Dokument = {
  id: string;
  typ: DokumentTyp;
  titel: string;
  personId: string | null;
  status: DokumentStatus;
  version: number;
  /** Betreff bei Briefen (DIN 5008). */
  betreff?: string;
  /** Englischer Betreff bei zweisprachigen Briefen. */
  betreffEn?: string;
  abschnitte: Abschnitt[];
  pruefliste: Pruefpunkt[];
  erstellt: string;
  geaendert: string;
  /** Wer den Entwurf geschrieben hat: Claude oder geprüfte Vorlage. */
  quelle: "ki" | "vorlage";
  eingaben?: Record<string, string>;
  versionen: { version: number; ts: string; wer: string; notiz: string; abschnitte: Abschnitt[] }[];
  /** Die Unterschrift gilt nur für genau eine Fassung: Version und Prüfwert des Inhalts stehen dabei (Dokumente Nr. 2). */
  signatur?: { gf?: { name: string; ts: string; version?: number; hash?: string }; empfaenger?: { name: string; ts: string; papier?: true } };
  /** Wer schreibt, wenn keine Unterschrift der Geschäftsführung nötig ist (Glückwunsch, Hinweis): dann unterschreibt diese Stelle (Feedback Nick 14.10.2026 Nr. 24). */
  absender?: "gf" | "hr";
  /** Datum des Schreibens (Dokumente Nr. 10). Ohne Angabe: Tag der Unterschrift der Geschäftsführung, vorher der heutige Tag. */
  schreibdatum?: ISODate;
  /** Zurückgezogen mit Grund (Dokumente Nr. 15). */
  verworfen?: { grund: string; wer: string; ts: string };
  vorgangId?: string;
  /** Kommentare der HR-Leitung, die nicht in den Text gehören (z. B. wenn die KI nicht antwortet). Nie im PDF oder Word. */
  notizen?: { ts: string; wer: string; text: string }[];
  /** Lesebestätigung angefordert (Paket H): die Person bestätigt in Mein Lintelly, Stand in lib/lesebestaetigung.ts. */
  lesen?: { seit: string; von: string };
};

/**
 * Bestätigungskarte von Frag Lintelly (Agent, 21.10.2026): was passiert, für wen, mit welchen Werten. Werte stammen aus der geprüften
 * Eingabe des Werkzeugs, nie aus dem Text der KI. Ausgeführt wird erst mit "Bestätigen" (lib/agent-auftrag.ts).
 */
export type AgentKarte = {
  id: string; titel: string; fuerWen: string | null; werte: { label: string; wert: string }[];
  /** Wie es sich zurücknehmen lässt, null: nicht rückgängig. */ rueckgaengig: string | null;
  /** Rechtlich heikel: was das Werkzeug stattdessen tut (nur Entwurf, nur vormerken). */ heikel: string | null;
  /** Formular der App mit denselben Werten (Ändern, oder weitermachen, wenn es nicht durchging). */ formular?: string;
  bis: string;
  /** Stand nach dem Klick ("fehler": bestätigt, aber nicht durchgegangen). */ erledigt?: "ja" | "abgebrochen" | "fehler";
};

export type ChatNachricht = {
  id: string;
  chat: string;
  von: "nutzer" | "lintelly" | "hr";
  text: string;
  ts: string;
  quellen?: string[];
  status?: "wartet-auf-hr" | "bei-hr" | "beantwortet";
  aufgabeId?: string;
  nachfragen?: string[];
  /** Text hat die KI geschrieben (Kennzeichnung nach Art. 50 KI-Verordnung). */
  ki?: boolean;
  /** Listenantwort: jede Zeile führt zur Person (Frag Lintelly Nr. 12). */
  liste?: { personId: string; wert: string }[];
  /** Mehr als zehn Zeilen: so viele weitere, mit Link zur Übersicht. */
  weitere?: { anzahl: number; href: string };
  /** Quellen mit Ziel, soweit eines bekannt ist (Profil, Handbuchabschnitt, Normtext). */
  quellenLinks?: { label: string; href: string }[];
  /** Nächste Schritte als Knöpfe (z. B. "Kündigung für Marie vorbereiten"), nur feste Ziele in der App. */
  aktionen?: { label: string; href: string }[];
  /** Lintelly hat zurückgefragt und wartet auf Ja oder Nein (z. B. "Meinst du einen Unfall bei der Arbeit?"). */
  offeneFrage?: { art: "unfall"; text: string };
  /** Antwort der HR-Leitung, die die Person noch nicht gesehen hat. */
  ungesehen?: boolean;
  /** Bestätigungskarte des Agenten (Frag Lintelly). */
  auftrag?: AgentKarte;
  /** Seite, die der Agent geöffnet hat (der Browser springt beim Eintreffen der Antwort). */
  sprung?: string;
  /** Handbuchstand, aus dem geantwortet wurde (Frag Lintelly Nr. 4). */
  handbuchStand?: string;
  /** "hinschg": Meldung nach dem Hinweisgeberschutzgesetz, bleibt bis drei Jahre nach Abschluss des Verfahrens (§ 11 Abs. 5 HinSchG), nicht nur sechs Monate. */
  aufbewahrung?: "hinschg";
  /** Heikle Frage oder ihre feste Antwort: geht nie an die KI, auch nicht als früherer Verlauf. */
  heikel?: boolean;
};

/** Offene Stelle. jobprofilId und stufe bestimmen die Gehaltsspanne für die Ausschreibung (Art. 5 RL (EU) 2023/970). */
export type Stelle = { id: string; titel: string; team: string; start: ISODate; gehalt: number; status: "offen" | "interviews" | "angebot" | "besetzt"; jobprofilId?: string | null; stufe?: "J" | "M" | "S" | null };

/* ---------- Module Stimmung, Leistung, Ein- und Austritt (07.10.2026) ---------- */

/** Treiber einer Befragung, angelehnt an Culture Amp, Officevibe und Peakon. */
export type Treiber = "enps" | "anerkennung" | "wachstum" | "fuehrung" | "arbeitslast" | "zugehoerigkeit" | "sinn" | "kommunikation" | "ausstattung" | "wohlbefinden";

export type Frage = { id: string; treiber: Treiber; text: string; skala: "0-10" | "1-5" | "frei" };








export type Rolle = "hr" | "fuehrung" | "it" | "buddy" | "person" | "gf" | "lintelly";

/** Ein- oder Austrittsplan mit Aufgaben relativ zum Stichtag (erster oder letzter Arbeitstag). */
export type Plan = {
  id: string;
  art: "eintritt" | "austritt";
  personId: string;
  stichtag: ISODate;
  buddyId?: string | null;
  grund?: AustrittGrund | null;
  /** Kündigung durch die Firma: Grund aus dem Kündigungsdialog. */
  kuendigungsArt?: "betriebsbedingt" | "personenbedingt" | "verhaltensbedingt";
  /** Austritt: Vertragsende, wenn es nach dem letzten Arbeitstag (`stichtag`) liegt. Daran hängen Abmeldung und Schlussabrechnung. */
  vertragsende?: ISODate;
  /** Austritt: bis hierhin sehen nur Geschäftsführung und HR-Leitung den Austritt (Paket A). */
  kommuniziert?: { am: ISODate; von: string };
  /** Austritt: Führungskraft, die vor der Kommunikation bewusst einbezogen wurde. */
  einbezogen?: { personId: string; am: ISODate; von: string };
  /**
   * Austritt: Übergabe festgelegt, an wen (null = Geschäftsführung). `ab`: Übergabetag; sie wirkt an ihm, frühestens mit der Kommunikation,
   * `wirksam` sagt, wann umgehängt wurde. Ohne `ab` (vor dem 18.10.2026 bestätigt) galt sie sofort.
   */
  uebergabe?: { an: string | null; am: ISODate; von: string; ab?: ISODate; wirksam?: ISODate };
  aufgaben: PlanAufgabe[];
  status: "laeuft" | "fertig";
  erstellt: string;
  /** Austritt: Tag, an dem die Kündigung zuging bzw. die Person vom Ende erfuhr. Daraus rechnen die Meldefristen (§ 38 SGB III). */
  kenntnis?: ISODate | null;
  /** Austritt: der Vertrag enthält Wettbewerbsverbot (M2) oder Kundenschutz (M3), beim Anlegen festgehalten. */
  wettbewerb?: boolean;
  /** Eintritt: Ablauf des ersten Tages, Ort und Mitbringliste, von der Führungskraft pflegbar. Ohne Angabe gilt der Standard. */
  tag1?: { ablauf?: [string, string][]; ort?: string; mitbringen?: string[]; antwortStunden?: number };
};

export type PlanAufgabe = {
  id: string;
  phase: string;
  text: string;
  wer: Rolle;
  faellig: ISODate;
  /** Gesetzliche Frist mit Norm: bei Verzug Befund in Fristen und HR-Tag. */
  pflicht?: string;
  erledigt: boolean;
  erledigtAm?: ISODate;
  erledigtVon?: string;
  /** Notiz zur Erledigung, z. B. "Zugang zum 14.10. persönlich übergeben". */
  notiz?: string;
  hinweis?: string;
  /** Lintelly erledigt das selbst (z. B. Willkommensmail entwerfen, Zugänge melden). */
  automatisch?: boolean;
};

/**
 * Jobprofil (Stellenbeschreibung) je Rolle. Grundlage für Arbeitsvertrag (§ 1 Tätigkeit), Zeugnis (Aufgaben,
 * Verantwortung), Beurteilung (Soll-Stufen) und Stellenanzeigen. Nick 07.10.2026: "jobs mit jobdescription".
 */
export type Jobprofil = {
  id: string;
  titel: string;
  team: string;
  /** Wofür es die Stelle gibt, ein bis zwei Sätze. */
  zweck: string;
  aufgaben: { text: string; anteil: number }[];
  verantwortung: string[];
  anforderungen: string[];
  /** Soll-Stufe je Kompetenz (1 Lernend bis 4 Prägend), Schlüssel aus KOMPETENZEN. */
  soll: Record<string, number>;
  berichtetAn: string;
  fuehrung?: { teamgroesse: number } | null;
  /** Rollen aus Personio, die zu diesem Profil gehören. */
  rollen: string[];
  version: number;
  geaendert: string;
  geaendertVon: string;
  /** Frühere Fassungen mit Datum und Autor, damit später nachvollziehbar ist, welche Aufgaben zu einem Zeitpunkt galten. */
  verlauf?: { version: number; geaendert: string; geaendertVon: string; titel: string; zweck: string; aufgaben: { text: string; anteil: number }[]; verantwortung: string[]; anforderungen: string[] }[];
};

/* ---------- Anträge, Arbeitszeit, Löschung (08.10.2026) ---------- */

/** Antrag einer Person: Urlaub startet bei der Person, Teilzeit und Pflege laufen mit gesetzlicher Frist. */
export type AntragArt = "urlaub" | "bildungsurlaub" | "teilzeit" | "brueckenteilzeit" | "pflegezeit" | "familienpflegezeit";
export type Antrag = {
  id: string;
  art: AntragArt;
  personId: string;
  /** Tag, an dem der Antrag bei uns einging (Fristbeginn). */
  eingang: ISODate;
  /** Urlaub: erster und letzter Urlaubstag. Teilzeit und Pflege: gewünschter Beginn und gewünschtes Ende (optional). */
  von: ISODate;
  bis: ISODate | null;
  vertretung?: string | null;
  /** Urlaub: erster beziehungsweise letzter Tag nur halb (der andere Teil des Tages wird gearbeitet). */
  vonHalb?: "vormittag" | "nachmittag" | null;
  bisHalb?: "vormittag" | "nachmittag" | null;
  /** Teilzeit und Brückenteilzeit: gewünschte Wochenstunden. */
  wochenstunden?: number | null;
  /** Brückenteilzeit: gewünschte Verteilung auf Wochentage (0 Sonntag bis 6 Samstag), optional (§ 8 Abs. 2 Satz 2 TzBfG: "soll"). */
  wochentage?: number[] | null;
  /** Brückenteilzeit abgelehnt aus betrieblichen Gründen oder wegen der Zumutbarkeitsgrenze: daran hängt die Sperrfrist (§ 9a Abs. 5 TzBfG). */
  abgelehntWegen?: "betrieblich" | "zumutbarkeit" | null;
  status: "offen" | "genehmigt" | "abgelehnt" | "gespraech" | "zurueckgezogen" | "storniert";
  /** Genehmigter Urlaub: Tag, an dem die Person um Storno gebeten hat. Bis zur Zustimmung gilt der Urlaub weiter. */
  stornoAngefragt?: ISODate | null;
  /**
   * Genehmigter Urlaub: wer die Genehmigung zurücknehmen will (`durch` wie entschiedenDurch). Die Festlegung ist für die Person bindend, darum
   * gilt der Urlaub weiter, bis sie zustimmt (Prüffund T-12).
   */
  ruecknahmeAngefragt?: { am: string; von: string; durch: string } | null;
  /** Status "gespraech": Tag, an dem das Gespräch festgehalten wurde. Vorher ruht die Entscheidung (Nick 16.10.2026). */
  gespraechAm?: ISODate | null;
  /** Urlaub: Tag, an dem die Geschäftsführung den liegengebliebenen Antrag an die Führungskraft zurückgegeben hat. */
  zurueckAm?: ISODate | null;
  entschiedenAm?: ISODate | null;
  entschiedenVon?: string | null;
  /** Zeitpunkt der Entscheidung (ISO) und wer entschied: Personen-Id der Führungskraft, "gf" oder "hr". Grundlage der Rücknahme binnen 24 Stunden (Paket D). */
  entschiedenUm?: string | null;
  entschiedenDurch?: string | null;
  begruendung?: string | null;
};

/** Ein Arbeitsblock im Tag: von und bis als Uhrzeit (Europe/Berlin). Liegt "bis" vor "von", endet der Block am Folgetag. null = läuft noch. */
export type ZeitBlock = { von: string; bis: string | null };

/**
 * Eine Arbeitsschicht einer Person. `tag` ist der Tag des Schichtbeginns (eine Nachtschicht gehört zum Starttag).
 * `bloecke` sind die gestempelten oder eingetragenen Arbeitsblöcke, die Lücken dazwischen sind Unterbrechungen.
 * Ohne `bloecke` gilt ein Block aus `beginn` und `ende`. `pauseMin` ist eine von Hand eingetragene Pause ohne Uhrzeit.
 * Vertrauensarbeitszeit zählt mit `dauerMin` (Dauer), ohne Dauer gilt der Tag als offen.
 */
export type Zeiteintrag = {
  id: string;
  personId: string;
  tag: ISODate;
  beginn: string | null;
  ende: string | null;
  pauseMin: number;
  vertrauen?: boolean;
  dauerMin?: number | null;
  bloecke?: ZeitBlock[];
  /** Stempeluhr: die Pause läuft gerade (der letzte Block ist geschlossen). */
  pausiert?: boolean;
  /** Später eingetragen oder offline gestempelt: wird im Wochenblatt gekennzeichnet. */
  nachtraeglich?: boolean;
};

/** Unveränderlicher Verlauf zu einem Zeiteintrag (BAG 13.09.2022, 1 ABR 22/21): jeder Schreibvorgang bleibt mit altem und neuem Stand stehen. */
export type ZeitStand = Pick<Zeiteintrag, "tag" | "beginn" | "ende" | "pauseMin" | "vertrauen" | "dauerMin" | "bloecke" | "pausiert">;
export type ZeitKorrektur = {
  id: string;
  eintragId: string;
  personId: string;
  tag: ISODate;
  art: "stempel" | "nachtrag" | "korrektur" | "ende-nachgetragen";
  vorher: ZeitStand | null;
  nachher: ZeitStand;
  grund: string | null;
  wer: string;
  /** Zeitpunkt in UTC (ISO), unabhängig von Zeitzone und Demo-Uhr. */
  am: string;
  nachgereicht?: boolean;
};
/** Korrekturwunsch einer Person, den die Führungskraft oder die HR-Leitung bestätigt. Erst danach ändert sich der Zeiteintrag. */
export type ZeitAntrag = {
  id: string; personId: string; tag: ISODate; beginn: string; ende: string; pauseMin: number; grund: string;
  /** Mehrere Blöcke aus der Zeile (Strang 19); `beginn` und `ende` sind dann erster Beginn und letztes Ende. */
  bloecke?: ZeitBlock[];
  /** Vertrauensarbeitszeit: gewünschte Dauer statt Uhrzeiten (`beginn` und `ende` leer). */
  dauerMin?: number;
  status: "offen" | "bestaetigt" | "abgelehnt" | "zurueckgezogen"; gestelltAm: ISODate; entschiedenVon?: string | null; entschiedenAm?: ISODate | null; begruendung?: string | null;
  /** Wer zuletzt entscheiden sollte (Strang 26, lib/module/zeitentscheid.ts). Springt es zur HR-Leitung, gibt es eine Mitteilung. */
  entscheidet?: "fuehrung" | "hr";
  /** Wer entschieden hat: die HR-Leitung sieht die Entscheidungen der Führungskräfte auf /arbeitszeit. */
  entschiedenAls?: "fuehrung" | "hr";
};
/** Abgeschlossene Woche (Montag als Id): danach ändert nur die HR-Leitung, mit Grund. */
export type ZeitAbschluss = { id: string; am: string; wer: string };

/** Ein Gerät, auf dem die Handy-Karte bestätigt wurde. Der Gerätecode liegt nur als Prüfwert (SHA-256) in der Datenbank. */
export type Geraet = { id: string; personId: string; hash: string; label: string; erstellt: ISODate; zuletzt: ISODate; bis: ISODate };

/**
 * Änderungswunsch zu Stammdaten der Person. Die HR-Leitung übernimmt oder lehnt ab (Paket H: mit "gültig ab" und den Feldern aus Bank und Steuer).
 * Übernommen mit `gueltigAb` in der Zukunft: Der Nachtlauf setzt den Wert an diesem Tag und trägt `wirksamAm` ein (lib/aenderungswunsch-lauf.ts).
 */
export type Aenderungswunsch = {
  id: string; personId: string; feld: "anschrift" | "name" | "bankverbindung" | "steuerklasse" | "krankenkasse" | "kinderfreibetrag" | "konfession"; neu: string;
  status: "offen" | "uebernommen" | "abgelehnt"; gestelltAm: ISODate; entschiedenVon?: string | null; entschiedenAm?: ISODate | null;
  /** Ab wann die neue Angabe gilt. Altbestand ohne Angabe: ab Übernahme. */ gueltigAb?: ISODate; wirksamAm?: ISODate | null;
  /** Wert vor dem Wirksamwerden, nur bis zum Ende des Entscheidungstags für „Rückgängig“ (lib/aenderungswunsch-lauf.ts). */ vorher?: string | null;
};
/** Kurze Meldung in der Personen-Ansicht (neuer Antrag, Entscheidung, Krankmeldung). Ohne Gründe und ohne Gesundheitsdaten. */
export type Mitteilung = { id: string; fuerPersonId: string; text: string; link: string | null; am: string; gelesen: boolean };

/** Vorgemerkte Löschung eines Dokuments nach Ablauf der Aufbewahrungsfrist. Im Protokoll steht nur Art und Datum. */
export type Loeschvermerk = { id: string; dokumentId: string; personId: string | null; art: string; vorgemerktAm: ISODate; vorgemerktVon: string; geloeschtAm?: ISODate; geloeschtVon?: string };
