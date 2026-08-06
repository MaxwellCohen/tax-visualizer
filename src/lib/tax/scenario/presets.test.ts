import { describe, expect, it } from "vitest";
import { pruneDisallowedLineItemKinds } from "~/lib/tax/scenario/pruneLineItemKinds";
import { SCENARIO_PRESETS } from "~/lib/tax/scenario/presets.constants";

describe("SCENARIO_PRESETS", () => {
  it.each(SCENARIO_PRESETS.map((preset) => [preset.id, preset] as const))(
    "%s income rows survive kind pruning with amounts intact",
    (_id, preset) => {
      const built = preset.buildInput(2026);
      const incomeBefore = built.rows.filter((row) => row.type === "income");
      expect(incomeBefore.length).toBeGreaterThan(0);

      const pruned = pruneDisallowedLineItemKinds(built.rows);
      const incomeAfter = pruned.filter((row) => row.type === "income");

      expect(incomeAfter).toHaveLength(incomeBefore.length);
      for (const row of incomeBefore) {
        const match = incomeAfter.find((r) => r.id === row.id);
        expect(match).toBeDefined();
        expect(match).toMatchObject({ kind: row.kind, amount: row.amount, label: row.label });
      }
    },
  );
});
