/**
 * Streamable HTTP ohne Sitzung (wie /mcp der Werkbank): nur POST, Antworten als JSON. Dazu /health für die Überwachung und
 * /.well-known/openai-apps-challenge für den Domain-Nachweis bei OpenAI (Text aus OPENAI_APPS_CHALLENGE). Anfragen höchstens 32 KB.
 * Kein Log der Eingaben: Fehler werden nur als Art gezählt, nie mit Inhalt geschrieben.
 * Sammelanfragen (JSON-RPC-Batch, ein Array) lehnt der Dienst mit 400 ab: die MCP-Spezifikation kennt sie seit 2025-06-18 nicht
 * mehr, und ein Batch würde die Bremse mit bis zu 100 Aufrufen je Anfrage umgehen. Der User-Agent wird nur als grobes Band
 * (zaehler.ts) an die Zählung gegeben, nie gespeichert. Solange der Server lauscht, läuft der Wächter gegen Hänger (waechter.ts).
 */
import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { bremse as neueBremse, type Bremse } from "./bremse";
import { mcpServer, VERSION } from "./server";
import { waechter } from "./waechter";
import { WERKZEUGE } from "./werkzeuge";
import { clientBand, mitClient } from "./zaehler";

export const MAX_BYTES = 32 * 1024;
const LOKAL = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "content-type, accept, mcp-protocol-version, mcp-session-id, authorization",
  "access-control-expose-headers": "mcp-session-id",
};

function senden(res: ServerResponse, status: number, body: unknown, kopf: Record<string, string> = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "content-type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json", "cache-control": "no-store", ...CORS, ...kopf });
  res.end(text);
}

/** Hinter Caddy: die letzte Adresse in X-Forwarded-For hat Caddy selbst eingetragen. Direkt: die Adresse der Verbindung. */
function adresse(req: IncomingMessage): string {
  const fern = req.socket.remoteAddress ?? "";
  const xff = req.headers["x-forwarded-for"];
  if (!LOKAL.has(fern) || typeof xff !== "string") return fern;
  return xff.split(",").map((s) => s.trim()).filter(Boolean).at(-1) ?? fern;
}

function lesen(req: IncomingMessage): Promise<string | null> {
  return new Promise((ok, fehler) => {
    let n = 0;
    const teile: Buffer[] = [];
    // Zu große Anfragen zu Ende lesen, aber nichts davon behalten, damit die Antwort 413 noch ankommt.
    req.on("data", (c: Buffer) => {
      n += c.length;
      if (n <= MAX_BYTES) teile.push(c);
    });
    req.on("end", () => ok(n > MAX_BYTES ? null : Buffer.concat(teile).toString("utf8")));
    req.on("error", fehler);
  });
}

/** waechterMs: Hänger-Grenze in Millisekunden, 0 schaltet den Wächter ab. */
export function httpServer(o: { bremse?: Bremse; waechterMs?: number } = {}): HttpServer {
  const darf = o.bremse ?? neueBremse();
  const s = createServer(async (req, res) => {
    const pfad = (req.url ?? "/").split("?")[0];
    try {
      if (req.method === "OPTIONS") return senden(res, 204, "");
      if (pfad === "/health" && req.method === "GET") return senden(res, 200, { ok: true, name: "lintelly-hr-deutschland", version: VERSION, werkzeuge: WERKZEUGE.length });
      if (pfad === "/" && req.method === "GET") {
        return senden(res, 200, { name: "Lintelly HR", mcp: "https://hr.lintelly.com/mcp", doku: "https://lintelly.com/hr", quellcode: "https://github.com/Lintelly/lintelly-hr-deutschland", version: VERSION });
      }
      if (pfad === "/.well-known/openai-apps-challenge" && req.method === "GET") {
        const t = process.env.OPENAI_APPS_CHALLENGE;
        return t ? senden(res, 200, t) : senden(res, 404, { error: "not_found" });
      }
      if (pfad !== "/mcp") return senden(res, 404, { error: "not_found" });
      if (req.method !== "POST") return senden(res, 405, { error: "method_not_allowed" }, { allow: "POST" });
      if (!darf(adresse(req))) return senden(res, 429, { error: "too_many_requests" }, { "retry-after": "60" });
      const roh = await lesen(req);
      if (roh === null) return senden(res, 413, { error: "payload_too_large" });
      let body: unknown;
      try { body = JSON.parse(roh); } catch { return senden(res, 400, { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }); }
      if (Array.isArray(body)) return senden(res, 400, { jsonrpc: "2.0", error: { code: -32600, message: "Batch requests are not supported, send one JSON-RPC message per request." }, id: null });
      for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      const server = mcpServer();
      res.on("close", () => { void transport.close(); void server.close(); });
      await server.connect(transport);
      await mitClient(clientBand(req.headers["user-agent"]), () => transport.handleRequest(req, res, body));
    } catch (err) {
      // Nur die Art des Fehlers, nie die Anfrage.
      console.error("Fehler", err instanceof Error ? err.name : "unbekannt");
      if (!res.headersSent) senden(res, 500, { error: "internal_error" });
      else res.end();
    }
  });
  const grenze = o.waechterMs ?? 30_000;
  if (grenze > 0) {
    let stopp: (() => void) | undefined;
    s.on("listening", () => { stopp ??= waechter(grenze); });
    s.on("close", () => { stopp?.(); stopp = undefined; });
  }
  return s;
}
