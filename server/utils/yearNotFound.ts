import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";

export function yearNotFound(year: string | undefined): Response {
  const years = getAvailableTaxYears();
  return Response.json(
    { error: `Unsupported year "${year}".`, errors: [`year must be one of ${years.join(", ")}.`] },
    { status: 404 },
  );
}
