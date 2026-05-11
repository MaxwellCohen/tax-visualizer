import type { FilingStatus } from "~/lib/tax/data/types";


export type Bracket = {
  upTo: number | null;
  rate: number;
};

export type LtcgBracketSet = {
  filingStatus: FilingStatus;
  brackets: Bracket[];
};

export type YearValues = {
  year: number;
  standardDeduction: Record<FilingStatus, number>;
  brackets: Record<FilingStatus, Bracket[]>;
  ltcgThresholds: LtcgBracketSet[];
  limits: Record<string, number>;
  caps: {
    salt: Record<FilingStatus, number>;
    credits: Record<string, number>;
  };
  defaults: {
    credits: Record<string, number>;
  };
  payroll: {
    ssRate: number;
    ssWageBase: number;
    medicareRate: number;
    additionalMedicareRate: number;
    additionalMedicareThreshold: Record<FilingStatus, number>;
    /** Schedule SE net earnings factor (typically 0.9235). */
    selfEmploymentNetEarningsFactor: number;
    selfEmploymentSocialSecurityRate: number;
    selfEmploymentMedicareRate: number;
  };
  niitRate: number;
  niitThreshold: Record<FilingStatus, number>;
};

export type ValidationContext = {
  yearValues: YearValues;
  filingStatus: FilingStatus;
  taxYear: number;
  isJoint: boolean;
  spouse1Value?: number;
  spouse2Value?: number;
  /** Pretax/income line `kind` (subcategory key) when validating a single row. */
  lineItemKind?: string;
};

