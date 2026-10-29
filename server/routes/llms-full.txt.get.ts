import { defineHandler } from "nitro";
import llmsTxt from "../../public/llms.txt?raw";
import { buildLlmsFullTxt } from "~/lib/tax/api/llmsFull";

const body = buildLlmsFullTxt(llmsTxt);

export default defineHandler(
  () => new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } }),
);
