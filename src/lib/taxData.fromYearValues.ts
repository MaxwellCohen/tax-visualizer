import type { YearValues } from "~/lib/config/types";
import type {
  FederalTaxBracket,
  FederalTaxCreditCaps,
  FilingStatus,
  FilingStatusRecord,
  TaxYearConfig,
} from "~/lib/taxData.types";

const FILING_STATUSES: FilingStatus[] = ["single", "marriedJoint", "marriedSeparate", "headOfHousehold"];

/** Whether a modeled tax year uses final IRS figures or planning/provisional values. */
const TAX_YEAR_STATUS: Record<number, "final" | "planning"> = {
  2023: "final",
  2024: "final",
  2025: "final",
  2026: "planning",
};

export function getTaxYearStatus(year: number): "final" | "planning" {
  return TAX_YEAR_STATUS[year] ?? "final";
}

/**
 * Build {@link TaxYearConfig} from canonical {@link YearValues} (`config/yearValues`).
 * Brackets and thresholds are taken as-is from `yv` (no re-derivation from raw arrays).
 */
export function yearValuesToTaxYearConfig(yv: YearValues, status: "final" | "planning"): TaxYearConfig {
  const federalTaxCreditCaps = { ...yv.caps.credits } as FederalTaxCreditCaps;

  return {
    standardDeduction: { ...yv.standardDeduction },
    federalBrackets: bracketsToFederal(yv),
    longTermCapGains: { ...yv.ltcgThresholds },
    payroll: {
      socialSecurityRate: yv.payroll.ssRate,
      socialSecurityWageBase: yv.payroll.ssWageBase,
      medicareRate: yv.payroll.medicareRate,
      additionalMedicareRate: yv.payroll.additionalMedicareRate,
      additionalMedicareThreshold: { ...yv.payroll.additionalMedicareThreshold },
    },
    pretaxLimits: {
      electiveDeferral401k: yv.limits.electiveDeferral401k,
      hsaSelfOnly: yv.limits.hsaSelfOnly,
      hsaFamily: yv.limits.hsaFamily,
      traditionalIraContribution: yv.limits.traditionalIra,
    },
    itemizedCaps: {
      saltMax: { ...yv.caps.salt },
    },
    federalTaxCreditCaps,
    niit: {
      rate: yv.niitRate,
      magiThreshold: { ...yv.niitThreshold },
    },
    status,
  };
}

function bracketsToFederal(yv: YearValues): FilingStatusRecord<FederalTaxBracket[]> {
  const out = {} as FilingStatusRecord<FederalTaxBracket[]>;
  for (const fs of FILING_STATUSES) {
    out[fs] = yv.brackets[fs].map((b) => ({ upTo: b.upTo, rate: b.rate }));
  }
  return out;
}
