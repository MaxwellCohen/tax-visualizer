import { createMemo, type Accessor, type Setter } from "solid-js";
import { pretaxBenefitKindSelectOptions } from "~/components/tax/inputForm/shared";
import type { TaxFormData, TaxFormPretaxRow } from "~/lib/tax/form/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { useStableTypedRowIds } from "~/components/tax/inputForm/hooks/useStableTypedRowIds";
import {
  LineItemsAccordionFromConfig,
  preTaxSectionUi,
} from "~/components/tax/inputForm/sections/LineItemsAccordionFromConfig";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  preTaxBenefitsTotal: Accessor<number>;
  isMarriedJoint: Accessor<boolean>;
  addPretaxBenefit: () => void;
  removePretaxBenefitAt: (rowIndex: number) => void;
  clearAll: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function PreTaxSection(props: Props) {
  const pretaxRowIds = useStableTypedRowIds(props.taxInput, "pretax");
  const pretaxRows = createMemo(() =>
    props.taxInput().rows.filter((r): r is TaxFormPretaxRow => r.type === "pretax"),
  );

  const configItems = useConfigItemsForSection(props.taxData, props.filingStatus, "pretax");
  const kindOptions = createMemo(() => pretaxBenefitKindSelectOptions(configItems(), props.isMarriedJoint()));

  const showClearAll = createMemo(() => pretaxRows().length > 0);

  return (
    <LineItemsAccordionFromConfig
      ui={preTaxSectionUi}
      summaryAmount={props.preTaxBenefitsTotal}
      taxInput={props.taxInput}
      setTaxInput={props.setTaxInput}
      taxData={props.taxData}
      validationCtx={props.validationCtx}
      onAdd={props.addPretaxBenefit}
      onClearAll={props.clearAll}
      showClearAll={showClearAll}
      rowIds={pretaxRowIds}
      removeAt={props.removePretaxBenefitAt}
      kindOptions={kindOptions}
      configItems={configItems}
    />
  );
}
