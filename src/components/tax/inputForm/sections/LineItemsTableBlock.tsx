import { For, type Accessor, type JSX } from "solid-js";
import { LineItemSourceRow, type LineItemSourceRowProps } from "~/components/tax/inputForm/rows/LineItemSourceRow";
import { AddLineHeaderControls, AddLineMobileControls } from "~/components/tax/inputForm/controls/AddLineControls";
import { taxInputFormTableThClass } from "~/components/tax/inputForm/shared";
import { indexOfTypedRowById } from "~/lib/tax/form/rows";
import type { LineItemRowType } from "~/components/tax/inputForm/state/lineItemRowState";

export type LineItemsTableBlockProps = Pick<
  LineItemSourceRowProps,
  | "taxInput"
  | "setTaxInput"
  | "taxData"
  | "validationCtx"
  | "kindDataLabel"
  | "kindSelectLabel"
  | "labelPlaceholder"
  | "kindOptions"
  | "removeEntity"
  | "detailVariant"
  | "configItems"
> & {
  description: JSX.Element;
  addLabel: string;
  onAdd: () => void;
  onClearAll?: () => void;
  showClearAll?: Accessor<boolean>;
  kindColumnHeader: string;
  labelColumnHeader: string;
  amountColumnHeader: string;
  rowType: LineItemRowType;
  rowIds: Accessor<string[]>;
  removeAt: (index: number) => void;
};

export function LineItemsTableBlock(props: LineItemsTableBlockProps) {
  const taxInput = props.taxInput;
  return (
    <>
      {props.description}
      <AddLineMobileControls label={props.addLabel} onAdd={props.onAdd} />
      <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-border bg-surface-alt">
        <table class="w-full min-w-0 border-collapse text-sm md:min-w-xl md:[&>tbody>tr:last-child>td]:border-b-0">
          <thead class="hidden md:table-header-group">
            <tr>
              <th scope="col" class={`${taxInputFormTableThClass} pl-3`}>
                {props.kindColumnHeader}
              </th>
              <th scope="col" class={taxInputFormTableThClass}>
                {props.labelColumnHeader}
              </th>
              <th scope="col" class={taxInputFormTableThClass}>
                {props.amountColumnHeader}
              </th>
              <th scope="col" class={`${taxInputFormTableThClass} whitespace-nowrap pr-3 text-right align-bottom`}>
                <AddLineHeaderControls
                  addLabel={props.addLabel}
                  onAdd={props.onAdd}
                  onClearAll={props.onClearAll}
                  showClearAll={props.showClearAll?.()}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={props.rowIds()}>
              {(rowId) => (
                <LineItemSourceRow
                  rowType={props.rowType}
                  detailVariant={props.detailVariant}
                  configItems={props.configItems}
                  taxInput={props.taxInput}
                  setTaxInput={props.setTaxInput}
                  rowId={rowId}
                  canRemove={props.rowIds().length > 1}
                  onRemove={() => {
                    const i = indexOfTypedRowById(taxInput().rows, props.rowType, rowId);
                    if (i >= 0) props.removeAt(i);
                  }}
                  taxData={props.taxData}
                  validationCtx={props.validationCtx}
                  kindDataLabel={props.kindDataLabel}
                  kindSelectLabel={props.kindSelectLabel}
                  labelPlaceholder={props.labelPlaceholder}
                  kindOptions={props.kindOptions}
                  removeEntity={props.removeEntity}
                />
              )}
            </For>
          </tbody>
        </table>
      </div>
    </>
  );
}
