import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";

export function TaxYearInvalid() {
  const years = getAvailableTaxYears();
  const range = years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : "a supported year";
  return (
    <p
      class="rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-text"
    >
      This year isn’t in the model. Choose {range} in Settings.
    </p>
  );
}
