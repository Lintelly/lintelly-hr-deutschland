// Tests für die Geld-Rechner (Abfindung, Minijob, Urlaubsabgeltung, Entgeltfortzahlung, Ausgleichsabgabe).
// Aufruf: node scripts/test-geld.mjs (Node 22.18+ mit Type-Stripping)
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith(".")) return n(s + ".ts", c); throw e; } }`), import.meta.url);
const assert = (await import("node:assert/strict")).default;
const { berechneAbfindung } = await import("../components/tools/abfindung-logik.ts");
const { berechneMinijob, abgabenArbeitgeber } = await import("../components/tools/minijob-logik.ts");
const U = await import("../components/tools/urlaubsabgeltung-logik.ts");
const { berechneEfz } = await import("../components/tools/entgeltfortzahlung-logik.ts");
const { berechne: ausgleich } = await import("../components/tools/ausgleichsabgabe-logik.ts");
const { parseNum } = await import("../components/tools/format.ts");
const { berechneUrlaub } = await import("../components/tools/urlaubsanspruch-logik.ts");

let n = 0;
function t(name, fn) { fn(); n++; console.log("ok", n, name); }
const D = (s) => new Date(s + "T00:00:00Z");
const iso = (d) => d && d.toISOString().slice(0, 10);

/* ---------- Zahlen lesen ---------- */
t("parseNum: deutsche Schreibweisen", () => {
  assert.equal(parseNum("4.200"), 4200);
  assert.equal(parseNum("4.200,50 €"), 4200.5);
  assert.equal(parseNum("14,5"), 14.5);
  assert.equal(parseNum("1.5"), 1.5);
  assert.equal(parseNum(""), null);
  assert.equal(parseNum("x"), null);
});

/* ---------- Abfindung (§ 1a, § 10 KSchG) ---------- */
const abf = (o) => berechneAbfindung({ gehalt: "4.000", sonder: "", faktor: 0.5, alter: "", klein: false, ...o });
t("Abfindung: 6 volle Jahre × 0,5 × 4.000 € = 12.000 €", () => {
  const r = abf({ eintritt: "2020-01-01", austritt: "2025-12-31" });
  assert.equal(r.jahre, 6); assert.equal(r.betrag, 12000);
});
t("Abfindung: genau 6 Monate Rest werden nicht aufgerundet, ein Tag mehr schon", () => {
  assert.equal(abf({ eintritt: "2020-01-01", austritt: "2026-06-30" }).jahre, 6);
  assert.equal(abf({ eintritt: "2020-01-01", austritt: "2026-07-01" }).jahre, 7);
});
t("Abfindung: Sonderzahlungen gehen mit 1/12 ins Monatsgehalt", () => {
  assert.equal(abf({ eintritt: "2020-01-01", austritt: "2025-12-31", sonder: "12.000" }).monat, 5000);
});
t("Abfindung: unter 6 Monaten 0 Jahre und Hinweis Wartezeit", () => {
  const r = abf({ eintritt: "2026-01-01", austritt: "2026-05-31" });
  assert.equal(r.jahre, 0); assert.equal(r.betrag, 0);
  assert.ok(r.msgs.some((m) => m.title.includes("6 Monate")));
});
t("Abfindung: Höchstbetrag 12, 15 oder 18 Monatsverdienste nach Alter und Dauer", () => {
  assert.equal(abf({ eintritt: "2000-01-01", austritt: "2025-12-31", alter: "56" }).kStufe.monate, 18);
  assert.equal(abf({ eintritt: "2008-01-01", austritt: "2025-12-31", alter: "52" }).kStufe.monate, 15);
  assert.equal(abf({ eintritt: "2008-01-01", austritt: "2025-12-31", alter: "49" }).kStufe.monate, 12);
  assert.equal(abf({ eintritt: "2012-01-01", austritt: "2025-12-31", alter: "60" }).kStufe.monate, 12);
});
t("Abfindung: Jahresgehalt statt Monatsgehalt wird abgefangen", () => {
  assert.ok(abf({ gehalt: "120.000", eintritt: "2020-01-01", austritt: "2025-12-31" }).errors.gehalt);
});

/* ---------- Minijob 2026/2027 ---------- */
t("Minijob 2026: 30 h × 20,10 € = 603 € liegt genau auf der Grenze", () => {
  const r = berechneMinijob(20.1, 30, "monat", 2026, 0);
  assert.equal(r.monatsEntgelt, 603); assert.equal(r.imMinijob, true);
});
t("Minijob 2026: 1 Cent darüber ist kein Minijob mehr", () => {
  assert.equal(berechneMinijob(20.11, 30, "monat", 2026, 0).imMinijob, false);
});
t("Minijob 2026: Mindestlohn 13,90 €, höchstens 43,38 Stunden", () => {
  const r = berechneMinijob(13.9, null, "monat", 2026, 0);
  assert.equal(r.maxMonat, 43.38); assert.equal(r.unterMindestlohn, false);
  assert.equal(berechneMinijob(13, null, "monat", 2026, 0).unterMindestlohn, true);
});
t("Minijob 2027: Grenze 633 €, Jahresgrenze 7.596 €", () => {
  const r = berechneMinijob(14.6, 10, "monat", 2027, 0);
  assert.equal(r.grenze, 633); assert.equal(r.jahresGrenze, 7596);
});
t("Minijob: Einmalzahlung über dem Jahresspielraum kippt den Minijob", () => {
  const r = berechneMinijob(20, 30, "monat", 2026, 0);
  assert.equal(r.spielraum, 36);
  assert.equal(berechneMinijob(20, 30, "monat", 2026, 37).imMinijob, false);
});

t("Minijob-Abgaben 2026 bei 603 €: 187,95 € Abgaben, 790,95 € Gesamtkosten", () => {
  const a = abgabenArbeitgeber(603, { gesetzlichVersichert: true, pauschsteuer: true });
  assert.equal(a.summe, 187.95); assert.equal(a.gesamtkosten, 790.95);
  assert.deepEqual(a.posten.map((p) => p.betrag), [78.39, 90.45, 12.06, 4.82, 1.33, 0.9]);
});
t("Minijob-Abgaben: privat versichert ohne KV-Pauschale, ohne Pauschsteuer ohne 2 %", () => {
  const a = abgabenArbeitgeber(500, { gesetzlichVersichert: false, pauschsteuer: false });
  assert.deepEqual(a.posten.map((p) => p.name), ["Rentenversicherung", "Umlage U1 (Krankheit)", "Umlage U2 (Mutterschaft)", "Insolvenzgeldumlage"]);
  assert.equal(a.summe, 75 + 4 + 1.1 + 0.75);
});

/* ---------- Urlaubsabgeltung (§§ 4, 5, 11 BUrlG) ---------- */
const urlaub = (eintritt, austritt, jahresurlaub = 30, tageWoche = 5) => U.anspruchImAustrittsjahr({ eintritt: D(eintritt), austritt: D(austritt), jahresurlaub, tageWoche, mehrZwoelfteln: false });
const anspruchRechner = (eintritt, austritt, jahresurlaub, tage) => berechneUrlaub({ jahresurlaub, bezug: 5, tage, jahr: Number(austritt.slice(0, 4)), eintritt, austritt }).gesamt;
t("Teilzeit 3 Tage: 30 Tage Vollzeit werden 18 (30 × 3 ÷ 5)", () => {
  const r = urlaub("2020-01-01", "2026-09-30", 30, 3);
  assert.equal(r.anspruch, 18); assert.equal(r.gesetzlich, 12);
});
t("Teilurlaub gleich wie im Urlaubsanspruch-Rechner: 28 × 1/12 = 2,33 wird 3", () => {
  assert.equal(urlaub("2020-01-01", "2026-01-31", 28).anspruch, anspruchRechner("2020-01-01", "2026-01-31", 28, 5));
  assert.equal(urlaub("2020-01-01", "2026-01-31", 28).anspruch, 3);
});
t("Teilurlaub Teilzeit gleich wie im Urlaubsanspruch-Rechner: 18 × 5/12 = 7,5 wird 8", () => {
  assert.equal(urlaub("2020-01-01", "2026-05-31", 30, 3).anspruch, anspruchRechner("2020-01-01", "2026-05-31", 30, 3));
  assert.equal(urlaub("2020-01-01", "2026-05-31", 30, 3).anspruch, 8);
});
t("Austritt 31.05.: Teilurlaub 5/12 von 30 = 12,5, aufgerundet 13", () => {
  const r = urlaub("2020-01-01", "2026-05-31");
  assert.equal(r.art, "teil"); assert.equal(r.monate, 5); assert.equal(r.anspruch, 13);
});
t("Austritt 31.07. nach Wartezeit: voller Jahresurlaub 30 (20 gesetzlich + 10 Mehrurlaub)", () => {
  const r = urlaub("2020-01-01", "2026-07-31");
  assert.equal(r.art, "voll"); assert.equal(r.anspruch, 30); assert.equal(r.gesetzlich, 20);
});
t("Wartezeit nicht erfüllt: Eintritt 01.03., Austritt 31.07. = 5 Monate Teilurlaub", () => {
  const r = urlaub("2026-03-01", "2026-07-31");
  assert.equal(r.art, "teil"); assert.equal(r.monate, 5); assert.equal(iso(r.wartezeitEnde), "2026-08-31");
});
t("Tagessatz: 6.500 € in 13 Wochen bei 5 Tagen = 100 €", () => assert.equal(U.tagessatz(6500, 5), 100));

/* ---------- Entgeltfortzahlung (§ 3 EFZG) ---------- */
const P = (nr, von, bis, gruppe = 0, angefangen = false) => ({ nr, von: D(von), bis: D(bis), gruppe, angefangen });
t("EFZ: 6 Wochen = 42 Tage, danach Krankengeld", () => {
  const [f] = berechneEfz(D("2024-04-01"), [P(1, "2026-01-05", "2026-03-31")]);
  assert.equal(f.bezahlt, 42); assert.equal(iso(f.efzBis), "2026-02-15"); assert.equal(iso(f.kgAb), "2026-02-16");
});
t("EFZ: Fortsetzungserkrankung verbraucht das Budget, andere Ursache nicht", () => {
  const gleich = berechneEfz(D("2024-04-01"), [P(1, "2026-01-05", "2026-02-03"), P(2, "2026-03-02", "2026-03-31")]);
  assert.equal(gleich[0].bezahlt, 30); assert.equal(gleich[1].bezahlt, 12);
  const anders = berechneEfz(D("2024-04-01"), [P(1, "2026-01-05", "2026-02-03"), P(2, "2026-03-02", "2026-03-31", 1)]);
  assert.equal(anders[1].bezahlt, 30);
});
t("EFZ: nach 6 Monaten ohne diese Erkrankung neuer Anspruch", () => {
  const r = berechneEfz(D("2020-01-01"), [P(1, "2025-01-06", "2025-02-16"), P(2, "2025-09-01", "2025-09-10")]);
  assert.equal(r[0].bezahlt, 42); assert.equal(r[1].neuerAnspruch, true); assert.equal(r[1].bezahlt, 10);
});
t("EFZ: Wartezeit 4 Wochen ab Beginn, vorher kein Anspruch", () => {
  const [f] = berechneEfz(D("2026-01-01"), [P(1, "2026-01-10", "2026-02-28")]);
  assert.equal(f.wartezeitTage, 19); assert.equal(iso(f.efzVon), "2026-01-29"); assert.equal(f.bezahlt, 31);
});
t("EFZ: angefangener Arbeitstag zählt nicht mit", () => {
  const [f] = berechneEfz(D("2024-04-01"), [P(1, "2026-01-05", "2026-03-31", 0, true)]);
  assert.equal(iso(f.efzVon), "2026-01-06"); assert.equal(iso(f.efzBis), "2026-02-16");
});

t("EFZ: neue AU direkt im Anschluss ohne Arbeitstag ist ein Verhinderungsfall (BAG 5 AZR 505/18)", () => {
  const r = berechneEfz(D("2024-04-01"), [P(1, "2026-01-05", "2026-01-31"), P(2, "2026-02-01", "2026-03-31", 1)]);
  assert.equal(r.length, 1); assert.deepEqual(r[0].nrs, [1, 2]); assert.equal(r[0].direktAnschluss, true);
  assert.equal(r[0].bezahlt, 42); assert.equal(iso(r[0].efzBis), "2026-02-15");
});
t("EFZ: Freitag bis Montag, nur Wochenende dazwischen, ist auch ein Verhinderungsfall", () => {
  const r = berechneEfz(D("2024-04-01"), [P(1, "2026-01-05", "2026-01-30"), P(2, "2026-02-02", "2026-03-31", 1)]);
  assert.equal(r.length, 1); assert.equal(r[0].direktAnschluss, true); assert.equal(r[0].bezahlt, 42);
});
t("EFZ: mit einem Arbeitstag dazwischen neue Erkrankung, neuer Anspruch", () => {
  const r = berechneEfz(D("2024-04-01"), [P(1, "2026-01-05", "2026-01-29"), P(2, "2026-02-02", "2026-03-31", 1)]);
  assert.equal(r.length, 2); assert.equal(r[1].bezahlt, 42);
});

/* ---------- Ausgleichsabgabe (§§ 154, 160 SGB IX) ---------- */
const zwoelf = (x) => Array(12).fill(x);
t("Ausgleichsabgabe 2026: 80 Plätze, 1 besetzt = 3 unbesetzt × 12 × 405 € = 14.580 €", () => {
  const r = ausgleich(zwoelf(80), zwoelf(1), 2026);
  assert.equal(r.unbesetzt, 36); assert.equal(r.satz, 405); assert.equal(r.abgabe, 14580);
});
t("Ausgleichsabgabe 2026: 30 Plätze, niemand besetzt = 12 × 235 €", () => assert.equal(ausgleich(zwoelf(30), zwoelf(0), 2026).abgabe, 2820));
t("Ausgleichsabgabe 2026: 50 Plätze, 1 besetzt = 12 × 155 €", () => assert.equal(ausgleich(zwoelf(50), zwoelf(1), 2026).abgabe, 1860));
t("Ausgleichsabgabe: unter 20 Plätzen keine Pflicht", () => {
  const r = ausgleich(zwoelf(19), zwoelf(0), 2026);
  assert.equal(r.pflichtig, false); assert.equal(r.abgabe, 0);
});

/* ---------- Arbeitgeberkosten (Sätze und Grenzen 2026) ---------- */
const { berechneAgKosten } = await import("../components/tools/arbeitgeberkosten-logik.ts");
const agk = (o) => berechneAgKosten({ brutto: 4000, art: "angestellt", zusatzbeitrag: 2.9, ...o });
const posten = (r) => Object.fromEntries(r.posten.map((p) => [p.name, p.betrag]));
t("Arbeitgeberkosten 4.000 €: 852 € Abgaben, 4.852 € im Monat, 58.224 € im Jahr", () => {
  const r = agk({});
  assert.equal(r.art, "regulaer"); assert.equal(r.abgaben, 852); assert.equal(r.gesamt, 4852); assert.equal(r.jahr, 58224);
  assert.deepEqual(posten(r), { Krankenversicherung: 350, Pflegeversicherung: 72, Rentenversicherung: 372, Arbeitslosenversicherung: 52, Insolvenzgeldumlage: 6 });
});
t("Arbeitgeberkosten 7.000 €: Kranken- und Pflege nur bis 5.812,50 €", () => {
  const r = agk({ brutto: 7000 });
  assert.equal(posten(r).Krankenversicherung, 508.59); assert.equal(posten(r).Pflegeversicherung, 104.63); assert.equal(r.abgaben, 1365.72);
});
t("Arbeitgeberkosten 9.000 €: Rente und Arbeitslosen nur bis 8.450 €, wie das HR-Plugin", () => {
  const r = agk({ brutto: 9000 });
  assert.equal(posten(r).Rentenversicherung + posten(r).Arbeitslosenversicherung, 895.7); assert.equal(posten(r).Insolvenzgeldumlage, 12.68); assert.equal(r.abgaben, 1521.6);
});
t("Arbeitgeberkosten: krummer Zusatzbeitrag 2,45 % rundet erst den Betrag, nicht den Satz", () => {
  assert.equal(posten(agk({ zusatzbeitrag: 2.45 })).Krankenversicherung, 341); // 4.000 € × 8,525 % = 341,00 €
});
t("Arbeitgeberkosten: Zusatzbeitrag der Kasse ändert nur die Krankenversicherung", () => {
  assert.equal(posten(agk({ zusatzbeitrag: 3.5 })).Krankenversicherung, 362); // 4.000 € × (14,6 + 3,5) % / 2
});
t("Arbeitgeberkosten 1.500 €: Übergangsbereich mit Faktor F 0,6619", () => {
  const r = agk({ brutto: 1500 });
  assert.equal(r.art, "midijob");
  assert.deepEqual(posten(r), { Krankenversicherung: 137.36, Pflegeversicherung: 28.25, Rentenversicherung: 146, Arbeitslosenversicherung: 20.41, Insolvenzgeldumlage: 2.25 });
  assert.equal(r.abgaben, 334.27);
});
t("Arbeitgeberkosten: im Übergangsbereich zahlt der Arbeitgeber mehr als regulär, bei 2.000 € gleich viel", () => {
  assert.ok(agk({ brutto: 1500 }).abgaben > 1500 * 0.2115 + 2.25);
  assert.ok(Math.abs(agk({ brutto: 2000 }).abgaben - (2000 * 0.2115 + 3)) < 0.05);
});
t("Arbeitgeberkosten bis 603 €: Minijob, gleiche Abgaben wie im Minijob-Rechner", () => {
  const r = agk({ brutto: 500 });
  assert.equal(r.art, "minijob"); assert.equal(r.abgaben, abgabenArbeitgeber(500, { gesetzlichVersichert: true, pauschsteuer: true }).summe);
});
t("Arbeitgeberkosten Werkstudent 2.500 €: nur Rente und Insolvenzgeldumlage", () => {
  const r = agk({ brutto: 2500, art: "werkstudent" });
  assert.deepEqual(posten(r), { Rentenversicherung: 232.5, Insolvenzgeldumlage: 3.75 });
});
t("Arbeitgeberkosten Werkstudent 1.200 €: Rente im Übergangsbereich", () => {
  const r = agk({ brutto: 1200, art: "werkstudent" });
  assert.equal(r.art, "midijob"); assert.equal(posten(r).Rentenversicherung, 121.99);
});
t("Arbeitgeberkosten: leer, 0 oder Jahresgehalt", () => {
  assert.equal(agk({ brutto: null }), null);
  assert.equal(agk({ brutto: 0 }), null);
  assert.equal(agk({ brutto: 60000 }).jahresgehalt, true);
});

console.log(`\n${n} Tests bestanden.`);
