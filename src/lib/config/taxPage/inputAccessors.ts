import type { TaxFormRow } from "~/lib/tax/form/types";
import { findScenarioAmountById } from "~/lib/tax/calc/scenarioMetrics";

export function findInputById(inputs: TaxFormRow[], id: string): number {
    return findScenarioAmountById(inputs, id);
}
