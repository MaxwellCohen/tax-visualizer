import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";
import { getFederalIncomeTaxLiability } from "~/lib/tax/withholding/getFederalIncomeTaxLiability";
import { computeWithholdingEstimate } from "~/lib/tax/withholding/computeWithholdingEstimate";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { WithholdingInputs } from "~/lib/tax/withholding/types";
import { deriveWageJobsFromTaxInput } from "~/lib/tax/withholding/wageJobs";

export type HeadlineMetric = {
  label: string;
  value: number;
  format: "currency";
  highlight?: boolean;
};

export type HeadlineTaxScope = "incomeOnly" | "allTaxes";

function configAmount(
  calculatedConfig: CalculatedConfigItem[],
  id: string,
): number {
  return calculatedConfig.find((c) => c.id === id)?.computedValue ?? 0;
}

export function totalModeledTaxes(
  calculatedConfig: CalculatedConfigItem[] | null | undefined,
  scope: HeadlineTaxScope = "allTaxes",
): number {
  if (!calculatedConfig?.length) return 0;
  const federalIncomeTax = configAmount(calculatedConfig, "federalIncomeTax");
  if (scope === "incomeOnly") return federalIncomeTax;
  return (
    federalIncomeTax +
    configAmount(calculatedConfig, "payrollTax") +
    configAmount(calculatedConfig, "selfEmploymentTax")
  );
}

export function headlineMetricsFromCalculatedConfig(
  calculatedConfig: CalculatedConfigItem[] | null | undefined,
  options?: { taxScope?: HeadlineTaxScope },
): HeadlineMetric[] {
  if (!calculatedConfig?.length) return [];
  const taxScope = options?.taxScope ?? "allTaxes";
  const takeHome = calculatedConfig.find(c => c.id === "takeHomePay");
  const federalTax = calculatedConfig.find(c => c.id === "federalIncomeTax");
  const metrics: HeadlineMetric[] = [];
  const taxTotal = totalModeledTaxes(calculatedConfig, taxScope);
  if (taxTotal > 0) {
    const label =
      taxScope === "allTaxes"
        ? "Federal income & payroll taxes"
        : (federalTax?.labels.summary ?? federalTax?.labels.default ?? "Federal income tax");
    metrics.push({
      label,
      value: taxTotal,
      format: "currency",
      highlight: true,
    });
  }
  if (takeHome) {
    metrics.push({
      label: takeHome.labels.summary ?? takeHome.labels.default,
      value: takeHome.computedValue,
      format: "currency",
      highlight: true,
    });
  }
  return metrics;
}

export function withholdingBalanceHeadline(
  taxInput: TaxFormData,
  calculatedConfig: CalculatedConfigItem[] | null | undefined,
  withholdingInputs: WithholdingInputs,
): HeadlineMetric | null {
  const liability = getFederalIncomeTaxLiability(calculatedConfig);
  if (liability === null) return null;
  const wageJobs = deriveWageJobsFromTaxInput(taxInput);
  const estimate = computeWithholdingEstimate(liability, wageJobs, withholdingInputs);
  if (estimate.estimatedBalance === null) return null;
  const balance = estimate.estimatedBalance;
  const label =
    balance > 0 ? "Est. refund" : balance < 0 ? "Est. owed" : "Withholding even";
  return {
    label,
    value: Math.abs(balance),
    format: "currency",
    highlight: balance !== 0,
  };
}
