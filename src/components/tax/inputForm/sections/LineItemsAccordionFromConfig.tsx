import type { JSX } from "solid-js";
import {
  LineItemsAccordionSection,
  type LineItemsAccordionSectionProps,
} from "~/components/tax/inputForm/sections/LineItemsAccordionSection";
import type { LineItemRowType } from "~/components/tax/inputForm/state/lineItemRowState";
import type { LineItemSourceRowProps } from "~/components/tax/inputForm/rows/LineItemSourceRow";

function LineItemsMutedParagraph(props: { text: string }) {
  return <p class="text-xs leading-relaxed text-muted-foreground">{props.text}</p>;
}

type LineItemsAccordionUiConfig = {
  title: string;
  descriptionText: string;
  addLabel: string;
  kindColumnHeader: string;
  labelColumnHeader: string;
  amountColumnHeader: string;
  rowType: LineItemRowType;
  detailVariant?: LineItemSourceRowProps["detailVariant"];
  kindDataLabel: string;
  kindSelectLabel: string;
  labelPlaceholder: string;
  removeEntity: LineItemSourceRowProps["removeEntity"];
};

export const incomeSectionUi: LineItemsAccordionUiConfig = {
  title: "Income sources",
  descriptionText:
    "Add wages, self-employment, and other ordinary income—one row per type. Optional labels are only for your notes (for example in charts).",
  addLabel: "Add source",
  kindColumnHeader: "Type",
  labelColumnHeader: "Label (optional)",
  amountColumnHeader: "Amount",
  rowType: "income",
  detailVariant: "none",
  kindDataLabel: "Type",
  kindSelectLabel: "Income type",
  labelPlaceholder: "e.g. Employer, Brokerage",
  removeEntity: "source",
};

export const preTaxSectionUi: LineItemsAccordionUiConfig = {
  title: "Pre-tax benefits",
  descriptionText:
    "Choose a benefit type and amount per row (optional labels are for your notes). Payroll lines apply only to W-2 wages; totals above wages are scaled down. IRS contribution limits for the selected year are enforced automatically (age-50+ catch-up is not modeled).",
  addLabel: "Add benefit",
  kindColumnHeader: "Type",
  labelColumnHeader: "Label (optional)",
  amountColumnHeader: "Amount",
  rowType: "pretax",
  detailVariant: "pretax",
  kindDataLabel: "Type",
  kindSelectLabel: "Benefit type",
  labelPlaceholder: "e.g. Employer plan, bank",
  removeEntity: "line",
};

export const creditsSectionUi: LineItemsAccordionUiConfig = {
  title: "Credits",
  descriptionText:
    "Dependent credits are calculated from the counts in Settings. Add other federal credits here by category; excess is not refunded, and payroll taxes are unchanged.",
  addLabel: "Add credit line",
  kindColumnHeader: "Credit type",
  labelColumnHeader: "Label (optional)",
  amountColumnHeader: "Amount",
  rowType: "credit",
  detailVariant: "credit",
  kindDataLabel: "Credit type",
  kindSelectLabel: "Credit type",
  labelPlaceholder: "e.g. dependents, institution",
  removeEntity: "line",
};

type LineItemsAccordionFromConfigDynamic = Pick<
  LineItemsAccordionSectionProps,
  | "summaryAmount"
  | "leading"
  | "taxInput"
  | "setTaxInput"
  | "taxData"
  | "validationCtx"
  | "onAdd"
  | "onClearAll"
  | "showClearAll"
  | "rowIds"
  | "removeAt"
  | "kindOptions"
  | "configItems"
>;

type LineItemsAccordionFromConfigProps = {
  ui: LineItemsAccordionUiConfig;
} & LineItemsAccordionFromConfigDynamic;

export function LineItemsAccordionFromConfig(props: LineItemsAccordionFromConfigProps): JSX.Element {
  const { ui, ...dynamic } = props;

  return (
    <LineItemsAccordionSection
      title={ui.title}
      description={<LineItemsMutedParagraph text={ui.descriptionText} />}
      addLabel={ui.addLabel}
      kindColumnHeader={ui.kindColumnHeader}
      labelColumnHeader={ui.labelColumnHeader}
      amountColumnHeader={ui.amountColumnHeader}
      rowType={ui.rowType}
      detailVariant={ui.detailVariant}
      kindDataLabel={ui.kindDataLabel}
      kindSelectLabel={ui.kindSelectLabel}
      labelPlaceholder={ui.labelPlaceholder}
      removeEntity={ui.removeEntity}
      summaryAmount={dynamic.summaryAmount}
      leading={dynamic.leading}
      taxInput={dynamic.taxInput}
      setTaxInput={dynamic.setTaxInput}
      taxData={dynamic.taxData}
      validationCtx={dynamic.validationCtx}
      onAdd={dynamic.onAdd}
      onClearAll={dynamic.onClearAll}
      showClearAll={dynamic.showClearAll}
      rowIds={dynamic.rowIds}
      removeAt={dynamic.removeAt}
      kindOptions={dynamic.kindOptions}
      configItems={dynamic.configItems}
    />
  );
}
