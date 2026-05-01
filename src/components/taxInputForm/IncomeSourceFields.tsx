import { Show, createMemo, createSignal, type Accessor, type Setter } from "solid-js";
import type { configItem } from "~/lib/config/page/pageConfig.types";
import {
  incomeKindSelectOptions,
  inputClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import { FormFieldValidationMessage } from "~/components/taxInputForm/FormFieldValidationMessage";
import { validateLineItemAmount } from "~/lib/config";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxFormData, TaxFormIncomeRow } from "~/lib/taxForm.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";

type IncomeSourceFieldsProps = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  configItems: configItem[];
  isMarriedJoint: boolean;
  taxData: Accessor<TaxYearConfig | null>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

function patchIncomeRow(
  rows: TaxFormData["rows"],
  rowId: string,
  patch: Partial<Pick<TaxFormIncomeRow, "kind" | "label" | "amount">>,
): TaxFormData["rows"] {
  const i = indexOfTypedRowById(rows, "income", rowId);
  if (i < 0) return rows;
  const r = rows[i];
  if (r.type !== "income") return rows;
  const next = [...rows];
  next[i] = { ...r, ...patch };
  return next;
}

export function IncomeSourceTableRow(props: IncomeSourceFieldsProps) {
  const commitToUrl = useTaxInputCommitToUrl();
  const rowIndex = createMemo(() => indexOfTypedRowById(props.taxInput().rows, "income", props.rowId));
  const kind = createMemo(() => {
    const i = rowIndex();
    const r = i >= 0 ? props.taxInput().rows[i] : undefined;
    return r?.type === "income" ? r.kind : undefined;
  });
  const label = createMemo(() => {
    const i = rowIndex();
    const r = i >= 0 ? props.taxInput().rows[i] : undefined;
    return r?.type === "income" ? r.label : "";
  });
  const amount = createMemo(() => {
    const i = rowIndex();
    const r = i >= 0 ? props.taxInput().rows[i] : undefined;
    return r?.type === "income" ? r.amount : 0;
  });

  const [amountError, setAmountError] = createSignal<string | undefined>();

  const revalidateAmount = (n: number) => {
    setAmountError(validateLineItemAmount(kind(), n, props.validationCtx(), props.taxData()));
  };

  /** Key `<Show keyed>` by stable row id — not `rows[i]` — so index shifts do not remount the row and reset `<select>`. */
  const showWhenKey = createMemo(() => (rowIndex() >= 0 ? props.rowId : false));
  const kindOptions = createMemo(() => incomeKindSelectOptions(props.configItems, props.isMarriedJoint));

  return (
    <Show when={showWhenKey()} keyed>
      <tr class={taxInputFormTableTrClass}>
        <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
          <FormStyledSelect
            label="Income type"
            hideLabel
            value={() => kind() ?? ""}
            onInput={(e) => {
              const newKind = e.currentTarget.value;
              props.setTaxInput((prev) => ({ ...prev, rows: patchIncomeRow(prev.rows, props.rowId, { kind: newKind }) }));
              const n = amount();
              revalidateAmount(n);
            }}
            onBlur={() => {}}
            options={kindOptions()}
          />
        </td>
        <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
          <input
            type="text"
            placeholder="e.g. Employer, Brokerage"
            class={inputClass}
            style={{ background: "var(--input-bg)", color: "var(--text)" }}
            aria-label="Label (optional)"
            value={label()}
            onInput={(e) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchIncomeRow(prev.rows, props.rowId, { label: e.currentTarget.value }),
              }));
            }}
            onBlur={() => {
              commitToUrl?.();
            }}
          />
        </td>
        <td class={taxInputFormTableTdLabeled} data-label="Amount">
          <div>
            <FormCurrencyInput
              value={amount()}
              onInput={(n) => {
                props.setTaxInput((prev) => ({ ...prev, rows: patchIncomeRow(prev.rows, props.rowId, { amount: n }) }));
                revalidateAmount(n);
              }}
              onBlur={() => {}}
              ariaLabel="Amount"
            />
            <FormFieldValidationMessage message={amountError} />
          </div>
        </td>
        <td class={taxInputFormTableTdActions}>
          <button
            type="button"
            class="rounded-md px-2.5 py-2 text-xs font-medium"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            disabled={!props.canRemove}
            title={props.canRemove ? "Remove this source" : "Keep at least one row"}
            onClick={() => props.onRemove()}
          >
            Remove
          </button>
        </td>
      </tr>
    </Show>
  );
}
