import { createSignal, type Accessor, type Setter } from "solid-js";
import { clampTaxFormData } from "~/lib/tax/calc/clamp";
import type { TaxFormData } from "~/lib/tax/form/types";
import { pruneDisallowedLineItemKinds } from "~/lib/tax/scenario/pruneLineItemKinds";
import { taxFormDataEquals } from "~/components/tax/inputForm/hooks/taxInputRowActions";
import { money } from "~/lib/format/moneyFormat";

/** Drops disallowed line-item kinds, then clamps pretax, SALT, and credit amounts to the year config. */
export function normalizeTaxFormData(data: TaxFormData): TaxFormData {
  const pruned = pruneDisallowedLineItemKinds(data.rows);
  const next = clampTaxFormData({ rows: pruned });
  if (taxFormDataEquals({ rows: data.rows }, { rows: next.rows })) return data;
  return { ...data, rows: next.rows };
}

function rowLabel(row: TaxFormData["rows"][number]): string {
  if (row.type === "setting") return row.id;
  return row.label.trim() || row.kind;
}

export function describeNormalizeAdjustments(before: TaxFormData, after: TaxFormData): string | null {
  if (taxFormDataEquals(before, after)) return null;
  const parts: string[] = [];
  for (const row of before.rows) {
    if (row.type === "setting") continue;
    const next = after.rows.find((candidate) => candidate.type === row.type && candidate.id === row.id);
    if (!next) {
      parts.push(`removed ${rowLabel(row)}`);
      continue;
    }
    if (next.type !== "setting" && next.amount !== row.amount) {
      parts.push(`${rowLabel(row)} capped to ${money.format(next.amount)}`);
    }
  }
  if (parts.length === 0) return null;
  return `Adjusted for year limits: ${parts.slice(0, 4).join("; ")}${parts.length > 4 ? "…" : ""}.`;
}

/** Signal whose every write is already pruned and clamped, so readers never see a follow-up correction. */
export function createNormalizedTaxInput(initial: TaxFormData): [
  Accessor<TaxFormData>,
  Setter<TaxFormData>,
  Accessor<string | null>,
] {
  const normalizedInitial = normalizeTaxFormData(initial);
  const [taxInput, setRaw] = createSignal(normalizedInitial);
  const [clampNotice, setClampNotice] = createSignal<string | null>(
    describeNormalizeAdjustments(initial, normalizedInitial),
  );
  const setTaxInput: Setter<TaxFormData> = (next) => {
    let proposed: TaxFormData | undefined;
    let written = taxInput();
    setRaw((prev) => {
      proposed = typeof next === "function" ? next(prev) : next;
      written = normalizeTaxFormData(proposed);
      return written;
    });
    if (proposed) setClampNotice(describeNormalizeAdjustments(proposed, written));
    return written;
  };
  return [taxInput, setTaxInput, clampNotice];
}
