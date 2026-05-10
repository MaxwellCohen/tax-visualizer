import { createMemo, type Accessor, type Setter } from "solid-js";
import { rowsToTaxCalculationInputs } from "~/lib/tax/calc/inputs";
import type { TaxFormData, TaxFormCreditRow } from "~/lib/tax/form/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { sumLabeledAmountSources } from "~/lib/tax/calc/labeledAmountSource";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { itemizedDeductionSelectOptions } from "~/components/tax/inputForm/shared";
import { rowIdsForTypedRows } from "~/lib/tax/form/rows";
import { childTaxCredit } from "~/lib/config/taxPage/rowMetrics";
import {
  creditsSectionUi,
  LineItemsAccordionFromConfig,
} from "~/components/tax/inputForm/sections/LineItemsAccordionFromConfig";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  addFederalTaxCredit: () => void;
  removeFederalTaxCreditAt: (rowIndex: number) => void;
  clearAll: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function CreditsSection(props: Props) {
  const calc = createMemo(() => rowsToTaxCalculationInputs(props.taxInput().rows));
  const creditRows = createMemo(() =>
    props.taxInput().rows.filter((r): r is TaxFormCreditRow => r.type === "credit"),
  );
  const creditRowIds = createMemo(() => rowIdsForTypedRows(props.taxInput().rows, "credit"));

  const creditConfigItems = useConfigItemsForSection(props.taxData, props.filingStatus, "credit");
  const creditKindOptions = createMemo(() => itemizedDeductionSelectOptions("credit", creditConfigItems()));

  const creditsTotal = createMemo(() => {
    const taxData = props.taxData();
    const dependentCredits = taxData ? childTaxCredit(props.taxInput().rows, taxData) : 0;
    return dependentCredits + sumLabeledAmountSources(calc().federalTaxCredits);
  });

  const showClearAll = createMemo(() => creditRows().length > 0);

  return (
    <LineItemsAccordionFromConfig
      ui={creditsSectionUi}
      summaryAmount={creditsTotal}
      taxInput={props.taxInput}
      setTaxInput={props.setTaxInput}
      taxData={props.taxData}
      validationCtx={props.validationCtx}
      onAdd={props.addFederalTaxCredit}
      onClearAll={props.clearAll}
      showClearAll={showClearAll}
      rowIds={creditRowIds}
      removeAt={props.removeFederalTaxCreditAt}
      kindOptions={creditKindOptions}
      configItems={creditConfigItems}
    />
  );
}
