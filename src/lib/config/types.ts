export type ItemCategory = "income" | "pretax" | "deduction" | "credit";
export type TaxTreatment = "ordinary" | "selfEmployment" | "shortTermCapGains" | "longTermCapGains" | "taxExempt" | "deduction" | "credit";
export type CalculationType = "aggregate" | "passThrough" | "derived";

export type FilingStatus = "single" | "marriedJoint" | "marriedSeparate" | "headOfHousehold";

export type Bracket = {
  upTo: number | null;
  rate: number;
};

export type LtcgThreshold = {
  zeroRateMax: number;
  fifteenRateMax: number;
};

export type YearValues = {
  year: number;
  standardDeduction: Record<FilingStatus, number>;
  brackets: Record<FilingStatus, Bracket[]>;
  ltcgThresholds: Record<FilingStatus, LtcgThreshold>;
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
};

export type ValidationResult = {
  valid: boolean;
  message?: string;
  clampedValue?: number;
};

export type CalculationContext = {
  yearValues: YearValues;
  filingStatus: FilingStatus;
  taxYear: number;
  isJoint: boolean;
};