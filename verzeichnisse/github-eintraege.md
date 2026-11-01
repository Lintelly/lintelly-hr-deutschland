# GitHub-Einträge Lintelly HR Deutschland (Stand 23.10.2026)

Vorher geprüft: keine früheren PRs, Issues oder Forks zu Lintelly HR unter NicksAdvisory. Alle Einträge englisch, "German employment law only", Adresse https://hr.lintelly.com/mcp, keine Anmeldung, MIT, keine Preise.

| Nr | Verzeichnis | Ergebnis | Was Nick noch tun muss |
|---|---|---|---|
| 7 | Docker MCP Catalog | PR https://github.com/docker/mcp-registry/pull/6032 (servers/lintelly-hr-deutschland: server.yaml, tools.json `[]`, readme.md, Kategorie productivity, Icon 400 px) | Nichts. CI startet erst nach Freigabe durch Docker (Erstbeitrag). `task validate` lief lokal nicht (kein Go), Dateien entsprechen der Ausgabe von `task remote-wizard`. Bei Rückfragen im PR antworten. |
| 31 | ToolSDK | PR https://github.com/toolsdk-ai/toolsdk-mcp-registry/pull/1006 (packages/other-tools-and-integrations/lintelly-hr-deutschland.json, remote) | Nichts. Prüfungen grün, lokaler Validator ohne Fehler. Die Anleitung bittet um einen Stern für das Repo; nicht gemacht, freiwillig: `gh api --method PUT /user/starred/toolsdk-ai/toolsdk-mcp-registry`. |
| 39 | Build with Claude | PR https://github.com/davepoon/buildwithclaude/pull/530 (Plugin plugins/lintelly-hr-deutschland: .mcp.json, 5 Skills, /hr-woche, README, LICENSE, Eintrag in marketplace.json, Kategorie mcp-servers) | Nichts. `npm run validate` grün. Achtung: die Kopie dort aktualisiert sich nicht von selbst; bei neuer Plugin-Version neuer PR. Der MCP-Bereich der Seite kommt aus dem Docker-Katalog (Nr. 7). |
| 38 | aitmpl (claude-code-templates) | PR https://github.com/davila7/claude-code-templates/pull/1260 (cli-tool/components/mcps/productivity/lintelly-hr-deutschland.json, type http) | Nichts. Alle Prüfungen grün, Label review-pending. |
| 40 | awesome-claude-code-plugins | PR https://github.com/ccplugins/awesome-claude-code-plugins/pull/813 (eine Zeile unter "Security, Compliance, & Legal", Link auf plugins/claude, Marktplatz- und Install-Befehl) | Nichts. Repo wird selten gepflegt, Aufnahme kann dauern. |
| 41 | awesome-claude-plugins (Composio) | PR https://github.com/composio-community/awesome-claude-plugins/pull/613 (eine Zeile unter "Integrations") | Nichts. Letzter Push dort im Juli, Aufnahme unsicher. |
| 42 | awesome-mcp-servers (punkpeye) | PR https://github.com/punkpeye/awesome-mcp-servers/pull/17397 (Kategorie Legal, alphabetisch, 📇 ☁️ 🏠) | Ja: Der Bot hat "missing-glama" gesetzt. Ohne Glama-Eintrag mit Score-Badge wird der PR kaum gemergt. Nick: Server auf https://glama.ai/mcp/servers einreichen (Glama-Login nötig, deshalb nicht gemacht), Prüfungen bestehen lassen, dann im PR die Zeile um `[![Lintelly/lintelly-hr-deutschland MCP server](https://glama.ai/mcp/servers/Lintelly/lintelly-hr-deutschland/badges/score.svg)](https://glama.ai/mcp/servers/Lintelly/lintelly-hr-deutschland)` direkt hinter dem Link ergänzen. Derselbe Glama-Eintrag öffnet auch Nr. 43 (awesome-remote-mcp-servers). Die Anleitung bietet Agenten-PRs mit 🤖🤖🤖 im Titel einen schnelleren Weg an; nicht genutzt. |
| 17 | Cline MCP Marketplace | Issue https://github.com/cline/mcp-marketplace/issues/3223 (Vorlage, Logo 400x400 per raw-Link) | Optional: einmal in Cline nur mit dem README einrichten lassen und dann im Issue den ersten Haken setzen; ich habe ihn ehrlich offen gelassen. Label "server-submission" gibt es im Repo nicht mehr. |
| 5 | GitHub MCP Registry (github.com/mcp) | Nicht gestellt. Es gibt kein offizielles Formular. Der gelebte Weg: ein Kommentar in der Discussion https://github.com/github/github-mcp-server/discussions/1257. Ein GitHub-Mitarbeiter (trent-j, Mai 2026) bestätigt dort nur, dass neue Server von Hand kuratiert werden und danach Versionen aus dem offiziellen Registry nachziehen. Hunderte Anfragen stehen dort, viele ohne Antwort. Stand: com.lintelly/hr-deutschland 0.2.0 ist im offiziellen Registry `active` und `isLatest`, bei GitHub (api.mcp.github.com) noch nicht gelistet. | Nick entscheidet, ob er den Kommentar unten in #1257 postet (oder mich posten lässt). Danach folgt VS Code (Nr. 6) automatisch. |
| 9 | Gemini CLI | Erledigt im eigenen Repo: Commit af00aab "Gemini CLI: Erweiterung mit gemini-extension.json" (gemini-extension.json im Wurzelverzeichnis, mcpServers mit httpUrl, README-Abschnitt "Gemini CLI"), gepusht. Topics `gemini-cli-extension` und `mcp-server` gesetzt. Version blieb 0.2.0. | Nichts. geminicli.com/extensions crawlt täglich; in ein bis zwei Tagen prüfen, ob der Eintrag erscheint. Bei der nächsten Version die Versionsnummer in gemini-extension.json mitziehen. |

## Vorschlag Kommentar für github/github-mcp-server Discussion #1257

```
### Onboarding request: `com.lintelly/hr-deutschland` (Lintelly HR Deutschland)

Requesting initial onboarding to github.com/mcp. Values read from the registry on 2026-10-23.

| Field | Value |
| --- | --- |
| Registry name | [`com.lintelly/hr-deutschland`](https://registry.modelcontextprotocol.io/v0.1/servers?search=com.lintelly) |
| Version | `0.2.0`, `active`, `isLatest: true` |
| Remote | streamable HTTP, `https://hr.lintelly.com/mcp`, no auth |
| Package | npm `@lintelly/hr-deutschland` (stdio), OCI `ghcr.io/lintelly/lintelly-hr-deutschland` |
| Repository | https://github.com/Lintelly/lintelly-hr-deutschland |
| License | MIT (code), content CC BY 4.0 |
| What it does | German employment law only: answers the HR questions of small companies in Germany (notice periods, employer costs, sick pay, maternity protection, contract clauses), each with calculation and official source. 38 read-only tools. |
| Website | https://lintelly.com/hr |

Verify: `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=com.lintelly"`
```
