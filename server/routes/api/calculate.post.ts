import { defineHandler } from "nitro";
import { calculateScenario } from "~/lib/tax/api/calculateScenario";

export default defineHandler(async (event) => {
  let body: unknown;
  try {
    body = await event.req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const result = calculateScenario(body);
  if (!result.ok) {
    return Response.json({ error: "Invalid scenario", errors: result.errors }, { status: 400 });
  }
  return result.value;
});
