// Tests für lib/fristen.ts. Aufruf: node scripts/test-fristen.mjs (Node 22.18+ mit Type-Stripping)
import assert from "node:assert/strict";
import * as F from "../lib/fristen.ts";

let n = 0;
function t(name, fn) { fn(); n++; console.log("ok", n, name); }
const k = (e) => F.berechneKuendigung(e);

t("Grundfrist: Zugang 03.10. endet 31.10.", () => assert.equal(k({ eintritt: "2025-06-01", zugang: "2026-10-03" }).ende, "2026-10-31"));
t("Grundfrist: Zugang 04.10. endet 15.11.", () => assert.equal(k({ eintritt: "2025-06-01", zugang: "2026-10-04" }).ende, "2026-11-15"));
t("Grundfrist: Zugang 18.10. endet 15.11., 19.10. endet 30.11.", () => {
  assert.equal(k({ eintritt: "2025-06-01", zugang: "2026-10-18" }).ende, "2026-11-15");
  assert.equal(k({ eintritt: "2025-06-01", zugang: "2026-10-19" }).ende, "2026-11-30");
});
t("Februar Nicht-Schaltjahr: Zugang 31.01.2027 + 28 = 28.02.", () => assert.equal(k({ eintritt: "2026-01-01", zugang: "2027-01-31" }).ende, "2027-02-28"));
t("Schaltjahr: Zugang 01.02.2028 + 28 = 29.02.", () => assert.equal(k({ eintritt: "2027-01-01", zugang: "2028-02-01" }).ende, "2028-02-29"));
t("Probezeit: Zugang Mo 14.09. endet Mo 28.09., beliebiger Tag", () => {
  const r = k({ eintritt: "2026-07-01", zugang: "2026-09-14", probezeitMonate: 6 });
  assert.equal(r.inProbezeit, true); assert.equal(r.ende, "2026-09-28"); assert.equal(r.probezeitEnde, "2026-12-31");
});
t("Probezeit: Zugang am letzten Probezeittag zählt noch, Frist reicht darüber hinaus", () => {
  const r = k({ eintritt: "2026-04-15", zugang: "2026-10-14", probezeitMonate: 6 });
  assert.equal(r.probezeitEnde, "2026-10-14"); assert.equal(r.inProbezeit, true); assert.equal(r.ende, "2026-10-28");
});
t("Probezeit vorbei: Tag danach Grundfrist", () => {
  const r = k({ eintritt: "2026-04-15", zugang: "2026-10-15", probezeitMonate: 6 });
  assert.equal(r.inProbezeit, false); assert.equal(r.ende, "2026-11-15");
});
t("Probezeit 8 Monate wird auf 6 gekappt", () => {
  const r = k({ eintritt: "2026-01-01", zugang: "2026-07-15", probezeitMonate: 8 });
  assert.equal(r.probezeitEnde, "2026-06-30"); assert.equal(r.inProbezeit, false);
  assert.ok(r.hinweise.some((h) => h.text.includes("6 Monate")));
});
t("Probezeitende Eintritt 31.08. = 28.02. (§ 188 Abs. 3)", () => assert.equal(F.probezeitEnde("2026-08-31", 6), "2027-02-28"));
t("Staffel 2 Jahre: 1 Monat zum Monatsende", () => {
  const r = k({ eintritt: "2024-10-01", zugang: "2026-10-01" });
  assert.equal(r.jahre, 2); assert.equal(r.ende, "2026-11-30"); assert.equal(r.spaetesterZugang, "2026-10-31");
});
t("Ein Tag vor Jahrestag: noch Grundfrist plus Warnung", () => {
  const r = k({ eintritt: "2024-10-01", zugang: "2026-09-30" });
  assert.equal(r.jahre, 1); assert.equal(r.ende, "2026-10-31"); assert.ok(r.hinweise.some((h) => h.typ === "warnung" && h.text.includes("2 Jahre")));
});
t("Staffel 5 Jahre, Zugang 31.03. endet 31.05.", () => assert.equal(k({ eintritt: "2020-01-01", zugang: "2026-03-31" }).ende, "2026-05-31"));
t("Staffel 5 Jahre, Zugang 01.04. endet 30.06.", () => assert.equal(k({ eintritt: "2020-01-01", zugang: "2026-04-01" }).ende, "2026-06-30"));
t("Staffel 20 Jahre: 7 Monate", () => {
  const r = k({ eintritt: "2005-03-01", zugang: "2026-10-04" });
  assert.equal(r.jahre, 21); assert.equal(r.ende, "2027-05-31"); assert.equal(r.spaetesterZugang, "2026-10-31");
});
t("Jahre vor dem 25. Lebensjahr zählen (keine Alterskürzung): 10 Jahre = 4 Monate", () => assert.equal(k({ eintritt: "2016-08-01", zugang: "2026-10-04" }).regel.monate, 4));
t("Arbeitnehmerkündigung nach 10 Jahren: nur Grundfrist", () => {
  const r = k({ eintritt: "2016-08-01", zugang: "2026-10-04", kuendigender: "arbeitnehmer" });
  assert.equal(r.regel.art, "grundfrist"); assert.equal(r.ende, "2026-11-15");
});
t("Arbeitnehmer mit Staffel im Vertrag", () => assert.equal(k({ eintritt: "2016-08-01", zugang: "2026-10-04", kuendigender: "arbeitnehmer", staffelAuchFuerArbeitnehmer: true }).ende, "2027-02-28"));
t("Kleinbetrieb: 4 Wochen zu jedem Tag", () => {
  const r = k({ eintritt: "2025-01-01", zugang: "2026-10-07", kleinbetriebVierWochen: true });
  assert.equal(r.ende, "2026-11-04"); assert.equal(r.termine.length, 1);
});
t("Vertrag 3 Monate zum Quartalsende gewinnt", () => {
  const r = k({ eintritt: "2023-01-01", zugang: "2026-10-04", vertrag: { monate: 3, termin: "quartalsende" } });
  assert.equal(r.endeGesetzlich, "2026-11-30"); assert.equal(r.ende, "2027-03-31"); assert.equal(r.regel.art, "vertrag");
  assert.equal(r.spaetesterZugang, "2026-12-31");
});
t("Vertrag kürzer als Gesetz: Gesetz gilt", () => {
  const r = k({ eintritt: "2010-01-01", zugang: "2026-10-04", vertrag: { monate: 1, termin: "monatsende" } });
  assert.equal(r.regel.art, "staffel"); assert.equal(r.ende, "2027-04-30");
});
t("Nächste Termine Grundfrist und spätester Zugang", () => {
  const r = k({ eintritt: "2025-06-01", zugang: "2026-10-04" });
  assert.deepEqual(r.termine.map((x) => [x.termin, x.spaetesterZugang]), [["2026-11-15", "2026-10-18"], ["2026-11-30", "2026-11-02"], ["2026-12-15", "2026-11-17"]]);
});
t("Spätester Zugang 1 Monat für 28.02.2027 ist 31.01.2027", () => assert.equal(F.spaetesterZugangFuer("2027-02-28", F.regelStaffel(1)), "2027-01-31"));
t("Spätester Zugang 1 Monat für 30.04. ist 31.03.", () => assert.equal(F.spaetesterZugangFuer("2026-04-30", F.regelStaffel(1)), "2026-03-31"));
t("Eintritt 29.02.: Jahrestag 01.03.", () => { assert.equal(F.volleJahre("2024-02-29", "2026-02-28"), 1); assert.equal(F.volleJahre("2024-02-29", "2026-03-01"), 2); });
t("Sonntag-Zugang gibt Warnung", () => assert.ok(k({ eintritt: "2025-01-01", zugang: "2026-10-04" }).hinweise.some((h) => h.text.includes("Sonntag"))));
t("Tarifvertrag gibt Warnung", () => assert.ok(k({ eintritt: "2025-01-01", zugang: "2026-10-05", tarifvertrag: true }).hinweise.some((h) => h.text.includes("Tarifvertrag"))));
t("Ungültiges Datum wirft", () => assert.throws(() => k({ eintritt: "2026-02-30", zugang: "2026-10-05" })));

// Ergänzt 05.10.2026 (Rechtscheck)
t("§ 622 Abs. 2 Staffel komplett: Monate je Stufe", () => {
  const erwartet = [[1, 0], [2, 1], [4, 1], [5, 2], [7, 2], [8, 3], [9, 3], [10, 4], [11, 4], [12, 5], [14, 5], [15, 6], [19, 6], [20, 7], [35, 7]];
  for (const [j, m] of erwartet) assert.equal(F.staffelMonate(j), m, `${j} Jahre`);
});
t("Staffel je Stufe am Jahrestag: Zugang 01.10.2026 endet n Monate später am Monatsende", () => {
  for (const [j, m, ende] of [[5, 2, "2026-12-31"], [8, 3, "2027-01-31"], [12, 5, "2027-03-31"], [15, 6, "2027-04-30"]]) {
    const r = k({ eintritt: `${2026 - j}-10-01`, zugang: "2026-10-01" });
    assert.equal(r.jahre, j); assert.equal(r.regel.monate, m); assert.equal(r.ende, ende);
  }
});
t("Nicks Fall: Vertrag 3 Monate zum Monatsende, Zugang 30.10.2026: Frist läuft 30.01., Ende 31.01.2027", () => {
  const r = k({ eintritt: "2022-03-01", zugang: "2026-10-30", vertrag: { monate: 3, termin: "monatsende" } });
  assert.equal(r.regel.art, "vertrag"); assert.equal(r.fristablauf, "2027-01-30"); assert.equal(r.ende, "2027-01-31");
  assert.equal(r.endeGesetzlich, "2026-11-30"); assert.equal(r.spaetesterZugang, "2026-10-31");
});
t("Vertrag 3 Monate zum Monatsende, Zugang 31.10.: Fristablauf = Ende 31.01.", () => {
  const r = k({ eintritt: "2022-03-01", zugang: "2026-10-31", vertrag: { monate: 3, termin: "monatsende" } });
  assert.equal(r.fristablauf, "2027-01-31"); assert.equal(r.ende, "2027-01-31");
});
t("Vertrag gilt auch bei Kündigung durch Mitarbeitende", () => {
  const r = k({ eintritt: "2025-01-01", zugang: "2026-10-05", kuendigender: "arbeitnehmer", vertrag: { monate: 3, termin: "quartalsende" } });
  assert.equal(r.ende, "2027-03-31");
});
t("Probezeit 2 Wochen: Zugang Fr 02.10.2026 endet Fr 16.10.2026, nur ein Termin", () => {
  const r = k({ eintritt: "2026-09-01", zugang: "2026-10-02", probezeitMonate: 3 });
  assert.equal(r.regel.art, "probezeit"); assert.equal(r.ende, "2026-10-16"); assert.equal(r.fristablauf, r.ende); assert.equal(r.termine.length, 1);
  assert.equal(r.spaetesterZugang, "2026-10-02");
});
t("Probezeit: längere Vertragsfrist greift in der Probezeit nicht, Hinweis kommt", () => {
  const r = k({ eintritt: "2026-09-01", zugang: "2026-10-02", probezeitMonate: 6, vertrag: { monate: 3, termin: "quartalsende" } });
  assert.equal(r.ende, "2026-10-16"); assert.ok(r.hinweise.some((h) => h.text.includes("Probezeit")));
});
t("Kleinbetrieb Abs. 5: ab 2 Jahren gilt für den Arbeitgeber trotzdem die Staffel", () => {
  const r = k({ eintritt: "2023-01-01", zugang: "2026-10-07", kleinbetriebVierWochen: true });
  assert.equal(r.regel.art, "staffel"); assert.equal(r.ende, "2026-11-30"); assert.ok(r.hinweise.some((h) => h.text.includes("Kleinbetriebsregel")));
});
t("Kleinbetrieb Abs. 5 bei Kündigung durch Mitarbeitende nach 10 Jahren: 4 Wochen zu jedem Tag", () => {
  const r = k({ eintritt: "2015-01-01", zugang: "2026-10-07", kuendigender: "arbeitnehmer", kleinbetriebVierWochen: true });
  assert.equal(r.regel.art, "kleinbetrieb"); assert.equal(r.ende, "2026-11-04");
});
t("Tarifvertrag: Hinweis auf § 622 Abs. 4, Rechnung bleibt gesetzlich", () => {
  const r = k({ eintritt: "2025-01-01", zugang: "2026-10-05", tarifvertrag: true });
  assert.equal(r.regel.art, "grundfrist"); assert.ok(r.hinweise.some((h) => h.typ === "warnung" && /622\sAbs\.\s4/.test(h.text)));
});
t("§ 193 BGB gilt nicht: Ende Sonntag 15.11.2026 bleibt", () => {
  const r = k({ eintritt: "2025-06-01", zugang: "2026-10-18" });
  assert.equal(F.wochentag(r.ende), 0); assert.equal(r.ende, "2026-11-15"); assert.ok(r.hinweise.some((h) => /193\sBGB/.test(h.text)));
});
t("§ 193 BGB gilt nicht: Ende am Feiertag 03.10. bei Kleinbetrieb bleibt", () => {
  const r = k({ eintritt: "2025-06-01", zugang: "2026-09-05", kleinbetriebVierWochen: true });
  assert.equal(r.ende, "2026-10-03");
});
t("Zugang am Samstag: Hinweis, Rechnung ab Samstag", () => {
  const r = k({ eintritt: "2025-06-01", zugang: "2026-10-03" });
  assert.equal(r.ende, "2026-10-31"); assert.ok(r.hinweise.some((h) => h.text.includes("Samstag")));
});
t("Zugang an bundesweitem Feiertag (Fr 25.12.2026): Warnung", () => {
  const r = k({ eintritt: "2025-06-01", zugang: "2026-12-25" });
  assert.ok(r.hinweise.some((h) => h.typ === "warnung" && h.text.includes("1. Weihnachtstag")));
});
t("Feiertage: Ostern 2027 = 28.03., Karfreitag 26.03., Pfingstmontag 17.05.2027, Werktag kein Feiertag", () => {
  assert.equal(F.ostersonntag(2027), "2027-03-28"); assert.equal(F.ostersonntag(2026), "2026-04-05");
  assert.equal(F.bundesFeiertag("2027-03-26"), "Karfreitag"); assert.equal(F.bundesFeiertag("2027-05-17"), "Pfingstmontag");
  assert.equal(F.bundesFeiertag("2026-10-05"), null);
});

console.log(`\n${n} Tests bestanden.`);
