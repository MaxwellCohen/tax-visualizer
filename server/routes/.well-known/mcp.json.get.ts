import { defineHandler } from "nitro";
import { SITE_NAME } from "~/lib/site/meta";

export default defineHandler((event) => ({
  name: SITE_NAME,
  description:
    "Educational US federal + state income tax and payroll tax estimates (annual USD). Not tax advice.",
  endpoint: new URL("/mcp", event.url.origin).toString(),
  transport: "streamable-http",
  authentication: { type: "none" },
}));
