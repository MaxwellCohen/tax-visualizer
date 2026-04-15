import { findItemById, type configItem } from "./page/pageConfig.types";

/**
 * Map a pretax form row kind (e.g. `preTax401kSpouse1`) to the corresponding
 * {@link getInputItems} config `id` (e.g. `input-401k`).
 */
export function pretaxFormKindToConfigItemId(kind: string): string {
  const k = kind.toLowerCase().replace(/spouse\d+/g, "").replace(/pretax/g, "");
  if (k.includes("401k") || k.includes("403b") || k.includes("457")) return "input-401k";
  if (k.includes("hsa")) return "hsa";
  if (k === "other" || k === "pretaxother") return "otherPretax";
  if (k.startsWith("traditionalira") || (k.includes("ira") && !k.includes("hsa"))) return "input-traditionalIra";
  if (k.includes("fsa") || k.includes("commuter")) return "otherPretax";
  return k;
}

export function findConfigItemForDeductionKind(items: configItem[], kind: string): configItem | undefined {
  return findItemById(items, kind) ?? findItemById(items, `input-${kind}`);
}

export function findConfigItemForFederalCreditKind(items: configItem[], kind: string): configItem | undefined {
  const direct = findItemById(items, kind) ?? findItemById(items, `input-${kind}`);
  if (direct) return direct;
  const fallbackKinds = [
    "creditForOtherDependents",
    "childAndDependentCare",
    "foreignTaxCredit",
    "residentialCleanEnergy",
    "electricVehicleCredit",
    "generalBusinessCredit",
  ];
  if (fallbackKinds.includes(kind)) {
    return findItemById(items, "otherFederalCredit");
  }
  return undefined;
}
