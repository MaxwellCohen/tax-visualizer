import { Show, createMemo, type Accessor, type Setter } from "solid-js";
import type { ConfigItem } from "~/lib/config/taxPage/types";
import { taxInputFormTableTrClass } from "~/components/tax/inputForm/shared";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import {
  LineItemAmountCell,
  LineItemDetailSubRow,
  LineItemKindSelectCell,
  LineItemOptionalLabelCell,
  LineItemRemoveActionsCell,
  type LineItemRemoveEntity,
} from "~/components/tax/inputForm/rows/LineItemRowParts";
import { createLineItemRowState, patchLineItemRow, type LineItemRowType } from "~/components/tax/inputForm/state/lineItemRowState";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { TaxYearConfig } from "~/lib/tax/data/types";

type KindOption = { value: string | number; label: string };

export type LineItemSourceRowProps = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  rowId: string;
  rowType: LineItemRowType;
  canRemove: boolean;
  onRemove: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  validationCtx: Accessor<ValidationContext | undefined>;
  /** `<td data-label>` for the kind column (mobile). */
  kindDataLabel: string;
  /** Accessible label for the kind dropdown. */
  kindSelectLabel: string;
  labelPlaceholder: string;
  kindOptions: Accessor<KindOption[]>;
  removeEntity: LineItemRemoveEntity;
  /** Sub-row with description + secondary note; omit or `"none"` for income-style rows. */
  detailVariant?: "none" | "pretax" | "deduction" | "credit";
  /** Required when showing a detail sub-row. */
  configItems?: Accessor<ConfigItem[]>;
};

export function LineItemSourceRow(props: LineItemSourceRowProps) {
  const commitToUrl = useTaxInputCommitToUrl();

  const { kind, label, amount, amountError, revalidateAmount, showWhenKey } = createLineItemRowState({
    taxInput: props.taxInput,
    rowId: props.rowId,
    rowType: props.rowType,
    taxData: props.taxData,
    validationCtx: props.validationCtx,
  });

  const detailLines = createMemo(() => {
    const variant = props.detailVariant ?? "none";
    const ci = props.configItems;
    if (variant === "none" || !ci) return undefined;

    const currentKind = kind();
    const items = ci();
    let item: ConfigItem | undefined;

    switch (variant) {
      case "pretax":
        item =
          items.find((it) => it.input?.subcategories?.some((sub) => sub.key === currentKind)) ??
          items.find((i) => i.id === "input-pretax-otherPretax");
        if (!item) {
          return { line1: "Loading...", line2: "Loading..." };
        }
        return {
          line1: item.description ?? "Unknown pretax benefit type",
          line2: item.kindDetail?.limitNote ?? "",
        };
      case "deduction":
        item = items.find((it) => it.input?.subcategories?.some((sub) => sub.key === currentKind));
        if (!item) {
          return { line1: "Loading...", line2: "Loading..." };
        }
        return {
          line1: item.description ?? "Unknown deduction type",
          line2: item.kindDetail?.modelingNote ?? "",
        };
      case "credit":
        item =
          items.find((it) => it.input?.subcategories?.some((sub) => sub.key === currentKind)) ??
          items.find((i) => i.input?.category === "credit");
        if (!item) {
          return { line1: "Loading...", line2: "Loading..." };
        }
        return {
          line1: item.description ?? "Unknown credit type",
          line2: item.kindDetail?.modelingNote ?? "",
        };
      default:
        return undefined;
    }
  });

  return (
    <Show when={showWhenKey()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <LineItemKindSelectCell
            dataLabel={props.kindDataLabel}
            selectLabel={props.kindSelectLabel}
            kindValue={kind}
            options={props.kindOptions()}
            onKindInput={(e) => {
              const newKind = e.currentTarget.value;
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchLineItemRow(prev.rows, props.rowType, props.rowId, { kind: newKind }),
              }));
              revalidateAmount(amount());
            }}
          />
          <LineItemOptionalLabelCell
            value={label()}
            placeholder={props.labelPlaceholder}
            onChange={(v) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchLineItemRow(prev.rows, props.rowType, props.rowId, { label: v }),
              }));
            }}
            onBlurCommit={() => {
              commitToUrl?.();
            }}
          />
          <LineItemAmountCell
            value={amount()}
            amountError={amountError}
            onAmountChange={(n) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchLineItemRow(prev.rows, props.rowType, props.rowId, { amount: n }),
              }));
              revalidateAmount(n);
            }}
          />
          <LineItemRemoveActionsCell canRemove={props.canRemove} onRemove={props.onRemove} entity={props.removeEntity} />
        </tr>
        <Show when={detailLines()} keyed>
          {(lines) => (
            <LineItemDetailSubRow>
              <p class="leading-snug">{lines.line1}</p>
              <p class="leading-snug">{lines.line2}</p>
            </LineItemDetailSubRow>
          )}
        </Show>
      </>
    </Show>
  );
}
