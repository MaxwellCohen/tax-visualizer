import { createMemo } from "solid-js";
import { incomeKindSelectOptions } from "~/components/tax/inputForm/shared";
import type { TaxFormIncomeRow } from "~/lib/tax/form/types";
import { useTaxInputForm } from "~/components/tax/inputForm/context/TaxInputFormContext";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { useStableTypedRowIds } from "~/components/tax/inputForm/hooks/useStableTypedRowIds";
import {
  incomeSectionUi,
  LineItemsAccordionFromConfig,
} from "~/components/tax/inputForm/sections/LineItemsAccordionFromConfig";

export function IncomeSection() {
  const { taxInput, setTaxInput, taxData, filingStatus, validationCtx, rowActions } = useTaxInputForm();
  const incomeRowIds = useStableTypedRowIds(taxInput, "income");

  const incomeTotal = createMemo(() =>
    taxInput()
      .rows.filter((r): r is TaxFormIncomeRow => r.type === "income")
      .reduce((sum, s) => {
        const n = s.amount;
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
  );

  const configItems = useConfigItemsForSection(taxData, filingStatus, "income");

  const isMarriedJoint = createMemo(() => filingStatus() === "marriedJoint");

  const kindOptions = createMemo(() => incomeKindSelectOptions(configItems(), isMarriedJoint()));

  return (
    <LineItemsAccordionFromConfig
      ui={incomeSectionUi}
      summaryAmount={incomeTotal}
      taxInput={taxInput}
      setTaxInput={setTaxInput}
      taxData={taxData}
      validationCtx={validationCtx}
      onAdd={rowActions.addSource}
      rowIds={incomeRowIds}
      removeAt={rowActions.removeSourceAt}
      kindOptions={kindOptions}
    />
  );
}
