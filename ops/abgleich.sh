#!/bin/bash
# Täglicher Abgleich (seit 29.10.2026, Nick: „ab sofort immer automatisch“; vorher monatlich, Plan Abschnitt 7): holt Werkbank und
# lintelly.com, zieht geänderte Rechtswerte, Rechner und Abläufe mit scripts/abgleich.mjs in packages/kern (die Kopierliste steht dort,
# neue Dateien und Ordner kommen von selbst mit), setzt die nächste Patch-Version und eine Zeile im CHANGELOG.
# Sind npm ci, npm run check und npm run build grün, wird jede Kern-Änderung automatisch gemergt; die Release-Pipeline
# veröffentlicht, hr.lintelly.com zieht in 10 Minuten nach. Telegram: eine Zeile je Merge.
# Rot: der Pull Request bleibt offen, Nick bekommt eine Meldung (nicht jeden Tag neu, nur wenn sich der Stand ändert).
# Es gibt immer höchstens einen Abgleich-PR (Zweig „abgleich“): ein offener PR vom Vortag wird mit dem neuen Stand überschrieben,
# die Version zählt immer von main aus, so kollidieren keine Versionsnummern. Ohne Änderung: still, ein überholter PR wird geschlossen.
# cron auf ops-01: täglich 05:10. Probelauf ohne Push, PR, Merge und Telegram: abgleich.sh --probe
# Freigabe: _kanon/freigaben.md „Lintelly HR“.
set -uo pipefail
D=$HOME/lintelly-hr
Q=$D/quellen
R=$D/repo
ZWEIG=abgleich
MELDUNG=$D/abgleich.meldung
PRUEFLOG=$D/abgleich-pruefung.log
PROBE=nein; [ "${1:-}" = --probe ] && PROBE=ja
. "$HOME/n8n/telegram.env"
melde() {
  [ "$PROBE" = ja ] && { echo "Telegram (Probe, nicht gesendet): $1"; return 0; }
  curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d chat_id="$TELEGRAM_CHAT_ID" --data-urlencode text="$1" >/dev/null || true
}
# Dieselbe Störung nur einmal melden, bis ein Lauf durchgeht.
melde_einmal() {
  [ "$(cat "$MELDUNG" 2>/dev/null)" = "$1" ] && { echo "schon gemeldet: $1"; return 0; }
  [ "$PROBE" = ja ] || echo "$1" > "$MELDUNG"
  melde "$2"
}
fehler() { melde_einmal "fehler $1" "Nick, Lintelly HR Abgleich: $1 (Log ~/logs/lintelly-hr-abgleich.log auf ops-01)"; exit 1; }
echo "== $(date '+%F %T') Abgleich, Probe: $PROBE"

holen() {
  [ -d "$2/.git" ] || git clone -q "$1" "$2" || return 1
  # -f und clean: Reste eines abgebrochenen Laufs dürfen den nächsten nicht blockieren.
  git -C "$2" fetch -q origin main && git -C "$2" checkout -q -f main && git -C "$2" reset -q --hard origin/main && git -C "$2" clean -fdq
}
mkdir -p "$Q"
holen https://github.com/Lintelly/lintelly-werkbank.git "$Q/werkbank" || fehler "Werkbank nicht geholt"
holen https://github.com/NicksAdvisory/lintelly-web.git "$Q/website" || fehler "Website nicht geholt"
holen https://github.com/Lintelly/lintelly-hr-deutschland.git "$R" || fehler "lintelly-hr nicht geholt"
cd "$R" || exit 1
export WERKBANK="$Q/werkbank" WEBSITE="$Q/website"

node scripts/abgleich.mjs > /dev/null || fehler "abgleich.mjs gescheitert (fehlt eine Datei der Kopierliste in Werkbank oder Website?)"
# -uall: neue Dateien einzeln, auch in neuen Ordnern.
geaendert=$(git status --porcelain -uall -- packages/kern | cut -c4-)
offen=$(gh pr list --head "$ZWEIG" --state open --json url --jq '.[0].url // ""' 2>/dev/null)
if [ -z "$geaendert" ]; then
  echo "Kern ist auf dem Stand von Werkbank und lintelly.com, nichts zu tun."
  if [ -n "$offen" ] && [ "$PROBE" = nein ]; then
    gh pr close "$offen" --delete-branch -c "Der Kern auf main ist inzwischen auf dem Stand, dieser Abgleich ist überholt." > /dev/null && echo "überholten PR geschlossen: $offen"
  fi
  [ "$PROBE" = ja ] || rm -f "$MELDUNG"
  exit 0
fi

alt=$(node -p "require('./packages/mcp/package.json').version")
neu=$(echo "$alt" | awk -F. '{print $1"."$2"."$3+1}')
node scripts/version.mjs "$neu" > /dev/null || fehler "Version $neu nicht gesetzt"
anzahl=$(echo "$geaendert" | wc -l | tr -d ' ')
dateien=$(echo "$geaendert" | sed 's#packages/kern/##' | tr '\n' ' ' | sed 's/ $//')
node -e 'const fs=require("fs");const p="CHANGELOG.md";fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace(/\n- \n/,`\n- Abgleich mit Werkbank und lintelly.com: ${process.argv[1]}\n`))' "$dateien"
echo "Version $alt -> $neu, $anzahl Dateien: $dateien"

{ npm ci && npm run check && npm run build; } > "$PRUEFLOG" 2>&1 && gruen=ja || gruen=nein
echo "npm ci, check, build grün: $gruen (Ausgabe: $PRUEFLOG)"
[ "$PROBE" = ja ] && { echo "Probe: kein Commit, kein PR, kein Merge."; git checkout -q -f main; git clean -fdq; exit 0; }

git checkout -q -B "$ZWEIG"
git add -A packages/kern && git add -u
git -c user.name="Nick Schäfer" -c user.email="nick@nicksadvisory.com" commit -q -m "Abgleich $(date +%d.%m.%Y): $dateien" || fehler "Commit gescheitert"
stand=$(git rev-parse HEAD^{tree})
git push -q -f -u origin "$ZWEIG" || fehler "Push gescheitert"
titel="Abgleich $(date +%d.%m.%Y): Version $neu"
text="Täglicher Abgleich mit Werkbank und lintelly.com (ops/abgleich.sh). Geändert ($anzahl): $dateien. npm ci, check und build grün: $gruen."
if [ -n "$offen" ]; then
  gh pr edit "$offen" --title "$titel" --body "$text" > /dev/null; url=$offen
else
  url=$(gh pr create --head "$ZWEIG" --base main --title "$titel" --body "$text" 2>/dev/null || gh pr view "$ZWEIG" --json url --jq .url)
fi
[ -n "$url" ] || fehler "Pull Request nicht angelegt"

if [ "$gruen" = ja ]; then
  if gh pr merge "$url" --squash --delete-branch > /dev/null; then
    rm -f "$MELDUNG"
    melde "Lintelly HR Abgleich: $anzahl Dateien aus Werkbank/lintelly.com übernommen, Tests grün, gemergt, Version $neu ist in etwa 15 Minuten live. $url"
  else
    melde_einmal "merge $stand" "Nick, Lintelly HR Abgleich: Tests grün, aber Merge gescheitert, bitte prüfen: $url"
  fi
else
  melde_einmal "rot $stand" "Nick, Lintelly HR Abgleich: Tests oder Bau rot, nicht gemergt. Der PR bleibt offen und wird täglich neu gebaut: $url (Ausgabe auf ops-01: $PRUEFLOG)"
fi
