/**
 * Gesetzes- und Steuerwerte an genau einer Stelle, jeweils mit Quelle und Stand.
 * Zu jedem Wert stehen Norm, amtliche Fundstelle, Prüfdatum, nächste Prüfung und Status im Register (lib/regeln/register.ts).
 * Der Test tests/register.test.ts schlägt an, wenn eine Prüfung fällig ist oder eine Rechtszahl außerhalb dieser Dateien im Code steht.
 * Ablauf und Jahreskalender: docs/rechtswerte.md. Stand: 10.10.2026.
 */
export const WERTE = {
  probezeitHoechstMonate: { wert: 6, quelle: "§ 622 Abs. 3 BGB" },
  probezeitKuendigungTage: { wert: 14, quelle: "§ 622 Abs. 3 BGB" },
  /** Probezeit im befristeten Vertrag im Verhältnis zur Laufzeit (§ 15 Abs. 3 TzBfG). Das Gesetz nennt keine Zahl: ohne Wert der Kanzlei gibt es nur den Pflicht-Haken. */
  probezeitBefristungAnteil: { wert: null, bestaetigt: false, quelle: "§ 15 Abs. 3 TzBfG (Verhältnis zur erwarteten Dauer der Befristung und zur Art der Tätigkeit, Maß nur durch die Kanzlei)" },
  kschgWartezeitMonate: { wert: 6, quelle: "§ 1 Abs. 1 KSchG" },
  kschgSchwelle: { wert: 10, quelle: "§ 23 Abs. 1 KSchG (mehr als 10 Arbeitnehmer)" },
  /** Altfall: Wer vor 2004 eingestellt wurde, behält den Kündigungsschutz, solange mehr als fünf solcher Alt-Arbeitnehmer im Betrieb sind (Wortlaut am 11.10.2026 gelesen). Lintelly zählt sie nicht, die Kanzlei prüft. */
  kschgAltfall: { schwelle: 5, beginnVor: "2004-01-01", bestaetigt: false, quelle: "§ 23 Abs. 1 Satz 2 und 3 KSchG (für Arbeitsverhältnisse, die vor dem 01.01.2004 begonnen haben, gilt der Kündigungsschutz schon bei mehr als fünf Arbeitnehmern; Arbeitnehmer mit Beginn ab 01.01.2004 zählen dabei bis zehn nicht mit), gesetze-im-internet.de/kschg/__23.html, gelesen am 11.10.2026; Zählung von Kanzlei prüfen lassen" },
  befristungSachgrundlosMonate: { wert: 24, quelle: "§ 14 Abs. 2 Satz 1 TzBfG" },
  befristungVerlaengerungenMax: { wert: 3, quelle: "§ 14 Abs. 2 Satz 1 TzBfG" },
  /** Innerhalb dieses Abstands sperrt Lintelly die sachgrundlose Befristung. Kein Freibrief danach: eine feste Frist gibt es seit BVerfG 1 BvL 7/14 nicht mehr (siehe vorbeschaeftigungVerbot). */
  vorbeschaeftigungAbstandMonate: { wert: 36, bestaetigt: false, quelle: "Lintelly-Sperrschwelle, keine gesetzliche Frist: § 14 Abs. 2 Satz 2 TzBfG verbietet die sachgrundlose Befristung bei jeder Vorbeschäftigung beim selben Arbeitgeber; die frühere Dreijahresgrenze des BAG hat das BVerfG verworfen (Beschluss vom 06.06.2018, 1 BvL 7/14), das BAG hat sie aufgegeben (Urteil vom 23.01.2019, 7 AZR 733/16). Kanzlei prüfen lassen" },
  /** Vorbeschäftigung vor einer sachgrundlosen Befristung: Ausnahme nur nach BVerfG Rn. 63. Beide Entscheidungen am 11.10.2026 im Original gelesen. */
  vorbeschaeftigungVerbot: { bestaetigt: false, quelle: "§ 14 Abs. 2 Satz 2 TzBfG; BVerfG, Beschluss vom 06.06.2018, 1 BvL 7/14, Rn. 63 (Ausnahme nur, wenn die Vorbeschäftigung sehr lang zurückliegt, ganz anders geartet war oder von sehr kurzer Dauer gewesen ist); BAG, Urteil vom 23.01.2019, 7 AZR 733/16 (ein Zeitablauf von acht Jahren genügt allein nicht, kein Vertrauensschutz auf die frühere Dreijahresgrenze)", url: "https://www.bundesarbeitsgericht.de/entscheidung/7-azr-733-16/" },
  befristungSchriftform: { quelle: "§ 14 Abs. 4 TzBfG" },
  urlaubUebertragBis: { monat: 3, tag: 31, quelle: "§ 7 Abs. 3 BUrlG" },
  urlaubHinweispflicht: { quelle: "BAG, Urteil vom 19.02.2019, 9 AZR 423/16 (Hinweispflicht), BAG, Urteil vom 20.12.2022, 9 AZR 266/20 (Verjährung erst nach Hinweis)" },
  urlaubSonderregel: { quelle: "§ 7 Abs. 3 BUrlG, § 24 MuSchG, § 17 BEEG, BAG, Urteil vom 07.08.2012, 9 AZR 353/10 (Kanzlei bestätigen lassen)" },
  urlaubKrankSonderTage: { wert: 90, quelle: "Lintelly-Schwelle: Krankmeldung ab 90 Tagen am Stück gilt als lange Krankheit, Kanzlei bestätigen lassen" },
  entgeltfortzahlungTage: { wert: 42, quelle: "§ 3 Abs. 1 EFZG (6 Wochen)" },
  entgeltAuskunftMonate: { wert: 2, bestaetigt: false, quelle: "Art. 7 Abs. 4 RL (EU) 2023/970 (Auskunft in angemessener Frist, spätestens zwei Monate nach dem Antrag); deutsche Umsetzung noch nicht bestätigt" },
  /** Löschfrist der BEM-Unterlagen nach Abschluss. Noch nicht bestätigt: vor dem Kundeneinsatz mit der Kanzlei festlegen. Der BEM-Brief übernimmt sie nur von hier. */
  bemLoeschfrist: { jahre: 3, bestaetigt: false, quelle: "Art. 5 Abs. 1 lit. e DSGVO, § 26 Abs. 3 BDSG (Frist noch nicht bestätigt, Kanzlei prüfen lassen)" },
  bemSchwelleTage: { wert: 42, zeitraumMonate: 12, quelle: "§ 167 Abs. 2 SGB IX (mehr als 6 Wochen in 12 Monaten)" },
  mutterschutzVorTage: { wert: 42, quelle: "§ 3 Abs. 1 MuSchG" },
  mutterschutzNachTage: { wert: 56, quelle: "§ 3 Abs. 2 MuSchG" },
  /** Vorzeitige Entbindung: die Schutzfrist nach der Geburt verlängert sich um die Tage, die vor der Geburt verloren gingen (höchstens mutterschutzVorTage). Wortlaut am 11.10.2026 gelesen. */
  mutterschutzVorzeitig: { quelle: "§ 3 Abs. 2 Satz 3 MuSchG (bei vorzeitiger Entbindung verlängert sich die Schutzfrist nach der Entbindung um den Zeitraum der Verkürzung der Schutzfrist vor der Entbindung nach Abs. 1 Satz 4)" },
  /** Schutzfrist nach einer Fehlgeburt je Schwangerschaftswoche (seit 01.06.2025). Gilt, soweit die Frau sich nicht ausdrücklich zur Arbeit bereit erklärt. Wortlaut am 11.10.2026 gelesen. */
  mutterschutzFehlgeburt: { stufen: [{ abWoche: 13, tage: 14 }, { abWoche: 17, tage: 42 }, { abWoche: 20, tage: 56 }], quelle: "§ 3 Abs. 5 Satz 1 MuSchG (Fehlgeburt ab der 13. Schwangerschaftswoche zwei Wochen, ab der 17. sechs Wochen, ab der 20. acht Wochen; nicht, soweit die Frau sich ausdrücklich zur Arbeit bereit erklärt, jederzeit widerruflich)" },
  /** Kündigungsverbot nach einer Fehlgeburt: nur nach der zwölften Woche, vier Monate (Monate aus mutterschutzKuendigungsverbotMonate). */
  mutterschutzFehlgeburtVerbot: { abWoche: 13, quelle: "§ 17 Abs. 1 Satz 1 Nr. 2 MuSchG (bis zum Ablauf von vier Monaten nach einer Fehlgeburt nach der zwölften Schwangerschaftswoche)" },
  mutterschutzMeldung: { quelle: "§ 27 Abs. 1 MuSchG (unverzüglich an die Aufsichtsbehörde)" },
  mutterschutzGefaehrdung: { quelle: "§ 10 MuSchG" },
  mutterschutzKuendigungsverbot: { quelle: "§ 17 MuSchG" },
  elternzeitAnmeldungWochen: { wert: 7, quelle: "§ 16 Abs. 1 BEEG" },
  werkstudentStunden: { wert: 20, quelle: "§ 6 Abs. 1 Nr. 3 SGB V, Werkstudentenprivileg (20 Stunden in der Vorlesungszeit)" },
  sachgeschenkAnlass: { wert: 60, quelle: "R 19.6 Abs. 1 LStR (Aufmerksamkeit zu persönlichem Anlass, brutto)" },
  zeugnisAnspruch: { quelle: "§ 109 GewO" },
  elternzeitKuerzungMonate: { wert: 12, quelle: "§ 17 Abs. 1 BEEG (für jeden vollen Kalendermonat der Elternzeit ein Zwölftel)" },
  elternzeitSchutzVorherWochen: { wert: 8, wertNach3: 14, quelle: "§ 18 Abs. 1 BEEG (Kündigungsverbot ab Verlangen, frühestens 8 Wochen vor Beginn, zwischen 3. und 8. Geburtstag 14 Wochen)" },
  elternzeitResturlaub: { quelle: "§ 17 Abs. 2 BEEG (Resturlaub nach der Elternzeit im laufenden oder im nächsten Urlaubsjahr)" },
  elternzeitTeilzeit: { stunden: 32, quelle: "§ 15 BEEG (Teilzeit während der Elternzeit, bis 32 Wochenstunden im Durchschnitt)" },
  teilzeitWartezeitMonate: { wert: 6, quelle: "§ 8 Abs. 1 TzBfG" },
  teilzeitAnkuendigungMonate: { wert: 3, quelle: "§ 8 Abs. 2 TzBfG (spätestens drei Monate vor Beginn, Textform)" },
  teilzeitAblehnungMonateVorBeginn: { wert: 1, quelle: "§ 8 Abs. 5 TzBfG (Entscheidung spätestens einen Monat vor dem gewünschten Beginn in Textform, sonst gilt die Verringerung als vereinbart)" },
  teilzeitSchwelle: { wert: 15, quelle: "§ 8 Abs. 7 TzBfG (in der Regel mehr als 15 Arbeitnehmer, ohne Auszubildende)" },
  pflegezeitAnkuendigungArbeitstage: { wert: 10, quelle: "§ 3 Abs. 3 PflegeZG (spätestens zehn Arbeitstage vor Beginn, Textform; nicht bei in der Regel 15 oder weniger Beschäftigten, § 3 Abs. 1)" },
  familienpflegezeitAnkuendigungWochen: { wert: 8, quelle: "§ 2a Abs. 1 FPfZG (spätestens acht Wochen vor dem gewünschten Beginn, Textform)" },
  schwerbehindertKuendigung: { wartezeitMonate: 6, quelle: "§ 168 SGB IX (vorherige Zustimmung des Integrationsamts), Ausnahme in den ersten sechs Monaten: § 173 Abs. 1 Nr. 1 SGB IX" },
  /** Kündigungsverbot bei Pflegezeit und Familienpflegezeit: ab Ankündigung, höchstens 12 Wochen vor dem angekündigten Beginn (Wortlaut am 10.10.2026 auf gesetze-im-internet.de geprüft). Für die Familienpflegezeit gilt § 5 PflegeZG entsprechend (§ 2 Abs. 3 FPfZG, Kanzlei bestätigen lassen). */
  pflegeKuendigungsschutzVorherWochen: { wert: 12, bestaetigt: false, quelle: "§ 5 Abs. 1 PflegeZG, § 2 Abs. 3 FPfZG (Kündigungsverbot ab Ankündigung, höchstens 12 Wochen vor Beginn, bis Ende der Freistellung)" },
  /** Zusatzurlaub schwerbehinderter Menschen: 5 Arbeitstage bei Fünftagewoche, sonst anteilig. Gleichgestellte haben keinen Anspruch (Wortlaut am 10.10.2026 geprüft). */
  zusatzurlaubSchwerbehindert: { tage: 5, bezugArbeitstage: 5, quelle: "§ 208 Abs. 1 SGB IX (fünf Arbeitstage im Urlaubsjahr bei Fünftagewoche, sonst entsprechend mehr oder weniger; gilt nicht für Gleichgestellte, § 151 Abs. 3 SGB IX)" },
  kuendigungSchriftform: { quelle: "§ 623 BGB (Kündigung und Aufhebungsvertrag nur schriftlich, elektronische Form ausgeschlossen)" },
  betriebsratAnhoerung: { quelle: "§ 102 BetrVG (Anhörung vor jeder Kündigung)" },
  /** Frist des Betriebsrats für Bedenken: ordentliche Kündigung eine Woche, außerordentliche drei Tage. Kündigung erst nach Ablauf oder abschließender Stellungnahme. */
  betriebsratAnhoerungFrist: { ordentlichTage: 7, ausserordentlichTage: 3, bestaetigt: false, quelle: "§ 102 Abs. 2 Satz 1 und 3 BetrVG (Bedenken bei der ordentlichen Kündigung spätestens innerhalb einer Woche, bei der außerordentlichen unverzüglich, spätestens innerhalb von drei Tagen); Fristende nach §§ 187, 188, 193 BGB, von Kanzlei prüfen lassen" },
  /** Kündigung einer Betriebsvereinbarung: drei Monate ab Zugang, wenn die BV nichts anderes regelt (Wortlaut am 11.10.2026 geprüft, Destillat 19). */
  bvKuendigungsfristMonate: { wert: 3, quelle: "§ 77 Abs. 5 BetrVG (Kündigung mit einer Frist von drei Monaten, soweit nichts anderes vereinbart)" },
  /** Fristlose Kündigung: Zugang innerhalb von zwei Wochen ab Kenntnis der maßgebenden Tatsachen. */
  fristloseKenntnisWochen: { wert: 2, bestaetigt: false, quelle: "§ 626 Abs. 2 BGB (Kündigung nur innerhalb von zwei Wochen ab Kenntnis der für die Kündigung maßgebenden Tatsachen, Gründe auf Verlangen unverzüglich schriftlich); von Kanzlei prüfen lassen" },
  /** § 99 BetrVG (Umbau Strang 15, B11): Zustimmung des Betriebsrats zu Einstellung, Eingruppierung, Umgruppierung und Versetzung. Zählung in lib/analyse/wachstum.ts (wahlberechtigte). */
  br99Schwelle: { wert: 20, bestaetigt: false, quelle: "§ 99 Abs. 1 Satz 1 BetrVG (in Unternehmen mit in der Regel mehr als zwanzig wahlberechtigten Arbeitnehmern); wie gezählt wird (Köpfe, Leiharbeit, Auszubildende, Minijobs, Stichtag), von Kanzlei prüfen lassen (K17)" },
  br99FristTage: { wert: 7, bestaetigt: false, quelle: "§ 99 Abs. 3 BetrVG (Verweigerung unter Angabe von Gründen innerhalb einer Woche nach Unterrichtung schriftlich, sonst gilt die Zustimmung als erteilt); Fristende nach §§ 187, 188, 193 BGB; ob die Stellungnahme in Lintelly die Schriftform wahrt, von Kanzlei prüfen lassen (K18)" },
  br100AntragTage: { wert: 3, bestaetigt: false, quelle: "§ 100 Abs. 2 Satz 3 BetrVG (bestreitet der Betriebsrat die dringende Erforderlichkeit der vorläufigen Maßnahme, darf sie nur aufrechterhalten werden, wenn der Arbeitgeber innerhalb von drei Tagen beim Arbeitsgericht Ersetzung der Zustimmung und Feststellung der Dringlichkeit beantragt); Fristende von Kanzlei prüfen lassen" },
  /** § 102 Abs. 3 bis 5 BetrVG (B12): Widerspruch, Abschrift an die Person, Weiterbeschäftigung. */
  br102Widerspruch: { bestaetigt: false, quelle: "§ 102 Abs. 3 BetrVG (Widerspruch gegen die ordentliche Kündigung aus fünf Gründen), Abs. 4 (Abschrift der Stellungnahme mit der Kündigung an die Person), Abs. 5 (Weiterbeschäftigung bis zum Abschluss des Rechtsstreits auf Verlangen); ob die Stellungnahme in Lintelly die Schriftform wahrt, von Kanzlei prüfen lassen (K18)" },
  /** § 103 BetrVG (B13): außerordentliche Kündigung und Versetzung mit Amtsverlust nur mit Zustimmung des Betriebsrats oder deren Ersetzung durch das Arbeitsgericht. */
  br103Zustimmung: { bestaetigt: false, quelle: "§ 103 Abs. 1 bis 3 BetrVG, § 15 Abs. 1 und 3 KSchG (Mitglieder des Betriebsrats, Wahlvorstand, Wahlbewerber: außerordentliche Kündigung und Versetzung mit Verlust des Amts nur mit Zustimmung des Betriebsrats, sonst Ersetzung durch das Arbeitsgericht); von Kanzlei prüfen lassen" },
  /** § 193 Abs. 5 SGB VII, § 89 Abs. 6 BetrVG (B14): der Betriebsrat zeichnet die Unfallanzeige mit und bekommt eine Durchschrift. */
  unfallanzeigeBetriebsrat: { bestaetigt: false, quelle: "§ 193 Abs. 5 SGB VII (Anzeige vom Betriebsrat mit zu unterzeichnen; bei Datenübertragung ist anzugeben, welches Mitglied vor der Absendung Kenntnis genommen hat), § 89 Abs. 6 BetrVG (Durchschrift der mitunterschriebenen Anzeige an den Betriebsrat); von Kanzlei prüfen lassen" },
  kuendigungVollmacht: { bestaetigt: false, quelle: "§ 174 Satz 1 BGB (Kündigung durch Bevollmächtigte ohne Vollmachtsurkunde im Original kann unverzüglich zurückgewiesen werden und ist dann unwirksam); von Kanzlei prüfen lassen" },
  aufhebungSperrzeit: { quelle: "§ 159 Abs. 1 Satz 2 Nr. 1 SGB III (Sperrzeit beim Arbeitslosengeld möglich), Meldepflicht § 38 Abs. 1 SGB III" },
  arbzgPause6: { minuten: 30, abStunden: 6, quelle: "§ 4 ArbZG (mindestens 30 Minuten bei mehr als 6 bis 9 Stunden)" },
  arbzgPause9: { minuten: 45, abStunden: 9, quelle: "§ 4 ArbZG (mindestens 45 Minuten bei mehr als 9 Stunden)" },
  arbzgRuhezeit: { stunden: 11, quelle: "§ 5 Abs. 1 ArbZG (ununterbrochene Ruhezeit von mindestens 11 Stunden)" },
  arbzgAusgleichWochen: { wert: 24, quelle: "§ 3 Satz 2 ArbZG (Ausgleich auf durchschnittlich 8 Stunden werktäglich innerhalb von 24 Wochen, bei 6 Werktagen also 48 Stunden je Woche im Schnitt); Kanzlei prüfen lassen" },
  arbzgNachtzeit: { vonStunde: 23, bisStunde: 6, nachtarbeitAbStunden: 2, quelle: "§ 2 Abs. 3 ArbZG (Nachtzeit von 23 bis 6 Uhr), Nachtarbeit nach § 2 Abs. 4 ArbZG ab mehr als zwei Stunden in der Nachtzeit; Kanzlei prüfen lassen" },
  krankAuAbTag: { wert: 3, quelle: "§ 5 Abs. 1 Satz 1 und 2 EntgFG (Arbeitsunfähigkeit unverzüglich anzeigen; dauert sie länger als drei Kalendertage, ärztliche Bescheinigung spätestens am folgenden Arbeitstag); Kanzlei prüfen lassen" },
  loeschungVorlaufTage: { wert: 30, quelle: "Lintelly-Standard (Löschliste 30 Tage vor Ablauf der Aufbewahrungsfrist)" },
  bildungsurlaubTage: { wert: 5, quelle: "§ 2 Abs. 1 HBUG (fünf Arbeitstage jährlich, bei mehr oder weniger als fünf Arbeitstagen pro Woche entsprechend)", stand: "HBUG in der Fassung der Bekanntmachung vom 28.07.1998, Gesamtausgabe 01.01.2024 bis 31.12.2029 (Hessenrecht)" },
  bildungsurlaubWartezeitMonate: { wert: 6, quelle: "§ 4 HBUG (Anspruch erstmals nach sechsmonatigem Bestehen des Arbeitsverhältnisses)" },
  bildungsurlaubMitteilungWochen: { wert: 6, quelle: "§ 5 Abs. 1 HBUG (mindestens sechs Wochen vor Beginn, Textform); Ablehnung binnen drei Wochen, sonst gilt die Freistellung als erteilt (§ 5 Abs. 6 HBUG)" },
  elternzeitAnmeldungWochenNach3: { wert: 13, quelle: "§ 16 Abs. 1 Satz 1 Nr. 2 BEEG (Elternzeit zwischen 3. und 8. Geburtstag)" },
  werkstudentJahreswochen: { wert: 26, zeitraumMonate: 12, quelle: "Gemeinsames Rundschreiben der SV-Spitzenverbände zu Werkstudenten (26 Wochen im Jahr)" },
  dsgvoAntwortMonate: { wert: 1, verlaengerungMonate: 2, quelle: "Art. 12 Abs. 3 DSGVO (ein Monat nach Eingang, bei Komplexität um zwei Monate verlängerbar)" },
  hinschgDokumentationJahre: { wert: 3, quelle: "§ 11 Abs. 5 HinSchG (Dokumentation drei Jahre nach Abschluss des Verfahrens löschen, Wortlaut am 10.10.2026 geprüft)" },
  chatLoeschfristMonate: { wert: 6, quelle: "Lintelly-Standard für Chatverläufe, Datenminimierung nach Art. 5 Abs. 1 lit. e DSGVO (Kanzlei bestätigen lassen)", bestaetigt: false },
  hoechstarbeitszeitWoche: { wert: 48, quelle: "§ 3 ArbZG (8 Std. werktäglich, im Schnitt 48 Std. pro Woche)" },
  arbzgTagesgrenze: { stunden: 10, regelStunden: 8, quelle: "§ 3 ArbZG (8 Stunden werktäglich, auf bis zu 10 Stunden verlängerbar, wenn im Schnitt 8 Stunden in 6 Monaten oder 24 Wochen)" },
  arbzgRuhepauseMin: { minuten: 15, quelle: "§ 4 Satz 2 ArbZG (Ruhepausen von mindestens 15 Minuten; kürzere Unterbrechungen zählen als Arbeitszeit); Kanzlei prüfen lassen" },
  arbzgOhnePauseStunden: { stunden: 6, quelle: "§ 4 Satz 3 ArbZG (nicht länger als sechs Stunden hintereinander ohne Ruhepause); Kanzlei prüfen lassen" },
  arbzgWochenSchnitt: { stunden: 48, quelle: "§ 3 ArbZG (8 Stunden werktäglich mal 6 Werktage); Kanzlei prüfen lassen" },
  arbzgSonntag: { quelle: "§ 9 Abs. 1 ArbZG (keine Beschäftigung an Sonn- und Feiertagen, Ausnahmen in § 10 ArbZG), Ersatzruhetag § 11 Abs. 3 ArbZG (Sonntag: innerhalb von zwei Wochen, Feiertag: innerhalb von acht Wochen); Kanzlei prüfen lassen" },
  jugendArbeitszeit: { quelle: "§§ 8, 11, 13 JArbSchG (strengere Grenzen für Beschäftigte unter 18 Jahren). Die Zahlen trägt Lintelly erst ein, wenn die Kanzlei sie bestätigt hat" },
  arbzgAufzeichnung: { stunden: 8, quelle: "§ 16 Abs. 2 ArbZG (Aufzeichnung der über 8 Stunden hinausgehenden Arbeitszeit, Aufbewahrung 2 Jahre) und BAG, Beschluss vom 13.09.2022, 1 ABR 22/21 (Pflicht zur Erfassung der Arbeitszeit), § 3 Abs. 2 Nr. 1 ArbSchG; Kanzlei prüfen lassen" },
  arbzgErsatzruhetag: { sonntagWochen: 2, feiertagWochen: 8, quelle: "§ 11 Abs. 3 ArbZG (Ersatzruhetag innerhalb von zwei Wochen bei Sonntagsarbeit, innerhalb von acht Wochen bei Feiertagsarbeit)" },
  zeitKorrekturHrAbStunden: { wert: 2, quelle: "Lintelly-Standard (Plausibilitätswert, je Firma einstellbar): Ändert eine Zeitkorrektur nach dem Wochenabschluss oder nach sieben Tagen das Wochenkonto um mehr als zwei Stunden, entscheidet die HR-Leitung statt der Führungskraft" },
  arbeitszeitOffenVergessenStunden: { wert: 14, quelle: "Lintelly-Standard: offene Schicht gilt nach 14 Stunden als vergessen (zehn Stunden Arbeit nach § 3 ArbZG plus Raum für Pausen)" },
  azubiProbezeit: { quelle: "§§ 20, 22 Abs. 1 BBiG (Kündigung in der Probezeit ohne Frist, schriftlich)" },
  /** Probezeit in der Ausbildung: mindestens einen, höchstens vier Monate (§ 20 Satz 2 BBiG, gelesen auf gesetze-im-internet.de am 10.10.2026). */
  azubiProbezeitMonate: { min: 1, max: 4, quelle: "§ 20 Satz 2 BBiG (mindestens einen Monat, höchstens vier Monate)" },
  /** Kündigung durch die Auszubildenden nach der Probezeit: Aufgabe der Berufsausbildung oder Wechsel des Berufs, Frist vier Wochen (§ 22 Abs. 2 Nr. 2 BBiG). */
  azubiKuendigungWochen: { wert: 4, quelle: "§ 22 Abs. 2 Nr. 2 BBiG (vier Wochen bei Aufgabe oder Berufswechsel); Kanzlei bestätigen lassen", bestaetigt: false },
  /** Aufschläge der Mindestausbildungsvergütung auf den Wert des ersten Jahres (§ 17 Abs. 2 Satz 1 BBiG, gelesen am 10.10.2026). */
  azubiAufschlag: { jahr2: 0.18, jahr3: 0.35, jahr4: 0.4, quelle: "§ 17 Abs. 2 Satz 1 BBiG (18 %, 35 %, 40 % auf den Betrag des ersten Ausbildungsjahres)" },
  /** Aufbewahrung der Niederschrift des Ausbildungsvertrags (§ 11 Abs. 2 BBiG): drei Jahre nach Ablauf des Kalenderjahres, in dem die Ausbildung endete. */
  /** Kündigung aus wichtigem Grund in der Ausbildung: unwirksam, wenn die Tatsachen länger als zwei Wochen bekannt sind. */
  azubiKuendigungKenntnisWochen: { wert: 2, quelle: "§ 22 Abs. 4 Satz 1 BBiG (Kündigung aus wichtigem Grund unwirksam, wenn die Tatsachen länger als zwei Wochen bekannt sind)" },
  azubiNiederschriftAufbewahrung: { jahre: 3, quelle: "§ 11 Abs. 2 BBiG (Niederschrift und Empfangsnachweis drei Jahre nach Ende des Kalenderjahres der Ausbildung)" },
  /** Eintragung des Ausbildungsvertrags bei der zuständigen Stelle (Industrie- und Handelskammer, Handwerkskammer). Die Pflicht zum Antrag trifft den Ausbildenden. */
  azubiEintragung: { quelle: "§ 36 BBiG (Antrag des Ausbildenden auf Eintragung unverzüglich nach Vertragsschluss; so zitieren es die Kammerformulare), Handwerk § 30 HwO; die Normen selbst nicht gelesen, Kanzlei bestätigen lassen", bestaetigt: false },
  /** Semesterferien bei Werkstudenten: in der vorlesungsfreien Zeit sind mehr als 20 Stunden möglich, solange das Studium im Vordergrund steht. Grenze der Wochen siehe werkstudentJahreswochen. */
  werkstudentSemesterferien: { quelle: "§ 6 Abs. 1 Nr. 3 SGB V, § 27 Abs. 4 Nr. 2 SGB III (Studium steht im Vordergrund; in der vorlesungsfreien Zeit sind mehr als 20 Stunden pro Woche möglich), Auslegung nach dem Rundschreiben der SV-Spitzenverbände; Krankenkasse oder Kanzlei bestätigen lassen", bestaetigt: false },
  /** Immatrikulationsnachweis: Der Arbeitgeber legt die Bescheinigung zu den Entgeltunterlagen (§ 8 Abs. 2 Nr. 1 BVV, laut Suchtreffer, nicht auf der Norm selbst gelesen). */
  werkstudentNachweis: { quelle: "§ 8 Abs. 2 BVV (Unterlagen zu den Entgeltunterlagen); Kanzlei oder Lohnbüro bestätigen lassen", bestaetigt: false },
  /** Ausschlussfristen im Arbeitsvertrag: Textform (§ 309 Nr. 13 BGB bei Verträgen ab 01.10.2016), Mindestlohn und Vorsatz ausnehmen. Die Dauer ist ein Marktwert, kein Gesetzeswert. */
  ausschlussfristMonate: { wert: 3, zweiteStufeWochen: 2, quelle: "Marktüblicher Mindestwert (Rechtsprechung des BAG zu zweistufigen Klauseln, Aktenzeichen nicht gelesen), Kanzlei bestätigen lassen", bestaetigt: false },
  ausschlussfristRecht: { quelle: "§ 3 MiLoG, § 202 Abs. 1 BGB (Vorsatz), § 309 Nr. 7 BGB (Leben, Körper, Gesundheit, grobes Verschulden), § 309 Nr. 13 BGB (Textform); BAG, Urteil vom 18.09.2018, 9 AZR 162/18 (Klausel ohne Mindestlohn-Ausnahme unwirksam, LTO-Bericht gelesen am 10.10.2026)" },
  /** Feststellung des Erwerbsstatus bei der Deutschen Rentenversicherung Bund: kostenlos, Formular V0027, dauert im Mittel rund drei Monate (DRV-Seite gelesen am 10.10.2026). */
  statusfeststellung: { quelle: "§ 7a SGB IV (Antrag bei der Clearingstelle der Deutschen Rentenversicherung Bund)", url: "https://www.deutsche-rentenversicherung.de/DRV/DE/Rente/Arbeitnehmer-und-Selbststaendige/03_Selbststaendige/statusfeststellungsverfahren" },
  scheinselbststaendigkeit: { quelle: "§ 7 Abs. 1 SGB IV (Beschäftigung: Weisungen und Eingliederung), Gesamtbetrachtung nach der Deutschen Rentenversicherung; es zählt die gelebte Praxis", url: "https://www.deutsche-rentenversicherung.de/DRV/DE/Rente/Arbeitnehmer-und-Selbststaendige/03_Selbststaendige/scheinselbststaendigkeit.html" },
  /** Selbstständige ohne weitere Beschäftigte, die im Wesentlichen für einen Auftraggeber arbeiten, sind rentenversicherungspflichtig (§ 2 Satz 1 Nr. 9 SGB VI). */
  freierMitarbeiterRentenpflicht: { quelle: "§ 2 Satz 1 Nr. 9 SGB VI (im Wesentlichen nur für einen Auftraggeber tätig, keine versicherungspflichtigen Arbeitnehmer)" },
  efzWartezeitTage: { wert: 28, quelle: "§ 3 Abs. 3 EFZG (4 Wochen Wartezeit)" },
  befristungVorlaufTage: { wert: 120, quelle: "Lintelly-Standard (Meldepflicht 3 Monate vorher, § 38 Abs. 1 SGB III)" },
  saeumniszuschlagMonat: { wert: 0.01, quelle: "§ 24 Abs. 1 SGB IV (1 % je angefangenem Monat, entfällt bei unverschuldeter Unkenntnis nach § 24 Abs. 2)" },
  radarBetriebsrat: { wert: 5, quelle: "§ 1 Abs. 1 BetrVG (mindestens 5 ständige wahlberechtigte Arbeitnehmer)" },
  radarPflegezeit: { wert: 15, quelle: "§ 3 Abs. 1 PflegeZG (mehr als 15 Beschäftigte)" },
  radarDatenschutzbeauftragte: { wert: 20, quelle: "§ 38 Abs. 1 BDSG (mindestens 20 Personen, die ständig mit automatisierter Verarbeitung personenbezogener Daten befasst sind)" },
  radarSchwerbehinderung: { wert: 20, quelle: "§ 154 Abs. 1 SGB IX (mindestens 20 Arbeitsplätze)" },
  radarMassenentlassung: { wert: 20, quelle: "§ 17 Abs. 1 Nr. 1 KSchG (mehr als 20 und weniger als 60 Arbeitnehmer)" },
  radarFamilienpflege: { wert: 25, quelle: "§ 2 Abs. 1 FPfZG (mehr als 25 Beschäftigte)" },
  radarBrueckenteilzeit: { wert: 45, quelle: "§ 9a Abs. 1 TzBfG (mehr als 45 Arbeitnehmer)" },
  radarHinweisgeber: { wert: 50, quelle: "§ 12 Abs. 2 HinSchG (in der Regel mindestens 50 Beschäftigte)" },
  /** Teilzeit im KSchG-Zähler: bis 20 Stunden 0,5, bis 30 Stunden 0,75, sonst 1 (§ 23 Abs. 1 Satz 4 KSchG). */
  kschgTeilzeitFaktor: { bis20Std: { stunden: 20, faktor: 0.5 }, bis30Std: { stunden: 30, faktor: 0.75 }, quelle: "§ 23 Abs. 1 Satz 4 KSchG" },
  /** Pflichtplätze für schwerbehinderte Menschen: ab 20 Arbeitsplätzen 1, ab 40 zwei, ab 60 fünf Prozent (§ 154 Abs. 1 SGB IX). */
  pflichtplatzStufen: { ab: 20, zwei: 40, prozentAb: 60, prozent: 0.05, quelle: "§ 154 Abs. 1 SGB IX" },
  /** Umlage U1 (Erstattung bei Krankheit): Arbeitgeber mit in der Regel nicht mehr als 30 Arbeitnehmern (§ 1 Abs. 1 AAG, Zählung § 3 Abs. 1 AAG). Noch nicht von der Kanzlei bestätigt. */
  /** Arbeitszeit in Schwangerschaft und Stillzeit (§ 4 Abs. 1, § 5 Abs. 1 MuSchG, für Frauen ab 18 Jahren): Tag, Doppelwoche, keine Arbeit zwischen 20 und 6 Uhr. */
  mutterschutzArbeitszeit: { tagStunden: 8.5, doppelwocheStunden: 90, nachtVonStunde: 20, nachtBisStunde: 6, bestaetigt: false, quelle: "§ 4 Abs. 1 und § 5 Abs. 1 MuSchG (gelesen auf gesetze-im-internet.de am 11.10.2026); Kanzlei bestätigen lassen" },
  /** Übergangsbereich (Midijob): Obergrenze. Die Formel aus § 20 Abs. 2a SGB IV rechnet lib/regeln/midijob.ts mit FAKTOR_F (Formeln am 29.10.2026 im Wortlaut gelesen). */
  uebergangsbereich: { obergrenze: 2000, quelle: "§ 20 Abs. 2 SGB IV (Arbeitsentgelt aus mehr als geringfügiger Beschäftigung bis regelmäßig 2.000 Euro im Monat; Beiträge nach der Formel in § 20 Abs. 2a SGB IV, nicht für Auszubildende), gesetze-im-internet.de/sgb_4/__20.html, gelesen am 11.10.2026" },
  bavSvFrei: { anteil: 0.04, quelle: "§ 1 Abs. 1 Satz 1 Nr. 9 SvEV (steuerfreie Zuwendungen an Pensionskassen, Pensionsfonds, Direktversicherungen bis 4 Prozent der Beitragsbemessungsgrenze der Rentenversicherung sind beitragsfrei; gelesen auf gesetze-im-internet.de am 11.10.2026)" },
  pfaendungErklaerungWochen: { wert: 2, quelle: "§ 840 Abs. 1 ZPO (Erklärung des Drittschuldners binnen zwei Wochen ab Zustellung des Pfändungsbeschlusses, auf Verlangen des Gläubigers; gelesen auf gesetze-im-internet.de am 11.10.2026)" },
  praktikumMindestlohn: { monate: 3, quelle: "§ 22 Abs. 1 Satz 2 Nr. 2 und 3 MiLoG (Ausnahme vom Mindestlohn nur für Praktika bis zu drei Monaten; Pflichtpraktikum nach Nr. 1 ohne Grenze; gelesen auf gesetze-im-internet.de am 11.10.2026)" },
  umlageTeilzeitFaktor: { bis10Std: { stunden: 10, faktor: 0.25 }, bis20Std: { stunden: 20, faktor: 0.5 }, bis30Std: { stunden: 30, faktor: 0.75 }, quelle: "§ 3 Abs. 1 Satz 6 AAG (gelesen auf gesetze-im-internet.de am 11.10.2026)" },
  umlageU1Grenze: { wert: 30, bestaetigt: false, quelle: "§ 1 Abs. 1 AAG (Arbeitgeber mit in der Regel nicht mehr als 30 Arbeitnehmern; Zählung nach § 3 Abs. 1 AAG, Zählweise Kanzlei prüfen lassen)" },
  /** Vergleichswert Krankenquote in Dashboards und Bericht. Keine amtliche Zahl, eine Annahme von Lintelly. */
  krankenquoteVergleich: { wert: 5.5, bestaetigt: false, quelle: "Vergleichswert von Lintelly, kein amtlicher Wert (Branchenwert bei der Krankenkasse oder Kanzlei erfragen)" },
  /** Teamwerte zur Gesundheit erst ab dieser Gruppengröße (Art. 5 Abs. 1 lit. c, Art. 9 DSGVO). Keine Zahl aus dem Gesetz, in den Einstellungen änderbar. */
  gesundheitMinGruppe: { wert: 5, quelle: "Lintelly-Regel, nicht gesetzlich (kein Rückschluss auf einzelne Personen bei Gesundheitsdaten, Art. 5 Abs. 1 lit. c, Art. 9 DSGVO), in den Einstellungen änderbar" },
  /** Lohnänderung beim Gehalt: ab dieser Abweichung vom aktuellen Gehalt braucht es eine zweite, ausdrückliche Bestätigung. Lintelly-Standard, kein Rechtswert. */
  gehaltAenderungZweiteBestaetigung: { wert: 0.2, quelle: "Lintelly-Standard (Plausibilitätsprüfung, kein Rechtswert)" },
  /** Ein Einmalbetrag (Prämie, Abzug, Sachbezug) über diesem Vielfachen des Monatsgehalts gilt als Ausreißer und braucht eine zweite Bestätigung. */
  einmalbetragZweiteBestaetigung: { wert: 1, quelle: "Lintelly-Standard (Plausibilitätsprüfung, kein Rechtswert)" },
  /** Abmahnung: Abstand zwischen Vorfall und Abmahnung, ab dem die Prüfliste warnt. Das Gesetz nennt keine Zahl (Verwirkung), darum legt die Kanzlei den Wert fest. */
  abmahnungZeitnahTage: { wert: null as number | null, bestaetigt: false, quelle: "Verwirkung des Abmahnungsrechts, kein gesetzlicher Zeitraum; die Kanzlei legt den Wert in Tagen fest" },
  /* ---- Nachtrag 10.10.2026: Werte, die bisher im Code standen (Register-Umbau, Konzept vom 09.10.2026) ---- */
  /** Gesetzlicher Mindesturlaub: 24 Werktage (Sechstagewoche), also 20 Arbeitstage bei fünf Arbeitstagen je Woche. */
  mindesturlaub: { werktage: 24, arbeitstage: 20, bezugArbeitstage: 5, quelle: "§ 3 Abs. 1 BUrlG (jährlich mindestens 24 Werktage; bei fünf Arbeitstagen je Woche entsprechend 20 Arbeitstage)" },
  urlaubsentgeltWochen: { wert: 13, quelle: "§ 11 Abs. 1 Satz 1 BUrlG (Urlaubsentgelt nach dem durchschnittlichen Arbeitsverdienst der letzten 13 Wochen vor Beginn des Urlaubs), Grundlage des Tagessatzes der Abgeltung nach § 7 Abs. 4 BUrlG" },
  urlaubWartezeitMonate: { wert: 6, quelle: "§ 4 BUrlG (voller Urlaubsanspruch erstmalig nach sechsmonatigem Bestehen des Arbeitsverhältnisses), Teilurlaub ein Zwölftel je vollem Monat nach § 5 Abs. 1 BUrlG" },
  urlaubJahreshinweis: { monat: 1, tag: 31, quelle: "Lintelly-Standard: Jahreshinweis zum Urlaub bis Ende Januar (Hinweispflicht nach BAG 9 AZR 423/16, ein Datum nennt das Gericht nicht)" },
  urlaubErinnerung: { abMonat: 7, spaetAbMonat: 10, bisTag: 31, quelle: "Lintelly-Standard: Erinnerung an Resturlaub ab Juli bei mehr als der Hälfte Rest, ab Oktober immer" },
  urlaubLangeNichtTage: { wert: 183, quelle: "Lintelly-Standard: Hinweis nach rund einem halben Jahr ohne Urlaub (Erholungszweck, § 1 BUrlG)" },
  urlaubKrankSonderNachlaufTage: { wert: 30, quelle: "Lintelly-Standard: lange Krankheit zählt für die Sonderregel, wenn sie höchstens 30 Tage zurückliegt" },
  grundkuendigungsfristTage: { wert: 28, termin: 15, quelle: "§ 622 Abs. 1 BGB (vier Wochen zum Fünfzehnten oder zum Ende eines Kalendermonats)" },
  kleinbetriebKuendigung: { tage: 28, hoechstBeschaeftigte: 20, quelle: "§ 622 Abs. 5 Satz 1 Nr. 2 BGB (in der Regel nicht mehr als 20 Arbeitnehmer ohne Auszubildende, vier Wochen ohne festen Termin nur bei Vereinbarung)" },
  /** Verlängerte Kündigungsfristen für den Arbeitgeber: ab `jahre` Jahren Betriebszugehörigkeit `monate` Monate zum Ende eines Kalendermonats. */
  kuendigungsStaffel: { stufen: [{ jahre: 2, monate: 1 }, { jahre: 5, monate: 2 }, { jahre: 8, monate: 3 }, { jahre: 10, monate: 4 }, { jahre: 12, monate: 5 }, { jahre: 15, monate: 6 }, { jahre: 20, monate: 7 }], quelle: "§ 622 Abs. 2 BGB" },
  staffelVorwarnungTage: { wert: 92, quelle: "Lintelly-Standard: Hinweis, wenn die nächste Stufe der Staffel in höchstens rund drei Monaten erreicht wird" },
  kschgKlageWochen: { wert: 3, quelle: "§ 4 Satz 1 KSchG (Klage innerhalb von drei Wochen nach Zugang der schriftlichen Kündigung)" },
  arbeitsuchendMeldung: { monate: 3, tage: 3, quelle: "§ 38 Abs. 1 SGB III (spätestens drei Monate vor Beendigung, sonst innerhalb von drei Tagen nach Kenntnis)" },
  verjaehrungJahre: { wert: 3, quelle: "§ 195 BGB (regelmäßige Verjährungsfrist drei Jahre), Beginn mit Schluss des Jahres nach § 199 Abs. 1 BGB" },
  nachwgFristen: { tage: 7, monate: 1, quelle: "§ 2 Abs. 1 Satz 4 NachwG (erster Arbeitstag, spätestens siebter Kalendertag, spätestens ein Monat nach Beginn)" },
  nachwgBussgeld: { wert: 2000, quelle: "§ 4 Abs. 2 NachwG (Geldbuße bis zu 2.000 Euro)" },
  integrationsamtAnzeigeTage: { wert: 4, quelle: "§ 173 Abs. 4 SGB IX (Anzeige beim Integrationsamt innerhalb von vier Tagen in den ersten sechs Monaten)" },
  mutterschutzNachTageVerlaengert: { wert: 84, quelle: "§ 3 Abs. 2 Satz 2 MuSchG (zwölf Wochen nach der Entbindung bei Früh- und Mehrlingsgeburten und bei Behinderung des Kindes)" },
  mutterschutzKuendigungsverbotMonate: { wert: 4, quelle: "§ 17 Abs. 1 Satz 1 Nr. 3 MuSchG (bis zum Ende der Schutzfrist nach der Entbindung, mindestens bis vier Monate nach der Entbindung)" },
  mutterschutzMitteilungWochen: { wert: 2, quelle: "§ 17 Abs. 1 Satz 2 MuSchG (Mitteilung innerhalb von zwei Wochen nach Zugang der Kündigung)" },
  mutterschutzMeldungZielTage: { wert: 3, quelle: "Lintelly-Standard: Meldung an die Aufsichtsbehörde und Schutzmaßnahmen innerhalb von drei Tagen (Gesetz: unverzüglich, § 27 Abs. 1 und § 10 MuSchG)" },
  elternzeitErsterAbschnittMonate: { wert: 36, quelle: "§ 16 Abs. 1 Satz 1 BEEG (Elternzeit bis zum vollendeten dritten Lebensjahr: Verlangen sieben Wochen vorher, danach 13 Wochen)" },
  elternzeitSichtNachRueckkehrTage: { wert: 30, quelle: "Lintelly-Standard: Elternzeit-Hinweise bleiben 30 Tage nach der Rückkehr sichtbar" },
  feedbackNachMonaten: { wert: 3, quelle: "Lintelly-Standard für neue Mitarbeitende (Feedbackgespräch nach drei Monaten)" },
  bemZeitraumTage: { wert: 364, quelle: "§ 167 Abs. 2 SGB IX (innerhalb eines Jahres; gezählt wird heute und die 364 Tage davor)" },
  efzNeuerAnspruch: { ohneKrankheitMonate: 6, seitBeginnMonate: 12, quelle: "§ 3 Abs. 1 Satz 2 EFZG (erneut sechs Wochen, wenn sechs Monate nicht wegen derselben Krankheit arbeitsunfähig oder zwölf Monate seit Beginn der ersten Arbeitsunfähigkeit)" },
  werkstudentWarnung: { abJahreswochen: 20, dringendAbJahreswochen: 22, dringendAbWochenDrueber: 3, quelle: "Lintelly-Standard: Warnung vor der Grenze von 26 Wochen im Jahr (werkstudentJahreswochen)" },
  wochenJeMonat: { wert: 13 / 3, text: "13/3", quelle: "Lintelly-Rechenwert, kein Rechtswert: 13 Wochen im Vierteljahr geteilt durch 3 Monate (4,33 gerundet war zu klein, Datenrichtigkeit Nr. 18)" },
  milogAufzeichnung: { tage: 7, jahre: 2, quelle: "§ 17 Abs. 1 MiLoG (Aufzeichnung bis zum siebten Kalendertag nach der Arbeitsleistung, Aufbewahrung mindestens zwei Jahre)" },
  datenpanneMeldungStunden: { wert: 72, quelle: "Art. 33 Abs. 1 DSGVO (Meldung an die Aufsichtsbehörde möglichst binnen 72 Stunden nach Bekanntwerden)" },
  unfallanzeige: { abAuTage: 3, fristTage: 3, quelle: "§ 193 Abs. 1 und 4 SGB VII (Anzeige bei Arbeitsunfähigkeit von mehr als drei Tagen, binnen drei Tagen nach Kenntnis). Lintelly rechnet vorsichtig bis zur selben Uhrzeit am dritten Tag; ob die Frist erst mit Ablauf des dritten Tages endet (§ 26 SGB X, §§ 187, 188 BGB), von Kanzlei prüfen lassen" },
  vorfallZielTage: { kurz: 3, lang: 14, quelle: "Lintelly-Standard: Ziele für Schritte ohne gesetzliche Frist (Betroffene benachrichtigen, Lohnbüro: drei Tage; Ursache und Gefährdungsbeurteilung: 14 Tage)" },
  datenpanneVielePersonen: { wert: 50, quelle: "Lintelly-Schwelle für den Risikovorschlag einer Datenpanne (Leitlinien des EDSA nennen keine Zahl)" },
  jugendlicheBisJahre: { wert: 18, quelle: "§ 2 Abs. 2 JArbSchG (Jugendlicher ist, wer 15, aber noch nicht 18 Jahre alt ist)" },
  bildungsurlaubAblehnungWochen: { wert: 3, quelle: "§ 5 Abs. 6 HBUG (Ablehnung binnen drei Wochen nach Eingang, sonst gilt die Freistellung als erteilt)" },
  pflegezeitHoechstMonate: { wert: 6, quelle: "§ 4 Abs. 1 Satz 1 PflegeZG (Pflegezeit höchstens sechs Monate)" },
  familienpflegezeit: { hoechstMonate: 24, mindestStunden: 15, quelle: "§ 2 Abs. 1 FPfZG (bis zu 24 Monate, wöchentliche Mindestarbeitszeit 15 Stunden)" },
  /**
   * Brückenteilzeit (§ 9a TzBfG, Wortlaut gelesen am 19.10.2026). Zumutbarkeit: bei Arbeitnehmerzahl bis `bis` darf der Arbeitgeber ablehnen, wenn zum
   * gewünschten Beginn schon mindestens `andere` Arbeitnehmer in Brückenteilzeit sind. Sperrfristen nach § 9a Abs. 5 in Jahren.
   */
  brueckenteilzeit: {
    minJahre: 1, maxJahre: 5, zumutbarkeitBis: 200,
    zumutbarkeit: [{ bis: 60, andere: 4 }, { bis: 75, andere: 5 }, { bis: 90, andere: 6 }, { bis: 105, andere: 7 }, { bis: 120, andere: 8 }, { bis: 135, andere: 9 }, { bis: 150, andere: 10 }, { bis: 165, andere: 11 }, { bis: 180, andere: 12 }, { bis: 195, andere: 13 }, { bis: 200, andere: 14 }],
    sperreRueckkehrJahre: 1, sperreBetrieblichJahre: 2, sperreZumutbarkeitJahre: 1,
    quelle: "§ 9a Abs. 1 Satz 2 TzBfG (zeitlich begrenzte Verringerung für mindestens ein und höchstens fünf Jahre), Zumutbarkeitsgrenze bei bis zu 200 Arbeitnehmern nach § 9a Abs. 2 Satz 2 TzBfG, erneuter Antrag nach § 9a Abs. 5 TzBfG (ein Jahr nach Rückkehr, zwei Jahre nach Ablehnung aus betrieblichen Gründen über § 8 Abs. 6, ein Jahr nach Ablehnung wegen der Zumutbarkeitsgrenze)",
  },
  massenentlassungAnzahl: { entlassungen: 5, tage: 30, bisArbeitnehmer: 60, quelle: "§ 17 Abs. 1 Satz 1 Nr. 1 KSchG (mehr als fünf Entlassungen innerhalb von 30 Kalendertagen bei mehr als 20 und weniger als 60 Arbeitnehmern)" },
  betriebsratWahl: { abAlter: 16, waehlbar: 3, quelle: "§ 1 Abs. 1 BetrVG (mindestens fünf ständige wahlberechtigte Arbeitnehmer, davon drei wählbar), § 7 BetrVG (wahlberechtigt ab 16 Jahren)" },
  schwerbehindertAnzeige: { monat: 3, tag: 31, quelle: "§ 163 Abs. 2 SGB IX (Anzeige an die Agentur für Arbeit bis zum 31. März für das Vorjahr)" },
  arbeitsplatzMindestStunden: { wert: 18, quelle: "§ 156 Abs. 3 SGB IX (Stellen mit weniger als 18 Stunden wöchentlich zählen nicht als Arbeitsplätze)" },
  /** Frühere Minijob-Grenzen als Erkennungsmuster beim Import (Spalte "Beschäftigungsart"), dazu die Grenzen aus MINIJOB_GRENZE. */
  minijobGrenzenFrueher: { werte: [450, 520], quelle: "§ 8 Abs. 1 Nr. 1 SGB IV in den Fassungen bis 30.09.2022 (450 €) und bis 31.12.2023 (520 €); nur Erkennung alter Bezeichnungen" },
  planZiele: { svAnmeldungTage: 14, nachweisMonatTage: 30, abmeldungTage: 14, probezeitVorlaufTage: 30, tageJeMonat: 30.4, postfachWeiterleitungMonate: 3, quelle: "Lintelly-Standard: Planungsziele der Ein- und Austrittspläne innerhalb der gesetzlichen Fristen (§ 6 und § 8 DEÜV: sechs Wochen, § 2 NachwG: ein Monat)" },
  deuevMeldungWochen: { wert: 6, quelle: "§ 6 und § 8 Abs. 1 DEÜV (An- und Abmeldung mit der nächsten Entgeltabrechnung, spätestens innerhalb von sechs Wochen)" },
  aufenthaltVorlaufTage: { wert: 90, erinnerungTage: 30, quelle: "Lintelly-Standard: Erinnerung 90 und 30 Tage vor Ablauf des Aufenthaltstitels" },
  zeugnisVorlaufTage: { wert: 60, quelle: "Lintelly-Standard: Zwischen- oder Endzeugnis 60 Tage vor dem Anlass vorbereiten" },
  immatrikulationVorlaufTage: { wert: 30, quelle: "Lintelly-Standard: neue Immatrikulationsbescheinigung 30 Tage vor Semesterende anfordern" },
  /* Unterweisungen und Prüfungen im Arbeitsschutz: Intervall in Monaten. Ausgangswerte aus den genannten Regeln, Fachkraft für Arbeitssicherheit bestätigt. */
  /* Vertragsbausteine (Katalog 10.10.2026, lib/vertragsbausteine). Gesetzeswerte am 10.10.2026 im Wortlaut gelesen, Werte aus der Rechtsprechung und Lintelly-Standards von der Kanzlei zu bestätigen. */
  karenzMindestAnteil: { wert: 0.5, quelle: "§ 74 Abs. 2 HGB (Entschädigung je Jahr des Verbots mindestens die Hälfte der zuletzt bezogenen vertragsmäßigen Leistungen), § 110 GewO" },
  wettbewerbsverbotHoechstMonate: { wert: 24, quelle: "§ 74a Abs. 1 Satz 3 HGB (nicht mehr als zwei Jahre ab Beendigung)" },
  karenzAnrechnung: { zehntel: 0.1, viertelBeiUmzug: 0.25, quelle: "§ 74c Abs. 1 HGB (Anrechnung, soweit Entschädigung und Erwerb die letzten Leistungen um mehr als ein Zehntel, bei Wohnsitzwechsel ein Viertel übersteigen)" },
  karenzVerzichtMonate: { wert: 12, quelle: "§ 75a HGB (Verzicht vor Ende, Entschädigungspflicht endet ein Jahr nach der Erklärung)" },
  provisionAbrechnungMaxMonate: { wert: 3, quelle: "§ 87c Abs. 1 HGB (monatlich, höchstens drei Monate, spätestens bis Ende des nächsten Monats), § 87a Abs. 4 HGB, über § 65 HGB" },
  abruf: { ankuendigungTage: 4, mehrAnteil: 0.25, wenigerAnteil: 0.2, ohneFestlegungStunden: 20, quelle: "§ 12 Abs. 1 bis 3 TzBfG (Abruf mindestens vier Tage vorher, höchstens 25 Prozent mehr und 20 Prozent weniger, ohne Festlegung 20 Stunden)" },
  milogKonto: { ausgleichMonate: 12, hoechstAnteil: 0.5, quelle: "§ 2 Abs. 2 MiLoG (Ausgleich binnen zwölf Kalendermonaten, monatlich höchstens 50 Prozent der vertraglichen Arbeitszeit)" },
  efzKuerzungAnteil: { wert: 0.25, quelle: "§ 4a Satz 2 EFZG (je Krankheitstag höchstens ein Viertel des durchschnittlichen Arbeitsentgelts je Arbeitstag)" },
  zweckbefristungAuslaufTage: { wert: 14, quelle: "§ 15 Abs. 2 TzBfG (frühestens zwei Wochen nach Zugang der schriftlichen Unterrichtung), für auflösende Bedingungen über § 21 TzBfG" },
  erfindungBeanstandungMonate: { wert: 2, quelle: "§ 5 Abs. 3 ArbnErfG (Arbeitgeber kann binnen zwei Monaten Ergänzung der Meldung verlangen, sonst gilt sie als ordnungsgemäß)" },
  erfindungInanspruchnahmeMonate: { wert: 4, quelle: "§ 6 Abs. 2 ArbnErfG (Inanspruchnahme gilt als erklärt, wenn der Arbeitgeber nicht binnen vier Monaten nach Eingang der Meldung freigibt)" },
  erfindungFestsetzungMonate: { wert: 3, quelle: "§ 12 Abs. 3 ArbnErfG (Festsetzung der Vergütung spätestens drei Monate nach Erteilung des Schutzrechts)" },
  erfindungWiderspruchMonate: { wert: 2, quelle: "§ 12 Abs. 4 ArbnErfG (Widerspruch gegen die Festsetzung binnen zwei Monaten in Textform)" },
  erfindungFreiMonate: { wert: 3, quelle: "§ 18 Abs. 2 ArbnErfG (Arbeitgeber bestreitet die freie Erfindung binnen drei Monaten nach Mitteilung)" },
  erfindungAnbietungMonate: { wert: 3, quelle: "§ 19 Abs. 2 ArbnErfG (Arbeitgeber nimmt das angebotene Nutzungsrecht binnen drei Monaten an)" },
  erfindungUnbilligkeitMonate: { wert: 6, quelle: "§ 23 Abs. 2 ArbnErfG (Unbilligkeit spätestens sechs Monate nach Ende des Arbeitsverhältnisses geltend machen)" },
  bavZuschussAnteil: { wert: 0.15, quelle: "§ 1a Abs. 1a BetrAVG (Zuschuss 15 Prozent des umgewandelten Entgelts, soweit Sozialversicherungsbeiträge gespart werden); Kanzlei prüfen lassen" },
  widerrufAnteil: { max: 0.25, maxAufwendung: 0.3, quelle: "BAG 12.01.2005, 5 AZR 364/04 (widerruflicher Anteil höchstens 25 Prozent, bei Aufwendungsersatz 30 Prozent; Prozentzahl in den Quellen uneinheitlich, Aktenzeichen prüfen)", bestaetigt: false },
  ueberstundenPauschaleMaxMonat: { wert: 20, quelle: "BAG 16.05.2012, 5 AZR 331/11 (ersten 20 Überstunden im Monat mit dem Gehalt abgegolten wirksam); darüber nur bei Gehalt über der Beitragsbemessungsgrenze RV (BAG 5 AZR 765/10, Aktenzeichen prüfen)", bestaetigt: false },
  fortbildungBindung: { staffel: [{ bisMonate: 1, bindungMonate: 6 }, { bisMonate: 2, bindungMonate: 12 }, { bisMonate: 6, bindungMonate: 24 }, { bisMonate: 24, bindungMonate: 36 }, { bisMonate: null, bindungMonate: 60 }] as { bisMonate: number | null; bindungMonate: number }[], quelle: "BAG 14.01.2009, 3 AZR 900/07 und ältere Linie (Faustformel; Lücken des Katalogs nach unten gerundet: 4 bis 6 Monate wie 3 bis 4, 12 bis 24 Monate wie 6 bis 12), Aktenzeichen prüfen", bestaetigt: false },
  bindungRueckzahlungMaxMonate: { wert: 24, quelle: "§ 307 BGB, Linie der Rechtsprechung zu Umzugskosten und Einstiegsprämien (Relocation, Signing Bonus), Kanzlei prüfen lassen", bestaetigt: false },
  sonderzahlungBindung: { bagatellEuro: 100, bisMonatsgehaltStichtag: "31.03.", abMonatsgehaltStichtag: "30.06.", quelle: "Linie des BAG zu Rückzahlungsklauseln bei Gratifikationen (bis 100 Euro keine Bindung, bis ein Monatsgehalt bis 31.03., darüber bis 30.06. des Folgejahres), Aktenzeichen prüfen", bestaetigt: false },
  vertragsstrafeGrenze: { quelle: "BAG 18.08.2005, 8 AZR 65/05 (höchstens das Entgelt für die Kündigungsfrist), BAG 23.09.2010, 8 AZR 897/08 (in der Probezeit nicht mehr als das Entgelt der Probezeitfrist)" },
  rufbereitschaftReaktionMinuten: { wert: 15, quelle: "EuGH C-518/15 (Matzak): sehr kurze Reaktionszeit kann Bereitschaftsdienst sein; Grenze ist Lintelly-Warnwert, Kanzlei prüfen lassen", bestaetigt: false },
  // Neue Dokumentarten 23.10.2026 (Vereinbarung über unbezahlten Urlaub). Wortlaut am Prüfdatum nicht gelesen: Kanzlei prüfen lassen.
  unbezahlterUrlaubSvMonate: { wert: 1, bestaetigt: false, quelle: "§ 7 Abs. 3 Satz 1 SGB IV (Beschäftigung gegen Arbeitsentgelt gilt als fortbestehend, solange das Beschäftigungsverhältnis ohne Anspruch auf Arbeitsentgelt fortdauert, jedoch nicht länger als einen Monat)" },
  sonderurlaubUrlaubsrechnung: { wochenJahr: 52, bestaetigt: false, quelle: "BAG, Urteil vom 19.03.2019, 9 AZR 315/17 (für Zeiten des unbezahlten Sonderurlaubs entsteht kein Urlaub; Jahresurlaub mal Arbeitstage mit Arbeitspflicht geteilt durch Arbeitstage im Jahr, Jahr mit 52 Wochen)" },
  provisionStandards: { stornoHaftungMonate: 12, stornoWarnMonate: 24, folgeprovisionMonate: 6, folgeprovisionWarnMonate: 24, kappungMindestFaktor: 1.5, gebietSchwelle: 0.1, beanstandungMinMonate: 3, aenderungAnkuendigungMonate: 3, zielvereinbarungBisMonate: 1, quelle: "Lintelly-Standards aus dem Klauselkatalog 10.10.2026 (Storno-Haftungszeit, Folgeprovision, Kappung, Gebietsänderung, Beanstandungsfrist, Ankündigung von Planänderungen, Termin der Zielvereinbarung); keine gesetzlichen Zahlen, Kanzlei prüfen lassen" },
  vertragStandards: { versetzungAnkuendigungWochen: 4, voruebergehendMonate: 3, gleitzeitVon: 6, gleitzeitBis: 22, betriebsferienAnteil: 2 / 3, reiseBelegMinMonate: 3, ueberstundenAusgleichMonate: 6, verschwiegenheitJahre: 2, verschwiegenheitWarnJahre: 5, abwerbeMonate: 12, abwerbeWarnMonate: 24, kundenschutzRueckblickMonate: 24, strafeWarnJahresgehaelter: 2, quelle: "Lintelly-Standards aus dem Klauselkatalog 10.10.2026 (Ankündigung, Gleitzeitrahmen, Betriebsferien, Belegfrist, Ausgleichszeitraum, nachvertragliche Verschwiegenheit, Abwerbeverbot, Kundenschutz, Warnwert Vertragsstrafe); keine gesetzlichen Zahlen, Kanzlei prüfen lassen" },
  // Strang 29 (11.10.2026): Firmenwagen (Destillat 20, Abschnitt 2.1, 2.2 und 4). Wortlaut am 11.10.2026 gelesen, sonst bestaetigt: false.
  dienstwagenPrivatProzent: { wert: 0.01, quelle: "§ 6 Abs. 1 Nr. 4 Satz 2 EStG über § 8 Abs. 2 Satz 2 EStG (1 Prozent des inländischen Listenpreises im Zeitpunkt der Erstzulassung zuzüglich Sonderausstattung einschließlich Umsatzsteuer je Kalendermonat)", url: "https://www.gesetze-im-internet.de/estg/__6.html" },
  fuehrerscheinIntervallMonate: { wert: 6, bestaetigt: false, quelle: "Lintelly-Standard, keine gesetzliche Frist: § 21 Abs. 1 Nr. 2 und Abs. 2 Nr. 1 StVG (strafbar ist der Halter, der das Fahren ohne Fahrerlaubnis anordnet oder zulässt, auch fahrlässig); halbjährlich ist Praxis, der Bundesrat-Entwurf Drucksache 21/1386 will einmalige Vorlage plus Anlass; je Firma einstellbar, Kanzlei prüfen lassen", url: "https://www.gesetze-im-internet.de/stvg/__21.html" },
  arbeitnehmerHaftung: { bestaetigt: false, quelle: "§ 619a BGB (Haftung nur bei Vertretenmüssen, Beweislast beim Arbeitgeber); Abstufung nach Verschuldensgrad (BAG GS 1/89) und Vorrang der Kaskoversicherung nur aus Kanzleibeiträgen gelesen, Kanzlei prüfen lassen", url: "https://www.gesetze-im-internet.de/bgb/__619a.html" },
  erholungsbeihilfe: { person: 156, ehegatte: 104, kind: 52, quelle: "§ 40 Abs. 2 Satz 1 Nr. 3 EStG (Erholungsbeihilfen pauschal mit 25 Prozent bis 156 Euro für die Person, 104 Euro für Ehegatten oder Lebenspartner und 52 Euro je Kind im Kalenderjahr; der Arbeitgeber stellt die Verwendung zur Erholung sicher)", url: "https://www.gesetze-im-internet.de/estg/__40.html" },
  fahrradUmwandlung: { prozent: 0.01, bruchteil: 0.25, bruchteil2019: 0.5, rundung: 100, ersteUeberlassungAb: "2019-01-01", ersteUeberlassungBis: "2030-12-31", quelle: "Gleich lautende Erlasse der obersten Finanzbehörden der Länder vom 09.01.2020, BStBl I S. 174 (bei Gehaltsumwandlung monatlich 1 Prozent eines auf volle 100 Euro abgerundeten Viertels der unverbindlichen Preisempfehlung, im Kalenderjahr 2019 der Hälfte, für Fahrräder mit erstmaliger Überlassung vom 01.01.2019 bis 31.12.2030; deckt alle Fahrten ab), LStH 2026 Anhang 24 IV.4", url: "https://lsth.bundesfinanzministerium.de/lsth/2026/B-Anhaenge/Anhang-24/IV/IV-4/inhalt.html" },
  fahrradKfz: { quelle: "BMF-Schreiben vom 03.03.2022, Rn. 3 (Elektrofahrräder, die verkehrsrechtlich als Kraftfahrzeug gelten, etwa mit mehr als 25 km/h Unterstützung und Kennzeichen, laufen nach den Regeln für Kraftfahrzeuge)", url: "https://lsth.bundesfinanzministerium.de/lsth/2026/B-Anhaenge/Anhang-24/IV/IV-6/inhalt.html" },
} as const;

/**
 * Bruchteil des Listenpreises für Elektro- und Hybridfahrzeuge nach Anschaffungsdatum (§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 2 bis 5 EStG, § 52 Abs. 12 EStG,
 * Tabelle im BMF-Schreiben vom 05.11.2021). Elektro: erste passende Zeile mit Grenze, sonst die Zeile ohne Grenze. Hybrid: CO2 höchstens maxCo2 ODER
 * Reichweite mindestens minReichweiteKm. Keine Zeile passt: ganzer Listenpreis, vor 2023 angeschafft Batterieabzug (Nr. 1, rechnet das Lohnbüro).
 */
export type DienstwagenBruchteil = { antrieb: "elektro" | "hybrid"; anschaffungAb: string; anschaffungBis: string; maxListenpreis?: number; maxCo2?: number; minReichweiteKm?: number; bruchteil: number; quelle: string; url: string; bestaetigt?: false };
const GII_6 = "https://www.gesetze-im-internet.de/estg/__6.html";
const BMF_E_AUTO = "https://lsth.bundesfinanzministerium.de/lsth/2026/B-Anhaenge/Anhang-24/IV/IV-6/inhalt.html";
export const DIENSTWAGEN_BRUCHTEIL: DienstwagenBruchteil[] = [
  { antrieb: "elektro", anschaffungAb: "2019-01-01", anschaffungBis: "2023-12-31", maxListenpreis: 60000, bruchteil: 0.25, url: BMF_E_AUTO, quelle: "§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 3 EStG, § 52 Abs. 12 Satz 4 EStG; BMF-Schreiben vom 05.11.2021, Tabelle (Wirkung ab Kalenderjahr 2020; 2019 galt die Hälfte)" },
  { antrieb: "elektro", anschaffungAb: "2024-01-01", anschaffungBis: "2025-06-30", maxListenpreis: 70000, bruchteil: 0.25, url: "https://www.gesetze-im-internet.de/estg/__52.html", bestaetigt: false, quelle: "§ 52 Abs. 12 Satz 5 EStG (Gesetz vom 27.03.2024, BGBl. 2024 I Nr. 108); Betrag 70.000 Euro nur sekundär gelesen, Steuerberatung bestätigen lassen" },
  { antrieb: "elektro", anschaffungAb: "2025-07-01", anschaffungBis: "2030-12-31", maxListenpreis: 100000, bruchteil: 0.25, url: GII_6, quelle: "§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 3 EStG, § 52 Abs. 12 Satz 6 EStG (Gesetz vom 14.07.2025, BGBl. 2025 I Nr. 161)" },
  { antrieb: "elektro", anschaffungAb: "2019-01-01", anschaffungBis: "2030-12-31", bruchteil: 0.5, url: BMF_E_AUTO, quelle: "BMF-Schreiben vom 05.11.2021, Tabelle (über der Listenpreisgrenze: die Hälfte)" },
  { antrieb: "hybrid", anschaffungAb: "2019-01-01", anschaffungBis: "2021-12-31", maxCo2: 50, minReichweiteKm: 40, bruchteil: 0.5, url: BMF_E_AUTO, quelle: "§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 2 EStG mit § 3 Abs. 2 EmoG; BMF-Schreiben vom 05.11.2021, Tabelle" },
  { antrieb: "hybrid", anschaffungAb: "2022-01-01", anschaffungBis: "2024-12-31", maxCo2: 50, minReichweiteKm: 60, bruchteil: 0.5, url: GII_6, quelle: "§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 4 EStG" },
  { antrieb: "hybrid", anschaffungAb: "2025-01-01", anschaffungBis: "2030-12-31", maxCo2: 50, minReichweiteKm: 80, bruchteil: 0.5, url: GII_6, quelle: "§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 5 EStG" },
];
/** Vor diesem Tag angeschaffte Elektro- und Hybridfahrzeuge ohne passende Zeile: Batterieabzug nach § 6 Abs. 1 Nr. 4 Satz 2 Nr. 1 EStG (rechnet Lintelly nicht). */
export const DIENSTWAGEN_BATTERIEABZUG_BIS = { datum: "2022-12-31", quelle: "§ 6 Abs. 1 Nr. 4 Satz 2 Nr. 1 EStG (Minderung um die Kosten des Batteriesystems für Fahrzeuge, die bis zum 31.12.2022 angeschafft wurden)", url: GII_6 };

/**
 * Werte, die sich nach Datum ändern: je Eintrag Gültigkeitsbeginn, Wert und amtliche Quelle.
 * Neue Jahre erst eintragen, wenn die Verordnung veröffentlicht ist (gesetze-im-internet.de). Nichts schätzen.
 */
/** `bestaetigt: false`: Wert beschlossen, aber noch nicht amtlich verkündet (z. B. Bundesrat steht aus). Die Anzeige sagt dann "vorläufig". */
export type ZeitWert = { gueltigAb: string; wert: number; quelle: string; bestaetigt?: false };
export type WertZuDatum = Omit<ZeitWert, "bestaetigt"> & { bestaetigt: boolean; hinweis: string | null };

export const MINDESTLOHN: ZeitWert[] = [
  { gueltigAb: "2024-01-01", wert: 12.41, quelle: "§ 1 MiLoV4 (Vierte Mindestlohnanpassungsverordnung vom 24.11.2023, BGBl. 2023 I Nr. 321)" },
  { gueltigAb: "2025-01-01", wert: 12.82, quelle: "§ 1 MiLoV4 (Vierte Mindestlohnanpassungsverordnung vom 24.11.2023, BGBl. 2023 I Nr. 321)" },
  { gueltigAb: "2026-01-01", wert: 13.9, quelle: "§ 1 MiLoV5 (Fünfte Mindestlohnanpassungsverordnung vom 05.11.2025)" },
  { gueltigAb: "2027-01-01", wert: 14.6, quelle: "§ 1 MiLoV5 (Fünfte Mindestlohnanpassungsverordnung vom 05.11.2025)" },
];

/** Minijob-Grenze nach § 8 Abs. 1a SGB IV: Mindestlohn × 130 / 3, aufgerundet auf volle Euro. */
export const MINIJOB_GRENZE: ZeitWert[] = MINDESTLOHN.map((m) => ({
  gueltigAb: m.gueltigAb, wert: Math.ceil(Math.round((m.wert * 130 * 100) / 3) / 100), quelle: "§ 8 Abs. 1a SGB IV (Mindestlohn × 130 / 3, aufgerundet)",
}));

/**
 * Mindestausbildungsvergütung nach § 17 Abs. 2 BBiG je Beginnjahr der Ausbildung und Ausbildungsjahr (1 bis 4), brutto im Monat.
 * Maßgeblich ist das Jahr des Ausbildungsbeginns. Gelesen am 10.10.2026: Bekanntmachungen 2026 (gesetze-im-internet.de, bbimindvergfbek_2026)
 * und 2027 (gesetze-im-internet.de, bbimindvergfbek_2027, BGBl. 2026 I Nr. 287, BIBB-Pressemitteilung vom 07.10.2026).
 * Jahre ohne Eintrag liefert die Funktion nicht: der Vertrag verlangt dann die Angabe der Kanzlei.
 */
export const MINDESTAUSBILDUNG: Record<number, { jahre: [number, number, number, number]; quelle: string }> = {
  2026: { jahre: [724, 854, 977, 1014], quelle: "Bekanntmachung zur Fortschreibung der Höhe der Mindestvergütung für Berufsausbildungen nach dem BBiG (2026), § 17 Abs. 2 BBiG" },
  2027: { jahre: [764, 902, 1031, 1070], quelle: "Bekanntmachung zur Fortschreibung der Höhe der Mindestvergütung für Berufsausbildungen nach dem BBiG (2027), BGBl. 2026 I Nr. 287, § 17 Abs. 2 BBiG" },
};
export type MindestausbildungErgebnis = { wert: number; quelle: string } | { wert: null; hinweis: string };
export function mindestausbildung(beginn: string, ausbildungsjahr: 1 | 2 | 3 | 4): MindestausbildungErgebnis {
  const eintrag = MINDESTAUSBILDUNG[Number(beginn.slice(0, 4))];
  if (!eintrag) return { wert: null, hinweis: `Für Ausbildungsbeginn ${beginn.slice(0, 4)} ist die Mindestausbildungsvergütung nicht eingetragen. Die Kanzlei nennt den Betrag nach der Bekanntmachung zu § 17 Abs. 2 BBiG.` };
  return { wert: eintrag.jahre[ausbildungsjahr - 1], quelle: eintrag.quelle };
}

/** Beitragsbemessungsgrenzen 2027: Kabinettsbeschluss vom 07.10.2026, Bundesrat steht aus (DRV-Meldung vom 08.10.2026, gelesen am 11.10.2026). Nach Verkündung `bestaetigt` entfernen und Quelle auf die SVBezGrV 2027 setzen. */
export const DRV_RECHENGROESSEN_2027 = "https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Meldungen/2026/261008-bundeskabinett-sv-rechengroessen-2027";
const KABINETT_2027 = `Kabinettsbeschluss vom 07.10.2026 zur Sozialversicherungsrechengrößen-Verordnung 2027, Bundesrat steht aus (Deutsche Rentenversicherung, Meldung vom 08.10.2026, ${DRV_RECHENGROESSEN_2027})`;

/** Beitragsbemessungsgrenze allgemeine Rentenversicherung je Monat. */
export const BBG_RV_MONAT: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 8450, quelle: "§ 4 Abs. 1 Nr. 1 SVBezGrV 2026 (101.400 € im Jahr)" },
  { gueltigAb: "2027-01-01", wert: 8850, bestaetigt: false, quelle: KABINETT_2027 },
];

/** Beitragsbemessungsgrenze Kranken- und Pflegeversicherung je Monat. */
export const BBG_KV_MONAT: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 5812.5, quelle: "§ 2 Abs. 2 SVBezGrV 2026 (69.750 € im Jahr)" },
  // Ab 2027 trennen § 223 Abs. 4 SGB V (Versicherungspflichtgrenze plus 3.600 €) und § 55 Abs. 2 SGB XI (ohne Zuschlag) die Grenzen; gerechnet wird mit einem Wert, bis die Verordnung steht.
  { gueltigAb: "2027-01-01", wert: 6375, bestaetigt: false, quelle: `${KABINETT_2027}; nur für die Krankenversicherung sicher: nach § 55 Abs. 2 SGB XI könnte die Pflegeversicherung 2027 schon bei 6.075 € enden, Text der SVBezGrV 2027 abwarten` },
];

/** Sachbezugswert Mittag- oder Abendessen je Tag (Grundlage der Essenmarke, Strang 30). 2027 nur als Entwurf (17. ÄndVO SvEV), darum vorläufig. */
export const SACHBEZUG_MITTAG: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 4.57, quelle: "§ 2 Abs. 1 Nr. 2 und 3 SvEV (137 Euro im Monat, je Tag ein Dreißigstel nach Abs. 6); BMF-Schreiben vom 29.12.2025 zu den Sachbezugswerten 2026" },
  { gueltigAb: "2027-01-01", wert: 4.7, bestaetigt: false, quelle: "Entwurf der 17. Verordnung zur Änderung der SvEV (141 Euro im Monat), laut Fachpresse beim Bundesrat, nicht verkündet; Lohnbüro bestätigen lassen" },
];

/**
 * Wert, der am Datum gilt. Gibt es für das Jahr des Datums keinen eingetragenen Wert, kommt der zuletzt gültige mit dem
 * Hinweis "noch nicht bestätigt" zurück statt still den Vorjahreswert auszugeben. Vor dem ersten Eintrag: der erste, ebenfalls mit Hinweis.
 * Ein Eintrag mit `bestaetigt: false` kommt mit dem Hinweis "vorläufig" zurück.
 */
export function wertZu(liste: ZeitWert[], datum: string): WertZuDatum {
  const jahr = datum.slice(0, 4);
  const frueher = liste.filter((w) => w.gueltigAb <= datum);
  const w = frueher.length ? frueher[frueher.length - 1] : liste[0];
  const ab = w.gueltigAb.split("-").reverse().join(".");
  const imJahr = frueher.length > 0 && w.gueltigAb.slice(0, 4) === jahr;
  const bestaetigt = imJahr && w.bestaetigt !== false;
  const hinweis = bestaetigt ? null
    : imJahr ? `Wert ab ${ab} vorläufig, noch nicht bestätigt (${w.quelle})`
      : `Wert für ${jahr} noch nicht bestätigt, gerechnet wird mit dem Wert ab ${ab}`;
  return { ...w, bestaetigt, hinweis };
}

/**
 * Übergangsbereich (Midijob, § 20 Abs. 2 SGB IV): mehr als die Minijob-Grenze bis zur Obergrenze, nicht für Minijobs und Auszubildende.
 * Hier rechnet Lintelly keinen Arbeitgeberanteil (nicht berechnet statt falsch).
 */
export function imUebergangsbereich(p: { art: string; gehalt: number }, datum: string): boolean {
  return p.art !== "minijob" && p.art !== "azubi" && p.gehalt > wertZu(MINIJOB_GRENZE, datum).wert && p.gehalt <= WERTE.uebergangsbereich.obergrenze;
}
export const UEBERGANGSBEREICH_HINWEIS = `Übergangsbereich (Midijob bis ${WERTE.uebergangsbereich.obergrenze.toLocaleString("de-DE")} € im Monat): Arbeitgeberanteil nicht berechnet, die Beiträge folgen einer eigenen Formel (${WERTE.uebergangsbereich.quelle.split(" (")[0]} und Abs. 2a). Den Wert nennt das Lohnbüro.`;

/** Gesamtbeitragssätze (Arbeitgeber- und Arbeitnehmeranteil zusammen), aufgeteilt nach der Grenze, bis zu der sie gelten. */
export const SATZ_RV_AV: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 0.212, quelle: "§ 158 SGB VI (18,6 %) und § 341 Abs. 2 SGB III (2,6 %)" },
];
/** Arbeitslosenversicherung allein (Gesamtbeitrag, Arbeitgeber und Arbeitnehmer zusammen). Steckt auch in SATZ_RV_AV, hier einzeln für Rechnungen ohne Rentenversicherung. */
export const SATZ_AV: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 0.026, quelle: "§ 341 Abs. 2 SGB III (2,6 %)" },
  // Gelesen am 19.10.2026: Abs. 2 nennt den Satz ohne Befristung, er gilt 2027 weiter.
  { gueltigAb: "2027-01-01", wert: 0.026, quelle: "§ 341 Abs. 2 SGB III (2,6 %, ohne Befristung, gelesen am 19.10.2026)" },
];
/**
 * Pauschalen des Arbeitgebers für Minijobs zusammen, ohne Umlagen. Noch nicht vom Lohnbüro bestätigt (Register: Kanzlei prüfen).
 * Ab 2027 ist die Krankenversicherung kein fester Satz mehr (AUSSTEHEND.minijobAgPauschale, Rechtsradar 23.10.2026).
 */
export const MINIJOB_AG_PAUSCHALE: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 0.3, quelle: "§ 249b SGB V (13 %), § 172 Abs. 3 SGB VI (15 %), § 40a Abs. 2 EStG (2 % Pauschsteuer), ohne Umlagen; Lohnbüro bestätigen lassen" },
];
/**
 * Faktor F im Übergangsbereich (§ 20 Abs. 2a Satz 2 bis 4 SGB IV): 28 Prozent geteilt durch den Gesamtsozialversicherungsbeitragssatz des Jahres,
 * auf vier Stellen gerundet, vom BMAS bis 31.12. für das Folgejahr im Bundesanzeiger bekannt gegeben. 2026 am 29.10.2026 im Wortlaut der Bekanntmachung gelesen.
 */
export const FAKTOR_F: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 0.6619, quelle: "Bekanntmachung des Gesamtsozialversicherungsbeitragssatzes und des Faktors F für das Jahr 2026 vom 25.11.2025, BAnz AT 18.12.2025 B5 (Gesamtsatz 42,3 Prozent, Faktor F 0,6619), § 20 Abs. 2a SGB IV" },
];
export const SATZ_KV_PV: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 0.211, quelle: "§ 241 SGB V (14,6 %), durchschnittlicher Zusatzbeitrag 2,9 %, § 55 Abs. 1 SGB XI mit § 1 Abs. 1 PBAV 2025 (3,6 % ab 01.01.2025); Zusatzbeitrag vom Lohnbüro bestätigen lassen" },
];

/**
 * Insolvenzgeldumlage (§§ 358, 360 SGB III): nur der Arbeitgeber, auf das rentenversicherungspflichtige Entgelt bis zur Beitragsbemessungsgrenze.
 * Satz und Bemessung am 29.10.2026 im Wortlaut gelesen, gilt ohne neue Verordnung (§ 361 SGB III) weiter. Im Übergangsbereich rechnet Lintelly auf das
 * tatsächliche Entgelt (Praxis der Einzugsstellen; § 358 Abs. 2 nennt den Übergangsbereich nicht, Lohnbüro bestätigen lassen).
 */
export const INSOLVENZGELDUMLAGE: ZeitWert[] = [
  { gueltigAb: "2026-01-01", wert: 0.0015, quelle: "§ 360 SGB III (Umlagesatz 0,15 Prozent), Bemessung § 358 Abs. 2 SGB III" },
  { gueltigAb: "2027-01-01", wert: 0.0015, quelle: "§ 360 SGB III (Umlagesatz 0,15 Prozent, ohne Befristung, gelesen am 29.10.2026)" },
];

/**
 * Folgejahr ohne amtlichen Wert (Nachtprüfung 18.10. Nr. 12): kein geschätzter Wert, nur Quelle und erwarteter Termin. Der Registertest
 * warnt bis zum Prüftermin 15.11. und wird erst danach rot. Mit der Bekanntgabe den Wert in die Reihe eintragen und den Eintrag hier löschen.
 */
/** `rotAb`: Tag, ab dem der Registertest rot wird, wenn die amtliche Bekanntgabe später als der Prüftermin 15.11. kommen darf. */
export type Ausstehend = { gueltigAb: string; quelle: string; erwartet: string; rotAb?: string };
export const AUSSTEHEND: Record<"satzRvAv" | "satzKvPv" | "minijobAgPauschale" | "faktorF", Ausstehend> = {
  satzRvAv: { gueltigAb: "2027-01-01", quelle: "Beitragssatz der allgemeinen Rentenversicherung 2027: Rechtsverordnung der Bundesregierung mit Zustimmung des Bundesrates (§ 160 SGB VI, Anpassung nach § 158 SGB VI)", erwartet: "Verordnung im Herbst 2026" },
  satzKvPv: { gueltigAb: "2027-01-01", quelle: "Durchschnittlicher Zusatzbeitragssatz 2027: Bekanntgabe des Bundesministeriums für Gesundheit im Bundesanzeiger (§ 242a Abs. 2 SGB V); Pflegesatz nach § 55 SGB XI", erwartet: "Bundesanzeiger bis 01.11.2026" },
  // Am 29.10.2026 geprüft: die BMAS-Seite zum Faktor F listet nur Bekanntmachungen bis 2026.
  faktorF: { gueltigAb: "2027-01-01", quelle: "Faktor F 2027: Bekanntmachung des BMAS im Bundesanzeiger (§ 20 Abs. 2a Satz 4 SGB IV), folgt aus den Beitragssätzen 2027 und dem durchschnittlichen Zusatzbeitragssatz 2027", erwartet: "Bundesanzeiger bis 31.12.2026", rotAb: "2027-01-01" },
  // Gelesen am 23.10.2026 in BGBl. 2026 I Nr. 228 (Art. 1 Nr. 64, Inkrafttreten Art. 8 Abs. 2).
  minijobAgPauschale: { gueltigAb: "2027-01-01", quelle: "§ 249b Satz 1 SGB V in der Fassung von Art. 1 Nr. 64 des Gesetzes zur Stabilisierung der Beitragssätze in der gesetzlichen Krankenversicherung (BGBl. 2026 I Nr. 228, in Kraft 01.01.2027): Krankenversicherung mit dem allgemeinen Beitragssatz nach § 241 zuzüglich des durchschnittlichen Zusatzbeitragssatzes nach § 242a statt 13 %; Rentenversicherung und Pauschsteuer ändert das Gesetz nicht", erwartet: "mit dem durchschnittlichen Zusatzbeitragssatz 2027 (Bundesanzeiger bis 01.11.2026), Lohnbüro bestätigt" },
};

/** Text für Brief und KI-Anweisung: die Frist steht nur in WERTE.bemLoeschfrist. */
const BEM_JAHRE: number = WERTE.bemLoeschfrist.jahre;
export const BEM_LOESCHFRIST_TEXT = `spätestens ${BEM_JAHRE} ${BEM_JAHRE === 1 ? "Jahr" : "Jahre"}`;

/** Löschdatum der BEM-Unterlagen: Abschluss plus Frist. Ohne Abschluss kein Datum. */
export function bemLoeschdatum(abgeschlossenAm: string | null | undefined): string | null {
  if (!abgeschlossenAm) return null;
  const [j, m, t] = abgeschlossenAm.split("-");
  // Ganze Jahre verschieben nur den 29.02. aus dem Kalender: dann der 28.02. (§ 188 Abs. 3 BGB, Running List A15).
  return `${Number(j) + WERTE.bemLoeschfrist.jahre}-${m}-${m === "02" && t === "29" ? "28" : t}`;
}

/**
 * Aufbewahrung der Personalakte je Dokumenttyp: Frist, Bezugsereignis und Norm an einer Stelle.
 * Keine der Fristen ist von der Kanzlei bestätigt (bestaetigt: false), sie stammen aus der bisherigen Demo-Annahme.
 * Die Normen sind die Prüfgrundlagen, nicht der Beleg für die Zahl. Bezug "austritt": Frist beginnt mit dem Austritt (davor läuft die Akte mit
 * der Beschäftigung), "dokument": Frist beginnt mit dem Datum des Dokuments. Aufbewahrt wird bis Ende des Kalenderjahres, in dem die Frist abläuft.
 */
export type AufbewahrungBezug = "austritt" | "dokument";
export type Aufbewahrung = { jahre: number; bezug: AufbewahrungBezug; norm: string; bestaetigt: boolean };
const GRUNDSATZ = "Art. 5 Abs. 1 lit. e und Art. 17 Abs. 1 lit. a DSGVO, § 26 BDSG";
export const AUFBEWAHRUNG: Record<string, Aufbewahrung> = {
  arbeitsvertrag: { jahre: 10, bezug: "austritt", norm: `${GRUNDSATZ}; mögliche Grundlagen: § 147 AO, § 41 Abs. 1 EStG, § 28f Abs. 1 SGB IV`, bestaetigt: false },
  aenderungsvertrag: { jahre: 10, bezug: "austritt", norm: `${GRUNDSATZ}; mögliche Grundlagen: § 147 AO, § 41 Abs. 1 EStG, § 28f Abs. 1 SGB IV`, bestaetigt: false },
  zeugnis: { jahre: 10, bezug: "austritt", norm: `${GRUNDSATZ}; Frist wegen möglicher Zeugnisansprüche prüfen`, bestaetigt: false },
  abmahnung: { jahre: 3, bezug: "dokument", norm: `${GRUNDSATZ}; Entfernung der Abmahnung aus der Akte prüfen`, bestaetigt: false },
  immatrikulation: { jahre: 3, bezug: "dokument", norm: `${GRUNDSATZ}, § 6 Abs. 1 Nr. 3 SGB V`, bestaetigt: false },
  arbeitsunfaehigkeit: { jahre: 1, bezug: "dokument", norm: `${GRUNDSATZ}, Art. 9 DSGVO; mögliche Grundlage: § 28f Abs. 1 SGB IV`, bestaetigt: false },
  mutterschutz: { jahre: 2, bezug: "dokument", norm: `${GRUNDSATZ}, Art. 9 DSGVO; Nachweis für Schutzfristen und Kündigungsschutz (§§ 3, 17 MuSchG), Frist von der Kanzlei prüfen lassen`, bestaetigt: false },
  schwerbehinderung: { jahre: 3, bezug: "austritt", norm: `${GRUNDSATZ}, Art. 9 DSGVO, § 163 SGB IX (Nachweis der Schwerbehinderung)`, bestaetigt: false },
  zielvereinbarung: { jahre: 3, bezug: "austritt", norm: GRUNDSATZ, bestaetigt: false },
  sonstiges: { jahre: 3, bezug: "dokument", norm: GRUNDSATZ, bestaetigt: false },
  // Zeiterfassung zurück (31.10.2026): je Person und Kalenderjahr, bis Ende des Kalenderjahres (lib/module/loeschung.ts). Für Minijob und Branchen nach § 2a SchwarzArbG gilt § 17 Abs. 1 MiLoG mit ebenfalls zwei Jahren.
  zeit: { jahre: 2, bezug: "dokument", norm: "§ 16 Abs. 2 Satz 2 ArbZG (Aufzeichnungen mindestens zwei Jahre aufbewahren), § 17 Abs. 1 Satz 1 MiLoG (Minijob und Branchen nach § 2a SchwarzArbG, ebenfalls zwei Jahre), danach Art. 5 Abs. 1 lit. e DSGVO; Frist von der Kanzlei bestätigen lassen", bestaetigt: false },
  // 8 statt 6 Jahre (Abgleich der Datensätze vom 29.10.2026): die Abrechnung ist Buchungsbeleg, § 147 Abs. 3 AO am 29.10.2026 im Wortlaut gelesen. Das Lohnkonto (6 Jahre) führt das Lohnbüro.
  entgeltabrechnung: { jahre: 8, bezug: "dokument", norm: `${GRUNDSATZ}; § 147 Abs. 1 Nr. 4, Abs. 3 Satz 1 und Abs. 4 AO (Buchungsbelege acht Jahre ab Schluss des Kalenderjahres, seit 2025); das Lohnkonto selbst sechs Jahre (§ 41 Abs. 1 Satz 9 EStG), § 28f Abs. 1 SGB IV; ob die Kopie in der Personalakte Buchungsbeleg ist, klärt das Lohnbüro`, bestaetigt: false },
};

/**
 * Review Stimmung, Leistung, Arbeitsschutz (09.10.2026). Alle Werte hier sind nicht von der Kanzlei bestätigt (bestaetigt: false):
 * Die Normen sind Prüfgrundlagen, nicht der Beleg für die Zahl. Aufbewahrt wird, bis die Frist abgelaufen ist, gelöscht wird erst nach Vormerkung.
 * Bezug: "austritt" ab letztem Arbeitstag der Person, "ende" ab Ende der Befragungsrunde, "ereignis" ab dem Vorfall.
 */
export type AufbewahrungModul = { jahre: number | null; bezug: "austritt" | "ende" | "ereignis"; norm: string; bestaetigt: boolean; name: string };
const DS = "Art. 5 Abs. 1 lit. e DSGVO, § 26 BDSG";
export const AUFBEWAHRUNG_MODULE: Record<string, AufbewahrungModul> = {
  verbandbuch: { name: "Verbandbuch und Erste-Hilfe-Nachweise", jahre: 5, bezug: "ereignis", norm: "§ 24 Abs. 6 DGUV Vorschrift 1 (fünf Jahre ab Eintrag)", bestaetigt: false },
  unfall: { name: "Unfall- und Beinaheunfall-Dokumentation mit Hergang", jahre: 5, bezug: "ereignis", norm: `${DS}, Art. 9 DSGVO (Gesundheitsdaten); Unfallanzeigen und Fristen der Unfallversicherung mit der Kanzlei prüfen`, bestaetigt: false },
  datenpanne: { name: "Dokumentation von Datenpannen", jahre: null, bezug: "ereignis", norm: "Art. 33 Abs. 5 DSGVO nennt keine Frist: von der Kanzlei festlegen lassen", bestaetigt: false },
};

/**
 * Fristenregister (Umbau Schritt 19, 11.10.2026): je Datenart genau eine Löschregel aus Frist, Startereignis, Norm der Aufbewahrung
 * und Rechtsgrund der Löschung, zusammengeführt aus den Fristen oben, ohne neue Zahl. Der Löschlauf (lib/loeschlauf.ts) löscht nur,
 * was hier `bestaetigt: true` trägt; das setzt allein die Bestätigung der Kanzlei (Entscheidung E3). Bis dahin: fällig, wartet auf Kanzlei.
 */
export type Loeschfrist = { name: string; jahre: number | null; frist: string; start: string; norm: string; rechtsgrund: string; bestaetigt: boolean };
const LOESCHGRUND = "Art. 17 Abs. 1 lit. a DSGVO (Zweck entfallen) mit Art. 5 Abs. 1 lit. e DSGVO (Speicherbegrenzung)";
const START: Record<AufbewahrungBezug | AufbewahrungModul["bezug"], string> = {
  austritt: "Austritt (letzter Arbeitstag), Ende am 31.12. des Ablaufjahres", dokument: "Datum des Dokuments, Ende am 31.12. des Ablaufjahres",
  ende: "Ende der Befragungsrunde", ereignis: "Tag des Ereignisses",
};
const jahreFrist = (n: number | null) => (n === null ? "von der Kanzlei festlegen" : `${n} ${n === 1 ? "Jahr" : "Jahre"}`);
/** Stammdaten werden gebraucht, solange noch ein Dokument der Person aufbewahrt wird: längste Frist ab Austritt. */
const STAMMDATEN_JAHRE = Math.max(...[...Object.values(AUFBEWAHRUNG), ...Object.values(AUFBEWAHRUNG_MODULE)].filter((a) => a.bezug === "austritt").map((a) => a.jahre ?? 0));
export const FRISTENREGISTER: Record<string, Loeschfrist> = {
  ...Object.fromEntries(Object.entries(AUFBEWAHRUNG).map(([id, a]) => [id, { name: `Personalakte: ${id}`, jahre: a.jahre, frist: jahreFrist(a.jahre), start: START[a.bezug], norm: a.norm, rechtsgrund: LOESCHGRUND, bestaetigt: a.bestaetigt }])),
  bem: { name: "BEM-Unterlagen", jahre: WERTE.bemLoeschfrist.jahre, frist: jahreFrist(WERTE.bemLoeschfrist.jahre), start: "Abschluss des BEM", norm: WERTE.bemLoeschfrist.quelle, rechtsgrund: LOESCHGRUND, bestaetigt: WERTE.bemLoeschfrist.bestaetigt },
  chat: { name: "Chatverläufe", jahre: null, frist: `${WERTE.chatLoeschfristMonate.wert} Monate`, start: "Tag der Nachricht", norm: WERTE.chatLoeschfristMonate.quelle, rechtsgrund: LOESCHGRUND, bestaetigt: WERTE.chatLoeschfristMonate.bestaetigt },
  ...Object.fromEntries(Object.entries(AUFBEWAHRUNG_MODULE).map(([id, a]) => [`modul.${id}`, { name: a.name, jahre: a.jahre, frist: jahreFrist(a.jahre), start: START[a.bezug], norm: a.norm, rechtsgrund: LOESCHGRUND, bestaetigt: a.bestaetigt }])),
  person: {
    name: "Stammdaten und alle übrigen Daten der Person", jahre: STAMMDATEN_JAHRE, frist: jahreFrist(STAMMDATEN_JAHRE), start: START.austritt,
    norm: `${GRUNDSATZ}; so lange wie die längste Frist ab Austritt, weil die Dokumente die Stammdaten brauchen. Von der Kanzlei bestätigen lassen`, rechtsgrund: LOESCHGRUND, bestaetigt: false,
  },

};


/* Texte aus Registerwerten: Zahlen stehen nur hier, Erklärtexte im Code bauen sie aus WERTE zusammen. */
const ZAHLWORTE = ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
/** Zahl als Wort bis zwölf ("drei"), darüber als Ziffer. Für "einen Monat" usw. selbst beugen. */
export const zahlwort = (n: number): string => ZAHLWORTE[n] ?? String(n).replace(".", ",");
/** "1 Monat", "6 Monate", "2,5 Tage". */
export const anzahl = (n: number, einzahl: string, mehrzahl: string): string => `${String(n).replace(".", ",")} ${n === 1 ? einzahl : mehrzahl}`;
export const wochenText = (n: number) => anzahl(n, "Woche", "Wochen");
export const monateText = (n: number) => anzahl(n, "Monat", "Monate");
/** Tage als Wochen, wenn sie aufgehen: 14 ergibt "2 Wochen", 10 ergibt "10 Tage". */
export const fristText = (tage: number) => (tage % 7 === 0 ? wochenText(tage / 7) : anzahl(tage, "Tag", "Tage"));
/** Dativ nach "binnen", "innerhalb von", "in den ersten", "ab": "3 Tagen", "6 Monaten", "2 Jahren". */
/** Frist in Worten: 14 ergibt "zwei Wochen", 3 ergibt "drei Tage". */
export const fristWort = (tage: number) => (tage % 7 === 0 ? (tage === 7 ? "eine Woche" : `${zahlwort(tage / 7)} Wochen`) : tage === 1 ? "ein Tag" : `${zahlwort(tage)} Tage`);
export const fristTextDativ = (tage: number) => (tage % 7 === 0 ? wochenText(tage / 7) : anzahl(tage, "Tag", "Tagen"));
export const monateTextDativ = (n: number) => anzahl(n, "Monat", "Monaten");
export const jahreTextDativ = (n: number) => anzahl(n, "Jahr", "Jahren");

/**
 * Gesetzliche Feiertage: fest (Monat, Tag), beweglich (Tage ab Ostersonntag) oder Buß- und Bettag (Mittwoch vor dem 23.11.).
 * `ab`: Jahr, ab dem der Tag gilt (z. B. Reformationstag in HB, HH, NI, SH seit 2018). Bundesweit gelten die Tage in `bund`
 * (stehen in allen Landesgesetzen, Tag der Deutschen Einheit nach Art. 2 Abs. 2 Einigungsvertrag); je Land nur die Tage darüber hinaus.
 * Sonntagsfeiertage (Oster- und Pfingstsonntag in BB, HE) fehlen bewusst: sie sind ohnehin Sonntage und ändern keine Rechnung.
 * Bayern in drei Gebieten (Strang 24, 11.10.2026): Standard mit Mariä Himmelfahrt (gilt in den meisten Gemeinden), abschaltbar für Gemeinden
 * ohne überwiegend katholische Bevölkerung, Stadt Augsburg zusätzlich mit Friedensfest. Feiertage nur einzelner Gemeinden (Fronleichnam in
 * Teilen von Sachsen und Thüringen) fehlen, die Quelle sagt das.
 */
/** `nurJahr`: einmaliger Feiertag, gilt nur in diesem Jahr (z. B. Berlin 17.06.2028). */
export type FeiertagRegel = { name: string; fest?: readonly [number, number]; ostern?: number; bettag?: true; ab?: number; nurJahr?: number };
/** Gilt die Regel im Jahr y (ab einem Jahr, nur in einem Jahr)? */
export const feiertagGiltIm = (t: FeiertagRegel, y: number) => (t.ab === undefined || y >= t.ab) && (t.nurJahr === undefined || y === t.nurJahr);
const DREIKOENIG: FeiertagRegel = { name: "Heilige Drei Könige", fest: [1, 6] };
const FRONLEICHNAM: FeiertagRegel = { name: "Fronleichnam", ostern: 60 };
const MARIAE: FeiertagRegel = { name: "Mariä Himmelfahrt", fest: [8, 15] };
const ALLERHEILIGEN: FeiertagRegel = { name: "Allerheiligen", fest: [11, 1] };
const REFORMATION: FeiertagRegel = { name: "Reformationstag", fest: [10, 31] };
const REFORMATION_2018: FeiertagRegel = { ...REFORMATION, ab: 2018 };
const BAYERN_QUELLE = "Art. 1 Abs. 1 Bayerisches Feiertagsgesetz (Heilige Drei Könige, Fronleichnam, Allerheiligen; Mariä Himmelfahrt nur in Gemeinden mit überwiegend katholischer Bevölkerung)";
type Land = { name: string; quelle: string; url: string; tage: readonly FeiertagRegel[] };
export const FEIERTAGE = {
  bund: {
    quelle: "Feiertagsgesetze der Länder (z. B. § 1 Abs. 1 HFeiertagsG), Tag der Deutschen Einheit: Art. 2 Abs. 2 Einigungsvertrag",
    tage: [
      { name: "Neujahr", fest: [1, 1] }, { name: "Tag der Arbeit", fest: [5, 1] }, { name: "Tag der Deutschen Einheit", fest: [10, 3] },
      { name: "1. Weihnachtstag", fest: [12, 25] }, { name: "2. Weihnachtstag", fest: [12, 26] },
      { name: "Karfreitag", ostern: -2 }, { name: "Ostermontag", ostern: 1 }, { name: "Christi Himmelfahrt", ostern: 39 }, { name: "Pfingstmontag", ostern: 50 },
    ] as readonly FeiertagRegel[],
  },
  laender: {
    BW: { name: "Baden-Württemberg", quelle: "§ 1 Feiertagsgesetz Baden-Württemberg", url: "https://www.landesrecht-bw.de/bsbw/document/jlr-FeiertGBWrahmen", tage: [DREIKOENIG, FRONLEICHNAM, ALLERHEILIGEN] },
    BY: { name: "Bayern", quelle: `${BAYERN_QUELLE}; Standard: mit Mariä Himmelfahrt`, url: "https://www.gesetze-bayern.de/Content/Document/BayFTG-1", tage: [DREIKOENIG, FRONLEICHNAM, MARIAE, ALLERHEILIGEN] },
    "BY-OHNE-MH": { name: "Bayern, Gemeinde ohne Mariä Himmelfahrt", quelle: `${BAYERN_QUELLE}; Gemeinde ohne überwiegend katholische Bevölkerung`, url: "https://www.gesetze-bayern.de/Content/Document/BayFTG-1", tage: [DREIKOENIG, FRONLEICHNAM, ALLERHEILIGEN] },
    "BY-AUGSBURG": { name: "Bayern, Stadt Augsburg", quelle: `${BAYERN_QUELLE}; Augsburger Hohes Friedensfest am 8. August nur im Stadtgebiet Augsburg (Art. 1 Abs. 2 Bayerisches Feiertagsgesetz)`, url: "https://www.gesetze-bayern.de/Content/Document/BayFTG-1", tage: [DREIKOENIG, FRONLEICHNAM, { name: "Augsburger Hohes Friedensfest", fest: [8, 8] }, MARIAE, ALLERHEILIGEN] },
    BE: { name: "Berlin", quelle: "§ 1 Abs. 1 Feiertagsgesetz Berlin (Internationaler Frauentag am 8. März, seit 2019; einmalig der 17. Juni 2028, 75. Jahrestag des Aufstandes vom 17. Juni 1953, Nr. 11)", url: "https://gesetze.berlin.de/bsbe/document/jlr-FeiertGBErahmen", tage: [{ name: "Internationaler Frauentag", fest: [3, 8], ab: 2019 }, { name: "75. Jahrestag des Aufstandes vom 17. Juni 1953", fest: [6, 17], nurJahr: 2028 }] },
    BB: { name: "Brandenburg", quelle: "§ 2 Abs. 1 Feiertagsgesetz Brandenburg (Reformationstag)", url: "https://bravors.brandenburg.de/gesetze/ftg_2015", tage: [REFORMATION] },
    HB: { name: "Bremen", quelle: "§ 2 Abs. 1 Gesetz über die Sonn-, Gedenk- und Feiertage Bremen (Reformationstag seit 2018)", url: "https://www.transparenz.bremen.de/metainformationen/gesetz-ueber-die-sonn-gedenk-und-feiertage-vom-12-november-1954-296390?asl=bremen203_tpgesetz.c.55340.de&template=20_gp_ifg_meta_detail_d", tage: [REFORMATION_2018] },
    HH: { name: "Hamburg", quelle: "§ 1 Feiertagsgesetz Hamburg (Reformationstag seit 2018)", url: "https://www.landesrecht-hamburg.de/bsha/document/jlr-FeiertGHArahmen", tage: [REFORMATION_2018] },
    HE: { name: "Hessen", quelle: "§ 1 Abs. 1 Hessisches Feiertagsgesetz (Fronleichnamstag)", url: "https://www.rv.hessenrecht.hessen.de/bshe/document/jlr-NNLHE000051B5", tage: [FRONLEICHNAM] },
    MV: { name: "Mecklenburg-Vorpommern", quelle: "§ 2 Abs. 1 Feiertagsgesetz Mecklenburg-Vorpommern (Internationaler Frauentag seit 2023, Reformationstag)", url: "https://www.landesrecht-mv.de/bsmv/document/jlr-NNLMV00007A2F", tage: [{ name: "Internationaler Frauentag", fest: [3, 8], ab: 2023 }, REFORMATION] },
    NI: { name: "Niedersachsen", quelle: "§ 2 Abs. 1 Niedersächsisches Gesetz über die Feiertage (Reformationstag seit 2018, Nds. GVBl. 2018 S. 123)", url: "https://voris.wolterskluwer-online.de/browse/document/f74bc6e7-6ded-3c2c-9afb-b34620456e56", tage: [REFORMATION_2018] },
    NW: { name: "Nordrhein-Westfalen", quelle: "§ 2 Abs. 1 Feiertagsgesetz Nordrhein-Westfalen (Fronleichnam, Allerheiligen)", url: "https://recht.nrw.de/lrgv/gesetz/01012000-bekanntmachung-der-neufassung-des-gesetzes-ueber-die-sonn-und-feiertage/", tage: [FRONLEICHNAM, ALLERHEILIGEN] },
    RP: { name: "Rheinland-Pfalz", quelle: "§ 2 Abs. 1 Landesgesetz über den Schutz der Sonn- und Feiertage Rheinland-Pfalz (Fronleichnam, Allerheiligen)", url: "https://landesrecht.rlp.de/bsrp/document/jlr-FeiertGRPrahmen", tage: [FRONLEICHNAM, ALLERHEILIGEN] },
    SL: { name: "Saarland", quelle: "§ 2 Abs. 1 Feiertagsgesetz Saarland (Fronleichnam, Mariä Himmelfahrt, Allerheiligen)", url: "https://recht.saarland.de/bssl/document/jlr-NNLSL0000A2D6", tage: [FRONLEICHNAM, MARIAE, ALLERHEILIGEN] },
    SN: { name: "Sachsen", quelle: "§ 1 Sächsisches Sonn- und Feiertagsgesetz (Reformationstag, Buß- und Bettag; Fronleichnam nur in einzelnen Gemeinden laut Verordnung, hier nicht enthalten)", url: "https://www.revosax.sachsen.de/vorschrift/3997-SaechsSFG", tage: [REFORMATION, { name: "Buß- und Bettag", bettag: true }] },
    ST: { name: "Sachsen-Anhalt", quelle: "§ 2 Feiertagsgesetz Sachsen-Anhalt (Heilige Drei Könige, Reformationstag)", url: "https://www.landesrecht.sachsen-anhalt.de/bsst/document/jlr-FeiertGSTrahmen", tage: [DREIKOENIG, REFORMATION] },
    SH: { name: "Schleswig-Holstein", quelle: "§ 2 Abs. 1 Sonn- und Feiertagsgesetz Schleswig-Holstein (Reformationstag seit 2018)", url: "https://www.gesetze-rechtsprechung.sh.juris.de/bssh/document/jlr-FeiertGSH2004rahmen", tage: [REFORMATION_2018] },
    TH: { name: "Thüringen", quelle: "§ 2 Abs. 1 Thüringer Feiertagsgesetz (Weltkindertag seit 2019, Reformationstag; Fronleichnam nur in einzelnen Gemeinden, hier nicht enthalten)", url: "https://landesrecht.thueringen.de/bsth/document/jlr-FeiertGTHrahmen", tage: [{ name: "Weltkindertag", fest: [9, 20], ab: 2019 }, REFORMATION] },
  } satisfies Record<string, Land>,
} as const;
