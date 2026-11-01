// Eine Version überall, an allen Stellen, die scripts/version.mjs setzt: npm-Paket, server.json, Claude-, Agent- und Cursor-Plugin,
// Gemini-Erweiterung, beide Marktplätze, Changelog (Review 29.10.2026: vorher 3 von 8 geprüft).
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { VERSION } from "../src/server";

const W = path.resolve(import.meta.dirname, "../../..");
const json = (f: string) => JSON.parse(readFileSync(path.join(W, f), "utf8"));

it("Version gleich in Paket, server.json, allen Plugins, Gemini, beiden Marktplätzen und Changelog", () => {
  expect(json("packages/mcp/package.json").version).toBe(VERSION);
  expect(json("plugins/agent/plugin.json").version).toBe(VERSION);
  expect(json("plugins/cursor/.cursor-plugin/plugin.json").version).toBe(VERSION);
  expect(json(".cursor-plugin/marketplace.json").metadata.version).toBe(VERSION);
  expect(json("gemini-extension.json").version).toBe(VERSION);
  const s = json("server.json");
  expect(s.version).toBe(VERSION);
  // npm steht erst drin, wenn das Paket veröffentlicht ist (das Registry prüft es).
  for (const p of s.packages.filter((p: { registryType: string }) => p.registryType === "npm")) expect(p.version).toBe(VERSION);
  expect(s.packages.find((p: { registryType: string }) => p.registryType === "oci").identifier).toBe(`ghcr.io/lintelly/lintelly-hr-deutschland:${VERSION}`);
  expect(json("plugins/claude/.claude-plugin/plugin.json").version).toBe(VERSION);
  expect(json(".claude-plugin/marketplace.json").plugins[0].version).toBe(VERSION);
  expect(readFileSync(path.join(W, "CHANGELOG.md"), "utf8")).toContain(`## ${VERSION}`);
  expect(s.description.length).toBeLessThanOrEqual(100);
});
