import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import llmsTxt from "../../../../public/llms.txt?raw";
import { createMcpServer } from "./createMcpServer";

async function connect(origin?: string) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createMcpServer({ llmsTxt, origin }).connect(serverTransport);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

const ca90k = { year: 2026, filingStatus: "single", state: "CA", lineItems: { wages: 90000 } };

describe("createMcpServer", () => {
  it("lists tools and resources", async () => {
    const client = await connect();
    const tools = (await client.listTools()).tools;
    expect(tools.map((t) => t.name).sort()).toEqual([
      "calculate_taxes",
      "compare_scenarios",
      "estimate_withholding",
      "get_tax_brackets",
      "list_supported_options",
    ]);
    for (const t of tools) expect(t.annotations).toMatchObject({ readOnlyHint: true, openWorldHint: false });
    const uris = (await client.listResources()).resources.map((r) => r.uri).sort();
    expect(uris).toEqual(["taxviz://glossary", "taxviz://llms-full"]);
  });

  it("calculates the $90k CA single 2026 case with an absolute share URL", async () => {
    const client = await connect("https://example.com");
    const res = await client.callTool({ name: "calculate_taxes", arguments: ca90k });
    expect(res.isError).toBeFalsy();
    const s = res.structuredContent as { federalIncomeTax: number; stateIncomeTax: number; shareUrl: string };
    expect(s.federalIncomeTax).toBe(10970);
    expect(s.stateIncomeTax).toBeCloseTo(4140.42, 1);
    expect(s.shareUrl).toMatch(/^https:\/\/example\.com\//);
  });

  it("returns isError with validation messages for invalid input", async () => {
    const client = await connect();
    const res = await client.callTool({ name: "calculate_taxes", arguments: { ...ca90k, year: 1999 } });
    expect(res.isError).toBe(true);
    expect(JSON.stringify(res.content)).toContain("year must be one of");
  });

  it("compares scenarios with b minus a deltas", async () => {
    const client = await connect();
    const a = await client.callTool({ name: "calculate_taxes", arguments: ca90k });
    const res = await client.callTool({
      name: "compare_scenarios",
      arguments: { a: ca90k, b: { ...ca90k, state: "none" } },
    });
    const sa = a.structuredContent as { totalTax: number; stateIncomeTax: number };
    const out = res.structuredContent as {
      delta: { totalTax: { a: number; b: number; delta: number }; stateIncomeTax: { delta: number } };
    };
    expect(out.delta.totalTax.a).toBe(sa.totalTax);
    expect(out.delta.stateIncomeTax.delta).toBeCloseTo(-sa.stateIncomeTax, 2);
    expect(out.delta.totalTax.delta).toBeCloseTo(out.delta.totalTax.b - out.delta.totalTax.a, 2);
  });

  it("returns brackets, options, and withholding", async () => {
    const client = await connect();
    const fed = await client.callTool({ name: "get_tax_brackets", arguments: { year: 2026 } });
    expect(fed.structuredContent).toHaveProperty("federalBrackets");
    const st = await client.callTool({ name: "get_tax_brackets", arguments: { year: 2026, state: "CA" } });
    expect(st.structuredContent).toMatchObject({ state: "CA" });
    const opts = await client.callTool({ name: "list_supported_options", arguments: {} });
    expect(opts.structuredContent).toHaveProperty("lineItems");
    const w = await client.callTool({
      name: "estimate_withholding",
      arguments: { ...ca90k, jobs: [{ payFrequency: "biweekly", federalWithheldPerPaycheck: 500 }] },
    });
    expect(w.isError).toBeFalsy();
    expect(w.structuredContent).toMatchObject({ annualFederalLiability: 10970, annualWithheld: 13000 });
  });

  it("reads resources", async () => {
    const client = await connect();
    const full = await client.readResource({ uri: "taxviz://llms-full" });
    expect(full.contents[0]).toMatchObject({ text: expect.stringContaining("Federal tax tables") });
    const gloss = await client.readResource({ uri: "taxviz://glossary" });
    expect(gloss.contents[0]).toMatchObject({ text: expect.stringContaining("# Glossary") });
  });
});
