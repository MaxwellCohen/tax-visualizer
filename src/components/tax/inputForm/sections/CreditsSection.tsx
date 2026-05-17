import { createMemo } from "solid-js";
import { rowsToTaxCalculationInputs } from "~/lib/tax/calc/inputs";
import type { TaxFormCreditRow } from "~/lib/tax/form/types";
import { sumLabeledAmountSources } from "~/lib/tax/calc/labeledAmountSource";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { itemizedDeductionSelectOptions } from "~/components/tax/inputForm/shared";
import { useStableTypedRowIds } from "~/components/tax/inputForm/hooks/useStableTypedRowIds";
import { childTaxCredit } from "~/lib/config/taxPage/rowMetrics";
import { useTaxInputForm } from "~/components/tax/inputForm/context/TaxInputFormContext";
import {
  creditsSectionUi,
  LineItemsAccordionFromConfig,
} from "~/components/tax/inputForm/sections/LineItemsAccordionFromConfig";

export function CreditsSection() {
  const { taxInput, setTaxInput, taxData, filingStatus, validationCtx, rowActions } = useTaxInputForm();
  const calc = createMemo(() => rowsToTaxCalculationInputs(taxInput().rows));
  const creditRows = createMemo(() =>
    taxInput().rows.filter((r): r is TaxFormCreditRow => r.type === "credit"),
  );
  const creditRowIds = useStableTypedRowIds(taxInput, "credit");

  const creditConfigItems = useConfigItemsForSection(taxData, filingStatus, "credit");
  const creditKindOptions = createMemo(() => itemizedDeductionSelectOptions("credit", creditConfigItems()));

  const creditsTotal = createMemo(() => {
    const td = taxData();
    const dependentCredits = td ? childTaxCredit(taxInput().rows, td) : 0;
    return dependentCredits + sumLabeledAmountSources(calc().federalTaxCredits);
  });

  const showClearAll = createMemo(() => creditRows().length > 0);

  return (
    <LineItemsAccordionFromConfig
      ui={creditsSectionUi}
      summaryAmount={creditsTotal}
      taxInput={taxInput}
      setTaxInput={setTaxInput}
      taxData={taxData}
      validationCtx={validationCtx}
      onAdd={rowActions.addFederalTaxCredit}
      onClearAll={rowActions.clearAllFederalTaxCredits}
      showClearAll={showClearAll}
      rowIds={creditRowIds}
      removeAt={rowActions.removeFederalTaxCreditAt}
      kindOptions={creditKindOptions}
      configItems={creditConfigItems}
    />
  );
}
