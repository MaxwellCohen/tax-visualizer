import { createMemo, createSignal, Show, type Setter } from "solid-js";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { calculateTaxes, getOrdinaryFederalSegments, incomeSourcesToRows, type TaxFormData } from "~/lib/taxCalc";
import { getAvailableTaxYears } from "~/lib/taxData";
import { starterScenario } from "~/routes/taxHome/scenarioInit";
import { HomeTaxResults } from "./HomeTaxResults";

function withTaxYear(data: TaxFormData, year: number): TaxFormData {
  return {
    rows: data.rows.map(r =>
      r.type === "setting" && r.id === "taxYear" ? { ...r, value: year } : r,
    ),
  };
}

describe("HomeTaxResults", () => {
  it("calculateTaxes returns null for an unmodeled year", () => {
    expect(calculateTaxes(withTaxYear(starterScenario(2024), 2099))).toBeNull();
  });

  it("calculateTaxes includes federal segments for a modeled year", () => {
    const defaultYear = getAvailableTaxYears()[0] ?? 2024;
    const r = calculateTaxes(starterScenario(defaultYear));
    expect(r).not.toBeNull();
    expect(getOrdinaryFederalSegments(r!).length).toBeGreaterThan(0);
  });

  it("updates when taxResult goes from null to a value", async () => {
    const defaultYear = getAvailableTaxYears()[0] ?? 2024;

    let setTaxInput: Setter<TaxFormData>;

    render(() => {
      const [taxInput, setTi] = createSignal<TaxFormData>(withTaxYear(starterScenario(defaultYear), 2099));
      setTaxInput = setTi;
      const taxResult = createMemo(() => calculateTaxes(taxInput()));
      const baselineResult = createMemo(() => null);
      const isPlanningYear = createMemo(() => false);

      return (
        <HomeTaxResults
          taxResult={taxResult}
          baselineResult={baselineResult}
          isPlanningYear={isPlanningYear}
        />
      );
    });

    expect(screen.getByText(/Invalid tax year selected/i)).toBeInTheDocument();

    setTaxInput!(starterScenario(defaultYear));

    await waitFor(() => {
      expect(screen.queryByText(/Invalid tax year selected/i)).not.toBeInTheDocument();
    });
  });

  it("Show when={accessor()} is reactive (sanity check for compiler)", async () => {
    const defaultYear = getAvailableTaxYears()[0] ?? 2024;
    let setTaxInput: Setter<TaxFormData>;

    render(() => {
      const [taxInput, setTi] = createSignal<TaxFormData>(withTaxYear(starterScenario(defaultYear), 2099));
      setTaxInput = setTi;
      const taxResult = createMemo(() => calculateTaxes(taxInput()));

      return (
        <Show when={taxResult()} fallback={<p>invalid-year</p>}>
          <p>has-result</p>
        </Show>
      );
    });

    expect(screen.getByText("invalid-year")).toBeInTheDocument();
    setTaxInput!(starterScenario(defaultYear));
    await waitFor(() => {
      expect(screen.getByText("has-result")).toBeInTheDocument();
    });
  });
});
