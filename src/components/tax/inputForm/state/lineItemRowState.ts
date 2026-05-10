import { createMemo, createSignal, type Accessor } from "solid-js";
import { validateLineItemAmount } from "~/lib/config/taxPage/taxPage.config";
import type { ValidationContext } from "~/lib/config/types";
import { indexOfTypedRowById } from "~/lib/tax/form/rows";
import type {
  TaxFormCreditRow,
  TaxFormData,
  TaxFormDeductionRow,
  TaxFormIncomeRow,
  TaxFormPretaxRow,
} from "~/lib/tax/form/types";
import type { TaxYearConfig } from "~/lib/tax/data/types";

type LineItemRow = TaxFormIncomeRow | TaxFormPretaxRow | TaxFormDeductionRow | TaxFormCreditRow;
type LineItemRowType = LineItemRow["type"];
type LineItemRowByType<T extends LineItemRowType> = Extract<LineItemRow, { type: T }>;
type LineItemRowPatch<T extends LineItemRowType> = Partial<Pick<LineItemRowByType<T>, "kind" | "label" | "amount">>;

type LineItemRowStateProps<T extends LineItemRowType> = {
  taxInput: Accessor<TaxFormData>;
  rowId: string;
  rowType: T;
  taxData: Accessor<TaxYearConfig | null>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function patchLineItemRow<T extends LineItemRowType>(
  rows: TaxFormData["rows"],
  rowType: T,
  rowId: string,
  patch: LineItemRowPatch<T>,
): TaxFormData["rows"] {
  const i = indexOfTypedRowById(rows, rowType, rowId);
  if (i < 0) return rows;

  const row = rows[i];
  if (row.type !== rowType) return rows;

  const next = [...rows];
  next[i] = { ...row, ...patch };
  return next;
}

export function createLineItemRowState<T extends LineItemRowType>(props: LineItemRowStateProps<T>) {
  const rowIndex = createMemo(() => indexOfTypedRowById(props.taxInput().rows, props.rowType, props.rowId));

  const kind = createMemo(() => {
    const i = rowIndex();
    const row = i >= 0 ? props.taxInput().rows[i] : undefined;
    return row?.type === props.rowType ? row.kind : undefined;
  });

  const label = createMemo(() => {
    const i = rowIndex();
    const row = i >= 0 ? props.taxInput().rows[i] : undefined;
    return row?.type === props.rowType ? row.label : "";
  });

  const amount = createMemo(() => {
    const i = rowIndex();
    const row = i >= 0 ? props.taxInput().rows[i] : undefined;
    return row?.type === props.rowType ? row.amount : 0;
  });

  const [amountError, setAmountError] = createSignal<string | undefined>();
  const revalidateAmount = (value: number) => {
    setAmountError(validateLineItemAmount(kind(), value, props.validationCtx(), props.taxData()));
  };

  return {
    rowIndex,
    kind,
    label,
    amount,
    amountError,
    revalidateAmount,
    showWhenKey: createMemo(() => (rowIndex() >= 0 ? props.rowId : false)),
  };
}
