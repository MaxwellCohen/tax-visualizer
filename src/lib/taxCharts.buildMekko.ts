import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";

type MekkoRowKind = "deduction" | "pretax" | "ordinaryBracket" | "ltcgBracket";

export type MekkoRow = {
  id: string;
  label: string;
  total: number;
  keep: number;
  tax: number;
  kind: MekkoRowKind;
  marginalRate?: number;
};

export function buildMekkoFromConfig(cc: CalculatedConfigItem[]): MekkoRow[] {
    return cc
        .filter(item => item.computedValue > 0 && item.mekkoSettings?.column)
        .map(item => {
            const column = item.mekkoSettings!.column!;
            return {
                id: item.id,
                label: item.label,
                total: item.computedValue,
                keep: item.computedValue,
                tax: 0,
                kind: column.kind,
                marginalRate: column.row,
            };
        });
}