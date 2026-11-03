// ausrollen.sh und health-ping.sh mit Attrappen für curl, sudo, sleep und flock (Prüfung 29.10.2026 Punkte 9 und 10).
// Kein Netz, kein Telegram: die curl-Attrappe schreibt jede Meldung nach $LOG/telegram.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const HIER = import.meta.dirname;

const CURL = `#!/bin/bash
url=""; aus=""; text=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o) aus=$2; shift ;;
    --data-urlencode) text=\${2#text=}; shift ;;
    -d|-H|-A|-X|--max-time) shift ;;
    http*) url=$1 ;;
  esac
  shift
done
aktuell=$(basename "$(readlink "$D/aktuell" 2>/dev/null)" 2>/dev/null)
case "$url" in
  *api.telegram.org*) echo "$text" >> "$LOG/telegram" ;;
  *releases/latest) echo "{\\"tag_name\\": \\"$STUB_LATEST\\"}" ;;
  *.sha256) [ "\${STUB_LADEN:-ok}" = ok ] || exit 22
    if [ "\${STUB_SHA:-ok}" = ok ]; then s=$(printf inhalt | sha256sum | cut -d' ' -f1); else s=0000000000000000000000000000000000000000000000000000000000000000; fi
    echo "$s  lintelly-hr-mcp-server.mjs" > "$aus" ;;
  *releases/download/*) [ "\${STUB_LADEN:-ok}" = ok ] || exit 22; printf inhalt > "$aus" ;;
  *127.0.0.1:3610/health) case " \${STUB_KAPUTT:-} " in *" \${aktuell:-keine} "*) exit 7 ;; esac; echo "{\\"ok\\":true,\\"version\\":\\"\${aktuell#v}\\"}" ;;
  *127.0.0.1:3610/mcp) [ "\${STUB_DIENST:-ok}" = ok ] || exit 28; case " \${STUB_KAPUTT:-} " in *" \${aktuell:-keine} "*) exit 7 ;; esac; echo '{"result":{"tools":[]}}' ;;
  *hr.lintelly.com/health) [ "\${STUB_AUSSEN:-ok}" = ok ] || exit 7; echo '{"ok":true}' ;;
  *) exit 6 ;;
esac
`;
const SUDO = `#!/bin/bash
echo "$*" >> "$LOG/sudo"
[ "\${STUB_SUDO:-ok}" = ok ]
`;

function umgebung() {
  const t = mkdtempSync(path.join(tmpdir(), "lhr-betrieb-"));
  const bin = path.join(t, "bin"), D = path.join(t, "lintelly-hr"), LOG = path.join(t, "log");
  for (const o of [bin, D, LOG]) mkdirSync(o, { recursive: true });
  const datei = (n, inhalt) => { writeFileSync(path.join(bin, n), inhalt); chmodSync(path.join(bin, n), 0o755); };
  datei("curl", CURL);
  datei("sudo", SUDO);
  datei("sleep", "#!/bin/bash\nexit 0\n");
  datei("flock", "#!/bin/bash\nexit 0\n");
  writeFileSync(path.join(t, "telegram.env"), "TELEGRAM_BOT_TOKEN=x\nTELEGRAM_CHAT_ID=1\n");
  const lauf = (skript, env = {}) => spawnSync("bash", [path.join(HIER, skript)], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, D, LOG, LINTELLY_HR_ORDNER: D, TELEGRAM_ENV: path.join(t, "telegram.env"), ...env },
  });
  const lies = (n) => (existsSync(path.join(LOG, n)) ? readFileSync(path.join(LOG, n), "utf8").trim().split("\n") : []);
  const mitFassung = (tag) => { mkdirSync(path.join(D, "releases", tag), { recursive: true }); symlinkSync(path.join(D, "releases", tag), path.join(D, "aktuell")); };
  return { D, lauf, lies, mitFassung, aktuell: () => path.basename(readlinkSync(path.join(D, "aktuell"))) };
}

test("ausrollen: neues Release geht live und wird einmal gemeldet", () => {
  const u = umgebung();
  u.mitFassung("v0.2.2");
  const r = u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.3" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(u.aktuell(), "v0.2.3");
  assert.deepEqual(u.lies("telegram"), ["Lintelly HR v0.2.3 ist live auf hr.lintelly.com (vorher v0.2.2)."]);
  assert.equal(u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.3" }).status, 0);
  assert.equal(u.lies("telegram").length, 1);
});

test("ausrollen: kaputtes Release springt zurück und wird danach übersprungen, bis ein neueres kommt", () => {
  const u = umgebung();
  u.mitFassung("v0.2.2");
  const env = { STUB_LATEST: "v0.2.3", STUB_KAPUTT: "v0.2.3" };
  assert.equal(u.lauf("ausrollen.sh", env).status, 1);
  assert.equal(u.aktuell(), "v0.2.2");
  assert.equal(u.lies("sudo").length, 2);
  assert.match(u.lies("telegram")[0], /v0\.2\.3: \/health oder tools\/list nicht grün, zurück auf v0\.2\.2\. v0\.2\.3 wird übersprungen/);
  for (let i = 0; i < 3; i++) assert.equal(u.lauf("ausrollen.sh", env).status, 0);
  assert.equal(u.lies("telegram").length, 1, "keine Wiederholung");
  assert.equal(u.lies("sudo").length, 2, "kein weiterer Neustart");
  assert.equal(u.lauf("ausrollen.sh", { ...env, STUB_LATEST: "v0.2.4" }).status, 0);
  assert.equal(u.aktuell(), "v0.2.4");
});

test("ausrollen: Neustart ohne sudo-Recht springt zurück, meldet einmal und versucht es weiter", () => {
  const u = umgebung();
  u.mitFassung("v0.2.2");
  const env = { STUB_LATEST: "v0.2.3", STUB_SUDO: "nein" };
  assert.equal(u.lauf("ausrollen.sh", env).status, 1);
  assert.equal(u.aktuell(), "v0.2.2");
  assert.equal(u.lauf("ausrollen.sh", env).status, 1);
  assert.equal(u.lies("sudo").length, 2, "jeder Lauf versucht es");
  assert.equal(u.lies("telegram").length, 1, "aber nur eine Meldung");
  assert.match(u.lies("telegram")[0], /sudo -n/);
  assert.equal(u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.3" }).status, 0);
  assert.equal(u.aktuell(), "v0.2.3");
});

test("ausrollen: falsche Prüfsumme wird gemerkt, Download-Fehler nur einmal gemeldet", () => {
  const u = umgebung();
  u.mitFassung("v0.2.2");
  assert.equal(u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.3", STUB_SHA: "falsch" }).status, 1);
  assert.equal(u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.3" }).status, 0);
  assert.equal(u.aktuell(), "v0.2.2");
  assert.equal(readFileSync(path.join(u.D, "gescheitert"), "utf8"), "v0.2.3\n");
  u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.4", STUB_LADEN: "nein" });
  u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.4", STUB_LADEN: "nein" });
  assert.equal(u.lies("telegram").length, 2);
  assert.equal(u.lies("sudo").length, 0);
});

test("ausrollen: nicht lesbares Release bleibt zweimal still, meldet beim dritten Mal einmal und setzt nach Erholung zurück", () => {
  const u = umgebung();
  u.mitFassung("v0.2.2");
  const leer = { STUB_LATEST: "" };
  for (let i = 0; i < 2; i++) assert.match(u.lauf("ausrollen.sh", leer).stderr, /nicht lesbar/);
  assert.equal(u.lies("telegram").length, 0);
  for (let i = 0; i < 3; i++) assert.equal(u.lauf("ausrollen.sh", leer).status, 0);
  assert.equal(u.lies("telegram").length, 1);
  assert.match(u.lies("telegram")[0], /seit 3 Läufen/);
  assert.equal(u.lauf("ausrollen.sh", { STUB_LATEST: "v0.2.2" }).status, 0);
  assert.ok(!existsSync(path.join(u.D, "ausrollen.fehllaeufe")));
  assert.ok(!existsSync(path.join(u.D, "ausrollen.meldung")));
  for (let i = 0; i < 3; i++) u.lauf("ausrollen.sh", leer);
  assert.equal(u.lies("telegram").length, 2);
});

test("health-ping: ein Aussetzer bleibt still, der zweite startet neu und meldet einmal, Erholung wird gemeldet", () => {
  const u = umgebung();
  const aus = { STUB_DIENST: "aus" };
  u.lauf("health-ping.sh", aus);
  assert.equal(u.lies("sudo").length, 0);
  u.lauf("health-ping.sh", aus);
  assert.deepEqual(u.lies("sudo"), ["-n systemctl restart lintelly-hr"]);
  assert.match(u.lies("telegram")[0], /hing.*neu gestartet/);
  u.lauf("health-ping.sh", aus);
  u.lauf("health-ping.sh", aus);
  assert.equal(u.lies("sudo").length, 2, "jeder zweite weitere Fehlschlag startet wieder neu");
  assert.equal(u.lies("telegram").length, 1);
  u.lauf("health-ping.sh");
  assert.match(u.lies("telegram")[1], /wieder erreichbar/);
  u.lauf("health-ping.sh");
  assert.equal(u.lies("telegram").length, 2);
});

test("health-ping: nur von außen weg, kein Neustart; alter Stand „ok“ zählt als 0", () => {
  const u = umgebung();
  writeFileSync(path.join(u.D, "health.stand"), "ok\n");
  u.lauf("health-ping.sh", { STUB_AUSSEN: "aus" });
  u.lauf("health-ping.sh", { STUB_AUSSEN: "aus" });
  assert.equal(u.lies("sudo").length, 0);
  assert.match(u.lies("telegram")[0], /von außen nicht erreichbar/);
  assert.equal(readFileSync(path.join(u.D, "health.stand"), "utf8"), "2\n");
});

test("Skripte sind gültiges bash", () => {
  for (const s of ["ausrollen.sh", "health-ping.sh", "abgleich.sh"]) execFileSync("bash", ["-n", path.join(HIER, s)]);
});
