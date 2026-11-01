#!/bin/bash
# Holt das neueste GitHub-Release von Lintelly/lintelly-hr-deutschland und rollt es auf hr.lintelly.com aus (cron alle 10 Minuten).
# Ablauf: Prüfsumme prüfen, neben die alte Fassung legen, umschalten, neu starten, /health und tools/list prüfen, sonst zurück.
# Meldung per Telegram bei Erfolg und Fehler. Freigabe: _kanon/freigaben.md, Zeile „Lintelly HR“.
# Seit 29.10.2026 (Prüfung Punkt 9): ein gescheitertes Release steht in $D/gescheitert und wird übersprungen, bis ein neueres
# erscheint (vorher: alle 10 Minuten neu ausgerollt, 20 s Ausfall und eine Meldung je Versuch). Scheitert der Neustart selbst
# (sudo -n), springt der Verweis zurück, der laufende Dienst bleibt unberührt, der nächste Lauf versucht es wieder.
# Dieselbe Störung meldet Telegram nur einmal ($D/ausrollen.meldung), bis ein Ausrollen klappt.
set -uo pipefail
D=${LINTELLY_HR_ORDNER:-$HOME/lintelly-hr}
REPO=Lintelly/lintelly-hr-deutschland
DATEI=lintelly-hr-mcp-server.mjs
GESCHEITERT=$D/gescheitert
MELDUNG=$D/ausrollen.meldung
. "${TELEGRAM_ENV:-$HOME/n8n/telegram.env}"
melde() { curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d chat_id="$TELEGRAM_CHAT_ID" --data-urlencode text="$1" >/dev/null || true; }
# melde_einmal <schlüssel> <text>: nur, wenn sich die Störung seit der letzten Meldung geändert hat.
melde_einmal() { [ "$(cat "$MELDUNG" 2>/dev/null)" = "$1" ] && return 0; echo "$1" > "$MELDUNG"; melde "$2"; }
# Dienst antwortet mit der erwarteten Version auf /health und liefert über MCP die Werkzeugliste.
gesund() {
  v=$(curl -sf --max-time 5 http://127.0.0.1:3610/health | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])' 2>/dev/null) || return 1
  [ "v$v" = "$1" ] || return 1
  curl -sf --max-time 5 -X POST http://127.0.0.1:3610/mcp -A lintelly-ausrollen -H 'content-type: application/json' \
    -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -q '"tools"'
}
neustart() { sudo -n systemctl restart lintelly-hr; }

mkdir -p "$D/releases" "$D/zaehler"
# Nie zwei Läufe zugleich, und health-ping.sh startet nicht dazwischen neu (gleiche Sperre).
exec 9>"$D/.sperre"
flock -n 9 || exit 0

tag=$(curl -sf --max-time 20 "https://api.github.com/repos/$REPO/releases/latest" | python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"])' 2>/dev/null)
[ -n "$tag" ] || exit 0
alt=$(basename "$(readlink "$D/aktuell" 2>/dev/null)" 2>/dev/null)
[ "$alt" = "$tag" ] && exit 0
grep -qxF "$tag" "$GESCHEITERT" 2>/dev/null && exit 0

neu="$D/releases/$tag"
mkdir -p "$neu"
basis="https://github.com/$REPO/releases/download/$tag"
if ! curl -sfL --max-time 120 "$basis/$DATEI" -o "$neu/$DATEI" || ! curl -sfL --max-time 20 "$basis/$DATEI.sha256" -o "$neu/$DATEI.sha256"; then
  rm -rf "$neu"
  melde_einmal "$tag laden" "Lintelly HR $tag: Download von GitHub gescheitert, nächster Versuch in 10 Minuten (Meldung nur einmal)."
  exit 1
fi
if ! (cd "$neu" && sha256sum -c "$DATEI.sha256" >/dev/null 2>&1); then
  rm -rf "$neu"
  echo "$tag" >> "$GESCHEITERT"
  melde "Lintelly HR $tag: Prüfsumme falsch, nicht ausgerollt. Übersprungen bis zum nächsten Release."
  exit 1
fi

ln -sfn "$neu" "$D/aktuell"
if ! neustart; then
  if [ -n "$alt" ] && [ -d "$D/releases/$alt" ]; then ln -sfn "$D/releases/$alt" "$D/aktuell"; else rm -f "$D/aktuell"; fi
  rm -rf "$neu"
  melde_einmal "$tag sudo" "Nick, Lintelly HR $tag nicht ausgerollt: Neustart ohne Passwort (sudo -n systemctl restart lintelly-hr) nicht erlaubt. Es läuft weiter ${alt:-keine Fassung}. Nächster Versuch alle 10 Minuten, diese Meldung nur einmal."
  exit 1
fi
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 2
  if gesund "$tag"; then
    rm -f "$MELDUNG"
    melde "Lintelly HR $tag ist live auf hr.lintelly.com (vorher ${alt:-keine})."
    ls -1dt "$D"/releases/* | tail -n +6 | xargs -r rm -rf
    exit 0
  fi
done

# Neue Fassung antwortet nicht: merken, damit sie nicht alle 10 Minuten wiederkommt, und zurück.
echo "$tag" >> "$GESCHEITERT"
rm -f "$MELDUNG"
if [ -n "$alt" ] && [ -d "$D/releases/$alt" ]; then
  ln -sfn "$D/releases/$alt" "$D/aktuell"
  rm -rf "$neu"
  neustart && ok="zurück auf $alt" || ok="Rücksprung auf $alt, aber Neustart gescheitert (sudo -n), bitte prüfen"
  melde "Nick, Lintelly HR $tag: /health oder tools/list nicht grün, $ok. $tag wird übersprungen, bis ein neueres Release kommt."
else
  melde "Nick, Lintelly HR $tag: /health oder tools/list nicht grün, keine alte Fassung zum Zurückspringen."
fi
exit 1
