import { defineHandler } from "nitro";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import llmsTxt from "../../public/llms.txt?raw";
import { createMcpServer } from "~/lib/tax/mcp/createMcpServer";

const methodNotAllowed = () =>
  Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null },
    { status: 405, headers: { Allow: "POST, OPTIONS" } },
  );

/** Stateless Streamable HTTP MCP endpoint: a fresh server + transport per request, JSON responses. */
export default defineHandler(async (event) => {
  if (event.req.method !== "POST") return methodNotAllowed();
  const server = createMcpServer({ llmsTxt, origin: event.url.origin });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(event.req);
});
