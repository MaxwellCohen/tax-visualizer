import type { FilingStatus } from "~/lib/taxData";
import {
  clampTaxInputPretaxToLimits,
  newIncomeSource,
  type IncomeKind,
  type TaxInput,
  type TaxResult,
} from "~/lib/taxCalc";

export const SCENARIO_QUERY_PARAM = "scenario";
export const SAVED_SCENARIO_STORAGE_KEY = "tax-visualizer:last-scenario";
export const BASELINE_SCENARIO_STORAGE_KEY = "tax-visualizer:baseline-scenario";

type ScenarioPresetId = "singleW2" | "w2AndLtcg" | "familyBenefits" | "highIncome";

type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  buildInput: (taxYear: number) => TaxInput;
};

type SerializedScenarioV1 = {
  version?: 1;
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: Array<{
    id?: string;
    kind: IncomeKind;
    label: string;
    amount: number;
  }>;
  preTax401k: number;
  preTaxHsa: number;
  preTaxOther: number;
  useItemizedDeductions: boolean;
  itemizedDeductions: number;
};

type SerializedScenarioV2 = {
  version: 2;
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: Array<{
    id?: string;
    kind: IncomeKind;
    label: string;
    amount: number;
  }>;
  preTax401kSpouse1: number;
  preTax401kSpouse2: number;
  preTaxHsaSpouse1: number;
  preTaxHsaSpouse2: number;
  preTaxOther: number;
  traditionalIraSpouse1?: number;
  traditionalIraSpouse2?: number;
  useItemizedDeductions: boolean;
  itemizedDeductions: number;
};

type SerializedScenario = SerializedScenarioV1 | SerializedScenarioV2;

const DEFAULT_FILING_STATUS: FilingStatus = "single";
const filingStatuses = new Set<FilingStatus>([
  "single",
  "marriedJoint",
  "marriedSeparate",
  "headOfHousehold",
]);
const incomeKinds = new Set<IncomeKind>([
  "wages",
  "ordinary",
  "shortTermCapGains",
  "longTermCapGains",
]);

const scenarioPresets: ScenarioPreset[] = [
  {
    id: "singleW2",
    label: "Single W-2",
    description: "Starter salary-only example with no pre-tax contributions.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "single",
      incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000, label: "Salary" })],
      preTax401kSpouse1: 0,
      preTax401kSpouse2: 0,
      preTaxHsaSpouse1: 0,
      preTaxHsaSpouse2: 0,
      preTaxOther: 0,
      traditionalIraSpouse1: 0,
      traditionalIraSpouse2: 0,
      useItemizedDeductions: false,
      itemizedDeductions: 0,
    }),
  },
  {
    id: "w2AndLtcg",
    label: "W-2 + LTCG",
    description: "Shows how ordinary income and long-term gains stack together.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "single",
      incomeSources: [
        newIncomeSource({ kind: "wages", amount: 120_000, label: "Salary" }),
        newIncomeSource({ kind: "longTermCapGains", amount: 25_000, label: "Brokerage sale" }),
      ],
      preTax401kSpouse1: 10_000,
      preTax401kSpouse2: 0,
      preTaxHsaSpouse1: 0,
      preTaxHsaSpouse2: 0,
      preTaxOther: 0,
      traditionalIraSpouse1: 0,
      traditionalIraSpouse2: 0,
      useItemizedDeductions: false,
      itemizedDeductions: 0,
    }),
  },
  {
    id: "familyBenefits",
    label: "Family benefits",
    description: "Married-filing-jointly example with common payroll benefits.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "marriedJoint",
      incomeSources: [newIncomeSource({ kind: "wages", amount: 180_000, label: "Household wages" })],
      preTax401kSpouse1: 11_000,
      preTax401kSpouse2: 11_000,
      preTaxHsaSpouse1: 3_000,
      preTaxHsaSpouse2: 3_000,
      preTaxOther: 3_000,
      traditionalIraSpouse1: 0,
      traditionalIraSpouse2: 0,
      useItemizedDeductions: false,
      itemizedDeductions: 0,
    }),
  },
  {
    id: "highIncome",
    label: "High-income payroll",
    description: "Highlights Social Security wage-base behavior and Medicare surtax.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "single",
      incomeSources: [
        newIncomeSource({ kind: "wages", amount: 260_000, label: "Compensation" }),
        newIncomeSource({ kind: "shortTermCapGains", amount: 15_000, label: "Short-term gains" }),
      ],
      preTax401kSpouse1: 23_000,
      preTax401kSpouse2: 0,
      preTaxHsaSpouse1: 4_000,
      preTaxHsaSpouse2: 0,
      preTaxOther: 2_000,
      traditionalIraSpouse1: 0,
      traditionalIraSpouse2: 0,
      useItemizedDeductions: false,
      itemizedDeductions: 0,
    }),
  },
];

function sanitizeMoney(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric;
}

function sanitizeIncomeKind(value: unknown): IncomeKind {
  return incomeKinds.has(value as IncomeKind) ? (value as IncomeKind) : "ordinary";
}

function sanitizeFilingStatus(value: unknown): FilingStatus {
  return filingStatuses.has(value as FilingStatus)
    ? (value as FilingStatus)
    : DEFAULT_FILING_STATUS;
}

function fallbackScenario(fallbackYear: number): TaxInput {
  return {
    taxYear: fallbackYear,
    filingStatus: DEFAULT_FILING_STATUS,
    incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000 })],
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    useItemizedDeductions: false,
    itemizedDeductions: 0,
  };
}

function normalizeTaxYear(rawTaxYear: unknown, availableYears: number[], fallbackYear: number): number {
  const taxYear = Number(rawTaxYear);
  return availableYears.includes(taxYear) ? taxYear : fallbackYear;
}

export function sanitizeScenarioInput(
  rawValue: unknown,
  availableYears: number[],
  fallbackYear: number,
): TaxInput {
  if (rawValue == null || typeof rawValue !== "object") {
    return fallbackScenario(fallbackYear);
  }

  const raw = rawValue as Partial<SerializedScenario>;
  const taxYear = normalizeTaxYear(raw.taxYear, availableYears, fallbackYear);
  const incomeSources =
    Array.isArray(raw.incomeSources) && raw.incomeSources.length > 0
      ? raw.incomeSources.map((source, index) => ({
          id: typeof source?.id === "string" && source.id.trim() ? source.id : `shared-${index}`,
          kind: sanitizeIncomeKind(source?.kind),
          label: typeof source?.label === "string" ? source.label : "",
          amount: sanitizeMoney(source?.amount),
        }))
      : fallbackScenario(taxYear).incomeSources;

  const v2 = raw as Partial<SerializedScenarioV2>;
  if (raw.version === 2) {
    return clampTaxInputPretaxToLimits({
      taxYear,
      filingStatus: sanitizeFilingStatus(raw.filingStatus),
      incomeSources,
      preTax401kSpouse1: sanitizeMoney(v2.preTax401kSpouse1),
      preTax401kSpouse2: sanitizeMoney(v2.preTax401kSpouse2),
      preTaxHsaSpouse1: sanitizeMoney(v2.preTaxHsaSpouse1),
      preTaxHsaSpouse2: sanitizeMoney(v2.preTaxHsaSpouse2),
      preTaxOther: sanitizeMoney(v2.preTaxOther),
      traditionalIraSpouse1: sanitizeMoney(v2.traditionalIraSpouse1),
      traditionalIraSpouse2: sanitizeMoney(v2.traditionalIraSpouse2),
      useItemizedDeductions: Boolean(raw.useItemizedDeductions),
      itemizedDeductions: sanitizeMoney(raw.itemizedDeductions),
    });
  }

  const v1 = raw as SerializedScenarioV1;
  return clampTaxInputPretaxToLimits({
    taxYear,
    filingStatus: sanitizeFilingStatus(raw.filingStatus),
    incomeSources,
    preTax401kSpouse1: sanitizeMoney(v1.preTax401k),
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: sanitizeMoney(v1.preTaxHsa),
    preTaxHsaSpouse2: 0,
    preTaxOther: sanitizeMoney(v1.preTaxOther),
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    useItemizedDeductions: Boolean(raw.useItemizedDeductions),
    itemizedDeductions: sanitizeMoney(raw.itemizedDeductions),
  });
}

export function serializeScenarioInput(input: TaxInput): string {
  const payload: SerializedScenarioV2 = {
    version: 2,
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: input.incomeSources.map(source => ({
      id: source.id,
      kind: source.kind,
      label: source.label,
      amount: source.amount,
    })),
    preTax401kSpouse1: input.preTax401kSpouse1,
    preTax401kSpouse2: input.preTax401kSpouse2,
    preTaxHsaSpouse1: input.preTaxHsaSpouse1,
    preTaxHsaSpouse2: input.preTaxHsaSpouse2,
    preTaxOther: input.preTaxOther,
    traditionalIraSpouse1: input.traditionalIraSpouse1,
    traditionalIraSpouse2: input.traditionalIraSpouse2,
    useItemizedDeductions: input.useItemizedDeductions,
    itemizedDeductions: input.itemizedDeductions,
  };
  return JSON.stringify(payload);
}

export function deserializeScenarioInput(
  value: string,
  availableYears: number[],
  fallbackYear: number,
): TaxInput | null {
  try {
    return sanitizeScenarioInput(JSON.parse(value), availableYears, fallbackYear);
  } catch {
    try {
      return sanitizeScenarioInput(
        JSON.parse(decodeURIComponent(value)),
        availableYears,
        fallbackYear,
      );
    } catch {
      return null;
    }
  }
}

export function getScenarioPresets(): ScenarioPreset[] {
  return scenarioPresets;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function buildScenarioSummaryText(result: TaxResult): string {
  const incomeParts = result.incomeSources
    .filter(source => source.amount > 0)
    .map(source => `${source.label.trim() || source.kind}: ${money.format(source.amount)}`);

  return [
    `Tax Visualizer scenario (${result.taxYear}, ${result.filingStatus}).`,
    incomeParts.length > 0 ? `Income sources: ${incomeParts.join("; ")}.` : "Income sources: none entered.",
    `Total income ${money.format(result.totalIncome)}. Payroll pre-tax ${money.format(result.preTaxTotal)}; traditional IRA ${money.format(result.traditionalIra)}. Deduction used: ${result.deductionKind} ${money.format(result.deductionAmount)}.`,
    `Federal income tax ${money.format(result.federalIncomeTax)} and payroll tax ${money.format(result.payrollTax)} for an effective tax rate of ${percent.format(result.effectiveTaxRate)}.`,
    `Take-home pay in this model: ${money.format(result.takeHomePay)}.`,
    "This app is educational and omits state tax, credits, AMT, and many return-specific adjustments; NIIT is only approximated from capital gains.",
  ].join("\n");
}
