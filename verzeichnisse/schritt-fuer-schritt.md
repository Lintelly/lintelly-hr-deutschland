# Lintelly HR Deutschland: was Nick selbst erledigt (Stand 23.10.2026)

Alle Texte zum Kopieren stehen in `verzeichnisse/stammdaten.yml`, Logos daneben (`lintelly-hr-icon-512.png`).
Reihenfolge nach Nutzen. Ein Schritt nach dem anderen, Claude macht danach weiter, wo es "dann Claude" heißt.

## Schon erledigt (nichts zu tun)

| Verzeichnis | Stand |
|---|---|
| MCP Registry, npm, Docker | live, 0.2.0 |
| MCP Market, mcpservers.org, mcp.directory, SaaSHub, ki-suche.io | eingereicht, Prüfung läuft |
| Kiro | eingereicht (Paket `plugins/agent`) |
| Cursor Marketplace | eingereicht (Paket `plugins/cursor`), Antwort an hello@lintelly.com |
| Docker, ToolSDK, Build with Claude, aitmpl, zwei Plugin-Listen, awesome-mcp-servers, Cline | PRs und Issue, siehe `github-eintraege.md` |
| Gemini CLI | Erweiterung im Repo, erscheint von selbst |
| ai-toolfinder.com | Lintelly-Profil um den MCP-Server ergänzt |

## 1. finde.tools (1 Minute)

Formular ist im Browser-Fenster von Claude schon ausgefüllt (Tab finde.tools). Falls nicht: https://finde.tools/tool-eintragen
1. Haken bei "Bestätige, dass du ein Mensch bist" setzen.
2. "Tool einreichen" klicken.

Einreichen ist kostenlos und unverbindlich. Der Eintrag kostet nach der Prüfung einmalig 10 €. Ob du zahlst, entscheidest du, wenn ihre Mail kommt.

## 2. xAI / Grok (2 Minuten)

Formular ist im Browser-Fenster schon ausgefüllt (Tab x.ai). Falls nicht: https://x.ai/bot/marketplace/submit-a-plugin
1. Optional zuerst testen: in Grok die Adresse https://hr.lintelly.com/mcp als MCP-Server eintragen und eine Frage stellen, z. B. "Wie lang ist die Kündigungsfrist bei 6 Jahren Betriebszugehörigkeit?"
2. Den Haken "I've tested this plugin locally and in-app" setzen. Den habe ich offen gelassen, weil nur du das bestätigen kannst.
3. "Submit Plugin" klicken.

## 3. Glama (5 Minuten, öffnet zwei weitere Listen)

1. https://glama.ai/mcp/servers öffnen, mit GitHub anmelden.
2. "Add Server", Repo `Lintelly/lintelly-hr-deutschland` wählen.
3. Claude sagen "Glama ist drin". Dann Claude: Badge in den PR bei awesome-mcp-servers (https://github.com/punkpeye/awesome-mcp-servers/pull/17397) und Eintrag bei awesome-remote-mcp-servers.

## 4. Anthropic Connectors Directory (10 Minuten, wichtigster Eintrag)

1. https://claude.ai/directory/manage öffnen und mit deinem Claude-Konto anmelden. Kommt dort kein Einreichen-Knopf, ist das Formular aus der FAQ der Weg: https://support.claude.com/en/articles/11596036-anthropic-connectors-directory-faq
2. Felder:
   - Name: Lintelly HR Deutschland
   - Server-URL: https://hr.lintelly.com/mcp (Streamable HTTP, keine Anmeldung, kein OAuth)
   - Beschreibung: `en.kurz_200` und `en.lang` aus `stammdaten.yml`
   - Datenschutz: https://lintelly.com/datenschutz#lintelly-hr
   - Doku: https://lintelly.com/hr, Support: hello@lintelly.com
   - Logo: `verzeichnisse/lintelly-hr-icon-512.png`
   - Beispiel-Prompts: `en.beispiele` aus `stammdaten.yml`
   - Test-Konto: keins nötig, der Server ist offen
3. Die Pflichten sind erfüllt: jedes Werkzeug hat Titel und readOnlyHint, Transport ist Streamable HTTP, Datenschutzerklärung ist verlinkt.

## 4b. Anthropic Plugin-Verzeichnis (5 Minuten, gleiche Seite)

Damit erscheint das Plugin in Claude Code unter `/plugin` für alle, ohne dass jemand die GitHub-Adresse kennen muss.
Heute geht es schon per Hand: `/plugin marketplace add Lintelly/lintelly-hr-deutschland`, dann `/plugin install lintelly-hr-deutschland@lintelly`.

1. https://claude.ai/directory/manage öffnen, "Plugin bundle" wählen.
2. Felder:
   - Name: Lintelly HR Deutschland (Slug `lintelly-hr-deutschland`, danach nicht mehr änderbar)
   - GitHub-Repo: https://github.com/Lintelly/lintelly-hr-deutschland (öffentlich), Branch `main`, Plugin-Ordner `plugins/claude`
   - Kurzbeschreibung (100 Zeichen): `en.kurz_100`
   - Beschreibung (200 Zeichen): `en.kurz_200`
   - Langbeschreibung (2000 Zeichen): `en.lang` (1.710 Zeichen)
   - Kategorie: Business; Stichwörter aus `stichwoerter`
   - Logo: `verzeichnisse/lintelly-hr-icon-400.png` (oder 512)
   - Datenschutz, Nutzungsbedingungen, Doku und Support liest das Portal aus `plugin.json` (lintelly.com/hr/doku, /hr/nutzungsbedingungen, Support hello@lintelly.com)
   - Beispiel-Prompts: `en.beispiele`
3. Was im Plugin steckt (falls gefragt): 5 Skills (HR-Sprechstunde, Ersteinstellung, Krankmeldung, Kündigung vorbereiten, Monatsende), Befehl `/hr-woche`, ein MCP-Server (hr.lintelly.com/mcp, ohne Anmeldung). Keine Hooks, keine Skripte auf dem Rechner der Nutzer.
4. Prüfung durch Anthropic (Sicherheits-Scan, dann ein Mensch). Danach kommen Updates von selbst aus GitHub, sobald `version` in `plugins/claude/.claude-plugin/plugin.json` steigt (macht das Versionsskript).
5. Claude sagen "Plugin eingereicht", dann trägt Claude es in `stand.csv` ein.

## 5. GitHub MCP Registry (eine Entscheidung)

Es gibt nur einen Weg: ein Kommentar in https://github.com/github/github-mcp-server/discussions/1257. Der Text liegt fertig in `github-eintraege.md`.
Sag "poste den GitHub-Kommentar", dann postet Claude ihn unter deinem Konto. Danach zieht VS Code nach.

## 6. Mit Konto, wenn du Zeit hast

| Verzeichnis | Link | Was |
|---|---|---|
| OpenAI Apps (ChatGPT) | https://platform.openai.com/apps-manage | verifizierte Organisation nötig, dann Domain hr.lintelly.com per DNS-Eintrag bestätigen (Claude setzt den DNS-Eintrag, wenn du den Code schickst) |
| Product Hunt | https://www.producthunt.com/posts/new | Launch-Tag planen, Texte aus `stammdaten.yml` |
| AlternativeTo | https://alternativeto.net/manage-item/ | Konto, Eintrag als Alternative zu Personio für kleine Firmen |
| DevHunt | https://devhunt.org | mit GitHub anmelden, Tool einreichen |
| Postman MCP Network | https://www.postman.com/explore/mcp-servers | Konto, Remote-Server eintragen |
| KI-Tool24 | https://ki-tool24.de | Formular hat eine Bot-Prüfung, nur du kannst es abschicken |
| Cline (optional) | https://github.com/cline/mcp-marketplace/issues/3223 | nach einem Test in Cline den ersten Haken im Issue setzen |

## 7. npm Trusted Publishing (bis 15.12.2026)

1. https://www.npmjs.com/package/@lintelly/hr-deutschland/access öffnen.
2. "Trusted Publisher" → GitHub Actions, Repo `Lintelly/lintelly-hr-deutschland`, Workflow `release.yml`.
3. Claude sagen "Trusted Publishing ist an". Dann Claude: Token-Zeile aus der Pipeline nehmen, Secret NPM_TOKEN löschen. Danach kann der Token, der im Januar 2027 ausläuft, einfach auslaufen.
