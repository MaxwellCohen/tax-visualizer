import { createMemo, type Accessor, type Setter } from "solid-js";
import { incomeKindSelectOptions } from "~/components/tax/inputForm/shared";
import type { TaxFormData, TaxFormIncomeRow } from "~/lib/tax/form/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { useStableTypedRowIds } from "~/components/tax/inputForm/hooks/useStableTypedRowIds";
import {
  incomeSectionUi,
  LineItemsAccordionFromConfig,
} from "~/components/tax/inputForm/sections/LineItemsAccordionFromConfig";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  addSource: () => void;
  removeSourceAt: (i: number) => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function IncomeSection(props: Props) {
  const incomeRowIds = useStableTypedRowIds(props.taxInput, "income");

  const incomeTotal = createMemo(() =>
    props
      .taxInput()
      .rows.filter((r): r is TaxFormIncomeRow => r.type === "income")
      .reduce((sum, s) => {
        const n = s.amount;
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
  );

  const configItems = useConfigItemsForSection(props.taxData, props.filingStatus, "income");

  const isMarriedJoint = createMemo(() => props.filingStatus() === "marriedJoint");

  const kindOptions = createMemo(() => incomeKindSelectOptions(configItems(), isMarriedJoint()));

  return (
    <LineItemsAccordionFromConfig
      ui={incomeSectionUi}
      summaryAmount={incomeTotal}
      taxInput={props.taxInput}
      setTaxInput={props.setTaxInput}
      taxData={props.taxData}
      validationCtx={props.validationCtx}
      onAdd={props.addSource}
      rowIds={incomeRowIds}
      removeAt={props.removeSourceAt}
      kindOptions={kindOptions}
    />
  );
}
