import { defineHandler } from "nitro";
import { isCorsPath } from "~/lib/tax/api/cors";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

/** Open CORS for the public API, /openapi.json, /llms-full.txt, /mcp, and /.well-known/* (no credentials involved). */
export default defineHandler((event) => {
  if (!isCorsPath(event.url.pathname)) return;
  for (const [name, value] of Object.entries(CORS_HEADERS)) event.res.headers.set(name, value);
  if (event.req.method === "OPTIONS") return new Response(null, { status: 204, headers: event.res.headers });
});
