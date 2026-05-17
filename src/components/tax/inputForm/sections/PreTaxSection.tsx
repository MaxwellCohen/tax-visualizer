import { createMemo } from "solid-js";
import { pretaxBenefitKindSelectOptions } from "~/components/tax/inputForm/shared";
import type { TaxFormPretaxRow } from "~/lib/tax/form/types";
import { useTaxInputForm } from "~/components/tax/inputForm/context/TaxInputFormContext";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { useStableTypedRowIds } from "~/components/tax/inputForm/hooks/useStableTypedRowIds";
import {
  LineItemsAccordionFromConfig,
  preTaxSectionUi,
} from "~/components/tax/inputForm/sections/LineItemsAccordionFromConfig";

export function PreTaxSection() {
  const {
    taxInput,
    setTaxInput,
    preTaxBenefitsTotal,
    isMarriedJoint,
    taxData,
    filingStatus,
    validationCtx,
    rowActions,
  } = useTaxInputForm();
  const pretaxRowIds = useStableTypedRowIds(taxInput, "pretax");
  const pretaxRows = createMemo(() =>
    taxInput().rows.filter((r): r is TaxFormPretaxRow => r.type === "pretax"),
  );

  const configItems = useConfigItemsForSection(taxData, filingStatus, "pretax");
  const kindOptions = createMemo(() => pretaxBenefitKindSelectOptions(configItems(), isMarriedJoint()));

  const showClearAll = createMemo(() => pretaxRows().length > 0);

  return (
    <LineItemsAccordionFromConfig
      ui={preTaxSectionUi}
      summaryAmount={preTaxBenefitsTotal}
      taxInput={taxInput}
      setTaxInput={setTaxInput}
      taxData={taxData}
      validationCtx={validationCtx}
      onAdd={rowActions.addPretaxBenefit}
      onClearAll={rowActions.clearAllPretaxBenefits}
      showClearAll={showClearAll}
      rowIds={pretaxRowIds}
      removeAt={rowActions.removePretaxBenefitAt}
      kindOptions={kindOptions}
      configItems={configItems}
    />
  );
}
