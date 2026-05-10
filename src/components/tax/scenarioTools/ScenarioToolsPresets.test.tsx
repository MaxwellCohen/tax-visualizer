import { describe, expect, it, vi } from "vitest";
import type { Accessor } from "solid-js";
import { render } from "@solidjs/testing-library";
import { ScenarioToolsPresets } from "./ScenarioToolsPresets";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { ScenarioPreset } from "~/lib/taxScenario.types";

const mockPresets: ScenarioPreset[] = [
  {
    id: "singleW2",
    label: "Single W-2",
    description: "Test preset",
    buildInput: (year) => ({ rows: [{ type: "setting", id: "taxYear", value: year }] }),
  },
];

const mockTaxInput: Accessor<TaxFormData> = () => ({
  rows: [{ type: "setting", id: "taxYear", value: 2025 }],
});

describe("ScenarioToolsPresets", () => {
  it("renders preset buttons", () => {
    const { getByText } = render(() => (
      <ScenarioToolsPresets
        presets={mockPresets}
        taxInput={mockTaxInput}
        onApplyPreset={vi.fn()}
      />
    ));

    expect(getByText("Single W-2")).toBeDefined();
  });

  it("calls onApplyPreset when button is clicked", async () => {
    const onApplyPreset = vi.fn();
    const { getByText } = render(() => (
      <ScenarioToolsPresets
        presets={mockPresets}
        taxInput={mockTaxInput}
        onApplyPreset={onApplyPreset}
      />
    ));

    getByText("Single W-2").click();

    expect(onApplyPreset).toHaveBeenCalledWith("singleW2");
  });
});