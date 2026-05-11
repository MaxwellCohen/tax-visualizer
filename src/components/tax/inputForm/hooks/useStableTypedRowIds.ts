import { createMemo, type Accessor } from "solid-js";
import type { TaxFormData } from "~/lib/tax/form/types";
import { rowIdsForTypedRows, type TaxFormLineItemRowType } from "~/lib/tax/form/rows";

/**
 * Solid `<For each={...}>` compares the `each` array by reference. `rowIdsForTypedRows` allocates a new array on
 * every read, so typing in a line item remounts every row and drops focus. Reuse the previous array when ids
 * are unchanged; children still update via `taxInput` accessors.
 */
export function useStableTypedRowIds(
  taxInput: Accessor<TaxFormData>,
  rowType: TaxFormLineItemRowType,
): Accessor<string[]> {
  let stable: string[] = [];
  return createMemo(() => {
    const next = rowIdsForTypedRows(taxInput().rows, rowType);
    if (stable.length === next.length && stable.every((id, i) => id === next[i])) {
      return stable;
    }
    stable = next;
    return stable;
  });
}
