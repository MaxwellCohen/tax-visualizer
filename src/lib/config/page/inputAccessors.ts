import type { TaxFormRow } from "~/lib/taxForm.types";

export function findInputById(inputs: TaxFormRow[], id: string): number {
    const idLower = id.toLowerCase();
    let sum = 0;
    for (const row of (inputs || [])) {
        if (row.type === "setting") {
            if (row.id.toLowerCase().includes(idLower)) {
                if ("value" in row) {
                    const v = row.value;
                    if (typeof v === "number") return v;
                    if (typeof v === "boolean") return v ? 1 : 0;
                }
            }
        } else if ("kind" in row) {
            if (typeof row.kind === "string" && row.kind.toLowerCase().includes(idLower)) {
                if ("amount" in row && typeof row.amount === "number") {
                    sum += row.amount;
                }
            }
        }
    }
    return sum;
}
