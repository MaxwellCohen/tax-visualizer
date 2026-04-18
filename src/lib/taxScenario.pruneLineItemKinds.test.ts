import { describe, expect, it } from "vitest";
import { pretaxBenefitKindSelectOptions } from "~/components/taxInputForm/shared";
import { getAllowedLineItemKindSets } from "~/lib/config/page/allowedInputKinds";
import { getTaxYearConfig } from "~/lib/taxData";
import { taxFormDataFromParts } from "~/lib/taxForm.factories";
import { deserializeScenarioInput } from "~/lib/taxScenario.serialize";
import { pruneDisallowedLineItemKinds } from "~/lib/taxScenario.pruneLineItemKinds";
import { getInputItems } from "~/lib/config/page/Page.config";

describe("pruneDisallowedLineItemKinds", () => {
  it("omits rows whose kind is not in config", () => {
    const td = getTaxYearConfig(2025);
    if (!td) throw new Error("missing 2025 tax config");
    const input = taxFormDataFromParts({
      taxYear: 2025,
      filingStatus: "single",
      incomeRows: [
        { type: "income", id: "i1", kind: "income-ordinary-wages", label: "", amount: 50_000 },
      ],
      pretaxRows: [
        { type: "pretax", id: "p1", kind: "totally-unknown-pretax-kind", label: "", amount: 100 },
        { type: "pretax", id: "p2", kind: "input-pretax-hsa-preTaxHsaSpouse1", label: "", amount: 200 },
      ],
      useItemizedDeductions: false,
      deductionRows: [{ type: "deduction", id: "d1", kind: "deduction-salt-salt", label: "", amount: 0 }],
      creditRows: [{ type: "credit", id: "c1", kind: "input-credit-childTax-childTax", label: "", amount: 0 }],
    });
    const out = pruneDisallowedLineItemKinds(input.rows);
    const pretaxKinds = out.filter((r) => r.type === "pretax").map((r) => r.kind);
    expect(pretaxKinds).not.toContain("totally-unknown-pretax-kind");
    expect(pretaxKinds).toContain("input-pretax-hsa-preTaxHsaSpouse1");
  });

  it("deserialize drops invalid kinds via sanitize", () => {
    const td = getTaxYearConfig(2025);
    if (!td) throw new Error("missing 2025 tax config");
    const rows = [
      { type: "setting", id: "taxYear", value: 2025 },
      { type: "setting", id: "filingStatus", value: "single" },
      { type: "income", id: "i1", kind: "income-ordinary-wages", label: "", amount: 1 },
      { type: "pretax", id: "p1", kind: "not-a-real-kind", label: "", amount: 1 },
      { type: "setting", id: "useItemizedDeductions", value: false },
      { type: "deduction", id: "d1", kind: "deduction-salt-salt", label: "", amount: 0 },
      { type: "credit", id: "c1", kind: "input-credit-childTax-childTax", label: "", amount: 0 },
    ];
    const parsed = deserializeScenarioInput(JSON.stringify(rows), [2025], 2025);
    expect(parsed).not.toBeNull();
    const pretax = parsed!.rows.filter((r) => r.type === "pretax");
    expect(pretax.every((r) => r.kind !== "not-a-real-kind")).toBe(true);
  });
});

describe("allowed kinds / pretax MFJ", () => {
  it("excludes Spouse2 pretax keys for single filers", () => {
    const td = getTaxYearConfig(2025);
    if (!td) throw new Error("missing 2025 tax config");
    const allowed = getAllowedLineItemKindSets(td, "single");
    for (const k of allowed.pretax) {
      expect(k.includes("Spouse2")).toBe(false);
    }
  });

  it("pretaxBenefitKindSelectOptions has no Spouse2 values when not MFJ", () => {
    const td = getTaxYearConfig(2025);
    if (!td) throw new Error("missing 2025 tax config");
    const items = getInputItems(td, "single");
    const opts = pretaxBenefitKindSelectOptions(items, false);
    for (const o of opts) {
      expect(o.value.includes("Spouse2")).toBe(false);
    }
  });
});
