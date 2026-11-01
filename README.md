# Lintelly HR Deutschland

**Eine Personalabteilung zum Fragen, für Gründer und kleine Firmen in Deutschland.** Lintelly HR ist ein offener MCP-Server für
Claude, ChatGPT und jeden anderen Assistenten mit MCP, **nur für deutsches Arbeits- und Sozialversicherungsrecht**: Fristen, Kosten, Pflichten, Abläufe, Schreiben und Vertragsbausteine,
jede Zahl mit Rechenweg und amtlicher Quelle. Ohne Anmeldung, ohne Konto, ohne gespeicherte Eingaben.

> Allgemeine Auskunft, keine Rechtsberatung im Einzelfall.

## Was du fragen kannst

- „Ich stelle meine erste Mitarbeiterin ein, 20 Stunden, ab 1. Dezember. Was muss ich tun?“
- „Was kostet mich ein Minijobber, was eine Teilzeitkraft mit 1.800 brutto?“
- „Tom ist seit drei Wochen krank. Wie lange zahle ich, kriege ich was zurück?“
- „Meine Mitarbeiterin ist schwanger. Was gilt jetzt?“
- „Ich will jemandem kündigen. 6 Leute, er ist seit 2 Jahren da.“
- „Wie viel Urlaub hat jemand mit 3 Tagen pro Woche, und verfällt der alte?“
- „Schreib mir ein Zwischenzeugnis, sie ist super.“
- „Ab wann brauche ich einen Datenschutzbeauftragten oder einen Betriebsrat?“
- „Was ändert sich für mich am 1. Januar?“

## Verbinden

**Claude (claude.ai, Desktop, Mobil):** Einstellungen > Connectors > Eigenen Connector hinzufügen, Adresse `https://hr.lintelly.com/mcp`.

**Claude Code:**
```bash
claude mcp add --transport http lintelly-hr-deutschland https://hr.lintelly.com/mcp
```
oder als Plugin mit Skills: `/plugin marketplace add Lintelly/lintelly-hr-deutschland`, dann `/plugin install lintelly-hr-deutschland@lintelly`.

**Gemini CLI:** als Erweiterung (nutzt `https://hr.lintelly.com/mcp`, `gemini-extension.json` im Wurzelverzeichnis):
```bash
gemini extensions install https://github.com/Lintelly/lintelly-hr-deutschland
```

**ChatGPT:** Einstellungen > Apps und Connectors > Entwicklermodus > Connector anlegen, Adresse `https://hr.lintelly.com/mcp`, Authentifizierung: keine.

**Lokal (stdio), z. B. Claude Desktop oder Cursor:**
```json
{ "mcpServers": { "lintelly-hr-deutschland": { "command": "npx", "args": ["-y", "@lintelly/hr-deutschland"] } } }
```

**Docker:** `docker run -i --rm ghcr.io/lintelly/lintelly-hr-deutschland` (stdio) oder als HTTP-Server `docker run --rm -p 8787:8787 ghcr.io/lintelly/lintelly-hr-deutschland --http`.

## Werkzeuge

| Gruppe | Werkzeuge |
|---|---|
| Abläufe | `ablauf` (erste Einstellung, Eintritt, Austritt, Krankheit, Mutterschutz, Elternzeit, Kündigung vorbereiten, Probezeitende, Befristungsende, Monatsende Lohn), `workflow_vorlage` |
| Fristen | `kuendigungsfrist_rechnen`, `klagefrist`, `probezeit`, `befristung`, `elternzeit_fristen`, `mutterschutz`, `aufbewahrungsfristen`, `pausen` |
| Geld | `arbeitgeberkosten`, `minijob`, `mindestlohn_check`, `entgeltfortzahlung`, `urlaubsabgeltung`, `abfindung_faustformel`, `ausgleichsabgabe` |
| Urlaub | `urlaubsanspruch`, `urlaubsverfall_hinweis` |
| Pflichten | `schwellen_check`, `sonderkuendigungsschutz_check`, `bem_pflicht`, `sofortmeldepflicht` |
| Schreiben | `kuendigungsschreiben`, `abmahnung`, `kuendigung_pflichtangaben`, `arbeitszeugnis`, `stellenanzeige_check`, `interviewfragen_check`, `mitarbeitergespraech_leitfaden`, `nachweis_pflichtangaben` |
| Verträge | `vertragsbausteine_suchen`, `vertragsbaustein` (126 Bausteine mit Text), `klausel_pruefen` |
| Rechtsstand | `rechtswert`, `rechtswerte_suchen`, `rechtsaenderungen` |
| Merken | `frist_merken` (Kalendereintrag und Link zur Mail-Erinnerung, nichts bei uns gespeichert) |

Jede Antwort hat dieselbe Form: `ergebnis`, `rechenweg`, `quellen` (Norm, amtlicher Link, Prüfdatum, Status), `fallen`,
`naechster_schritt`, `hinweis`, `stand`, `herausgeber`. Bei Vertrag, Kündigung und Abmahnung steht immer ein Satz, dass vor dem
Versand ein Mensch prüfen sollte.

## Daten und Datenschutz

- Keine Anmeldung, keine Datenbank, keine KI auf unserer Seite. Die Werkzeuge rechnen nur.
- Die Werkzeuge haben keine Felder für Namen. Eingaben werden nicht gespeichert und nicht geloggt.
- Gezählt werden nur Aufrufe je Werkzeug und Tag mit groben Bändern (Firmengröße 1, 2 bis 4, 5 bis 9, 10+; Beschäftigungsart; Bundesland; Art des Ablaufs).
- Datenschutzerklärung (Privacy Policy): https://lintelly.com/datenschutz#lintelly-hr
- Kontakt und Support: hello@lintelly.com

## Woher die Zahlen kommen

`packages/kern` ist eine wörtliche Kopie der Rechtswerte und Rechner aus der Lintelly-Werkbank und von lintelly.com/tools
(`scripts/abgleich.mjs`), mit deren Tests. Jeder Rechtswert hat Norm, amtliche Fundstelle und Prüfdatum. Die Werte werden jeden Monat
gegen den amtlichen Wortlaut geprüft; ist eine Prüfung überfällig, steht das in der Antwort.

## Entwickeln

```bash
npm ci
npm run check
npm run build
node packages/mcp/dist/lintelly-hr-mcp-server.mjs --http
```

Aufbau: `packages/kern` (Werte, Rechner, Abläufe), `packages/mcp` (Server, Werkzeuge, Prompts, Ressourcen), `plugins/claude` (Plugin mit Skills), `plugins/agent` (Agent Plugins für Kiro), `plugins/cursor` (Cursor-Plugin),
`ops` (Betrieb auf hr.lintelly.com), `server.json` (MCP Registry), `Dockerfile`. Mitmachen: `CONTRIBUTING.md`.

## Lizenz

Code MIT (`LICENSE`), Inhalte CC BY 4.0 (`LICENSE-INHALTE.md`), Rechtswerte frei. Name und Logo „Lintelly“: `TRADEMARK.md`.
Herausgeber: Lintelly, lintelly.com. Lintelly begleitet Firmen ab 10 Beschäftigten als Personalabteilung: https://lintelly.com/hr

---

## English

**Lintelly HR Deutschland** is an open MCP server for German employment law only. It works like an HR department for small companies in Germany: notice periods, employer
costs, sick pay, maternity protection, dismissals, references, contract clauses and HR workflows, each figure with calculation and
official source. No sign-in, no account, nothing stored. Connect `https://hr.lintelly.com/mcp` (Streamable HTTP) or run
`npx -y @lintelly/hr-deutschland` (stdio). Gemini CLI: `gemini extensions install https://github.com/Lintelly/lintelly-hr-deutschland`. Answers are in the language of the question. General information, not legal advice for an
individual case. Code MIT, content CC BY 4.0, name and logo reserved (`TRADEMARK.md`).
