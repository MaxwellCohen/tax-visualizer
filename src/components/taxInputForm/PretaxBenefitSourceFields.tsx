import { Show, createMemo, createSignal, type Accessor, type Setter } from "solid-js";
import type { TaxFormData, TaxFormPretaxRow } from "~/lib/taxForm.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import {
  inputClass,
  pretaxBenefitKindSelectOptions,
  pretaxFieldCaptionClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import { FormFieldValidationMessage } from "~/components/taxInputForm/FormFieldValidationMessage";
import { getInputItemsForSection, validateLineItemAmount } from "~/lib/config";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import type { configItem } from "~/lib/config/page/pageConfig.types";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  isMarriedJoint: () => boolean;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

const pretaxDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

function patchPretaxRow(
  rows: TaxFormData["rows"],
  rowId: string,
  patch: Partial<Pick<TaxFormPretaxRow, "kind" | "label" | "amount">>,
): TaxFormData["rows"] {
  const i = indexOfTypedRowById(rows, "pretax", rowId);
  if (i < 0) return rows;
  const r = rows[i];
  if (r.type !== "pretax") return rows;
  const next = [...rows];
  next[i] = { ...r, ...patch };
  return next;
}

export function PretaxBenefitSourceRow(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const configItems = createMemo((): configItem[] => {
    const td = props.taxData();
    const fs = props.filingStatus();
    if (!td) return [];
    return getInputItemsForSection(td, fs, "pretax");
  });

  const kindOptions = createMemo(() => pretaxBenefitKindSelectOptions(configItems(), props.isMarriedJoint()));

  const rowIndex = createMemo(() => indexOfTypedRowById(props.taxInput().rows, "pretax", props.rowId));

  const kind = createMemo(() => {
    const i = rowIndex();
    const r = i >= 0 ? props.taxInput().rows[i] : undefined;
    return r?.type === "pretax" ? r.kind : undefined;
  });

  const label = createMemo(() => {
    const i = rowIndex();
    const r = i >= 0 ? props.taxInput().rows[i] : undefined;
    return r?.type === "pretax" ? r.label : "";
  });

  const amount = createMemo(() => {
    const i = rowIndex();
    const r = i >= 0 ? props.taxInput().rows[i] : undefined;
    return r?.type === "pretax" ? r.amount : 0;
  });

  const [amountError, setAmountError] = createSignal<string | undefined>();
  const revalidateAmount = (n: number) => {
    setAmountError(validateLineItemAmount(kind(), n, props.validationCtx(), props.taxData()));
  };

  const detail = createMemo(() => {
    const currentKind = kind();
    const items = configItems();
    const item =
      items.find((it) => it.inputRowSettings?.subcategories?.some((sub) => sub.key === currentKind)) ??
      items.find((i) => i.id === "input-pretax-otherPretax");

    if (!item) {
      return { description: "Loading...", limitNote: "Loading..." };
    }
    return {
      description: item.description ?? "Unknown pretax benefit type",
      limitNote: item.kindDetail?.limitNote ?? "",
    };
  });

  const showWhenKey = createMemo(() => (rowIndex() >= 0 ? props.rowId : false));

  return (
    <Show when={showWhenKey()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
            <FormStyledSelect
              label="Benefit type"
              hideLabel
              value={() => kind() ?? ""}
              onInput={(e) => {
                const newKind = e.currentTarget.value;
                props.setTaxInput((prev) => ({
                  ...prev,
                  rows: patchPretaxRow(prev.rows, props.rowId, { kind: newKind }),
                }));
                revalidateAmount(amount());
              }}
              onBlur={() => {}}
              options={kindOptions()}
            />
          </td>
          <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
            <input
              type="text"
              placeholder="e.g. Employer plan, bank"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              aria-label="Label (optional)"
              value={label()}
              onInput={(e) => {
                props.setTaxInput((prev) => ({
                  ...prev,
                  rows: patchPretaxRow(prev.rows, props.rowId, { label: e.currentTarget.value }),
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
                  props.setTaxInput((prev) => ({
                    ...prev,
                    rows: patchPretaxRow(prev.rows, props.rowId, { amount: n }),
                  }));
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
              title={props.canRemove ? "Remove this line" : "Keep at least one line"}
              onClick={() => props.onRemove()}
            >
              Remove
            </button>
          </td>
        </tr>
        <tr class="md:table-row max-md:block max-md:w-full max-md:border-0 max-md:bg-transparent max-md:p-0">
          <td class={pretaxDetailRowTdClass} colspan={4}>
            <div class={`${pretaxFieldCaptionClass} space-y-1 text-(--text-muted)`}>
              <p class="leading-snug">{detail().description}</p>
              <p class="leading-snug">{detail().limitNote}</p>
            </div>
          </td>
        </tr>
      </>
    </Show>
  );
}
