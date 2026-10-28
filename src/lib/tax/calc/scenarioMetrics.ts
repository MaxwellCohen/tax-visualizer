import type { TaxCalculationInputs } from "~/lib/tax/config.types";
import type { FilingStatus } from "~/lib/tax/data/types";
import type {
  ResidenceState,
  TaxFormCreditRow,
  TaxFormDeductionRow,
  TaxFormIncomeRow,
  TaxFormPretaxRow,
  TaxFormRow,
} from "~/lib/tax/form/types";
import {
  applyHsaHouseholdCap,
  applyPretaxCompensationCaps,
  ficaWagesSpouse1FromRows,
  ficaWagesSpouse2FromRows,
  selfEmploymentSpouse1FromRows,
  selfEmploymentSpouse2FromRows,
} from "~/lib/tax/calc/pretaxCompensation";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";

const ELECTIVE_DEFERRAL_BASE_KIND_SET = new Set(
  [
    "input-pretax-401K-preTax401kSpouse1",
    "input-pretax-401K-preTax403bSpouse1",
    "input-pretax-401K-preTax457bSpouse1",
    "input-pretax-401K-preTax401kSpouse2",
    "input-pretax-401K-preTax403bSpouse2",
    "input-pretax-401K-preTax457bSpouse2",
  ].map((key) => key.toLowerCase()),
);

export type ScenarioMetrics = {
  rows: TaxFormRow[];
  taxYear: number;
  filingStatus: FilingStatus;
  residenceState: ResidenceState;
  useItemizedDeductions: boolean;
  qualifyingChildren: number;
  otherDependents: number;
  incomeSources: TaxCalculationInputs["incomeSources"];
  pretaxBenefitSources: TaxCalculationInputs["pretaxBenefitSources"];
  itemizedDeductions: TaxCalculationInputs["itemizedDeductions"];
  federalTaxCredits: TaxCalculationInputs["federalTaxCredits"];
  income: {
    wagesSpouse1: number;
    wagesSpouse2: number;
    wages: number;
    ficaWagesSpouse1: number;
    ficaWagesSpouse2: number;
    selfEmploymentSpouse1: number;
    selfEmploymentSpouse2: number;
    selfEmployment: number;
    ordinary: number;
    shortTermCapGains: number;
    longTermCapGains: number;
    total: number;
  };
  pretax: {
    electiveDeferrals401kFamilyExcludingCatchUp: number;
    preTax401k: number;
    hsa: number;
    other: number;
    all: number;
    traditionalIra: number;
  };
  credits: {
    education: number;
    retirementSavingsContributions: number;
    other: number;
  };
  deductions: {
    totalItemized: number;
  };
};

const metricsCache = new WeakMap<TaxFormRow[], ScenarioMetrics>();

function cappedPretaxRows(rows: TaxFormRow[], taxYear: number, filingStatus: FilingStatus): TaxFormRow[] {
  const config = getTaxYearConfig(taxYear);
  const hsaLimit = config
    ? filingStatus === "marriedJoint"
      ? config.pretaxLimits.hsaFamily
      : config.pretaxLimits.hsaSelfOnly
    : Number.POSITIVE_INFINITY;
  return applyPretaxCompensationCaps(applyHsaHouseholdCap(rows, hsaLimit));
}

function getNumericSettingFromRows(rows: TaxFormRow[], id: "qualifyingChildren" | "otherDependents"): number {
  for (const row of rows) {
    if (row.type === "setting" && row.id === id) {
      return Number.isFinite(row.value) ? row.value : 0;
    }
  }
  return 0;
}

export function getTaxYearFromRows(rows: TaxFormRow[]): number {
  return rows.find(row => row.type === "setting" && row.id === "taxYear")?.value ?? new Date().getFullYear();
}

export function getFilingStatusFromRows(rows: TaxFormRow[]): FilingStatus {
  for (const row of rows) {
    if (row.type === "setting" && row.id === "filingStatus") {
      return row.value;
    }
  }
  return "single";
}

export function getResidenceStateFromRows(rows: TaxFormRow[]): ResidenceState {
  for (const row of rows) {
    if (row.type === "setting" && row.id === "residenceState") {
      return row.value;
    }
  }
  return "none";
}

function getUseItemizedFromRows(rows: TaxFormRow[]): boolean {
  for (const row of rows) {
    if (row.type === "setting" && row.id === "useItemizedDeductions") {
      return row.value;
    }
  }
  return false;
}

export function findScenarioAmountById(rows: TaxFormRow[], id: string): number {
  const idLower = id.toLowerCase();
  let sum = 0;
  for (const row of (rows || [])) {
    if (row.type === "setting") {
      if (row.id.toLowerCase().includes(idLower) && "value" in row) {
        const value = row.value;
        if (typeof value === "number") return value;
        if (typeof value === "boolean") return value ? 1 : 0;
      }
    } else if ("kind" in row) {
      if (typeof row.kind === "string" && row.kind.toLowerCase().includes(idLower)) {
        if ("amount" in row && typeof row.amount === "number") {
          sum += row.amount;
        }
      }
    }
  }
  return sum;
}

function sumRowsByKindParts(rows: TaxFormRow[], ...kindParts: string[]): number {
  return rows.reduce((sum, row) => {
    if (row.type === "setting") return sum;
    const rowKind = row.kind?.toLowerCase();
    if (!rowKind || !kindParts.every((kind) => rowKind.includes(kind.toLowerCase()))) return sum;
    return sum + row.amount;
  }, 0);
}

function sumPretaxKinds(rows: TaxFormRow[], predicate: (kindLower: string) => boolean): number {
  let sum = 0;
  for (const row of rows || []) {
    if (row.type === "setting") continue;
    if (!("kind" in row) || typeof row.kind !== "string") continue;
    const kindLower = row.kind.toLowerCase();
    if (!predicate(kindLower)) continue;
    if ("amount" in row && typeof row.amount === "number") sum += row.amount;
  }
  return sum;
}

function incomeSourcesFromRows(rows: TaxFormRow[]): TaxCalculationInputs["incomeSources"] {
  return rows
    .filter((row): row is TaxFormIncomeRow => row.type === "income")
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      amount: row.amount,
    }));
}

function pretaxBenefitSourcesFromRows(rows: TaxFormRow[]): TaxCalculationInputs["pretaxBenefitSources"] {
  return rows
    .filter((row): row is TaxFormPretaxRow => row.type === "pretax")
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      amount: row.amount,
    }));
}

function itemizedDeductionsFromRows(rows: TaxFormRow[]): TaxCalculationInputs["itemizedDeductions"] {
  return rows
    .filter((row): row is TaxFormDeductionRow => row.type === "deduction")
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      amount: row.amount,
    }));
}

function federalTaxCreditsFromRows(rows: TaxFormRow[]): TaxCalculationInputs["federalTaxCredits"] {
  return rows
    .filter((row): row is TaxFormCreditRow => row.type === "credit")
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      amount: row.amount,
    }));
}

export function buildScenarioMetrics(rows: TaxFormRow[]): ScenarioMetrics {
  const cached = metricsCache.get(rows);
  if (cached) return cached;

  const taxYear = getTaxYearFromRows(rows);
  const filingStatus = getFilingStatusFromRows(rows);
  const wageIncomeSpouse1 =
    sumRowsByKindParts(rows, "income-ordinary-wages") -
    sumRowsByKindParts(rows, "income-ordinary-wages", "spouse2");
  const wageIncomeSpouse2 = sumRowsByKindParts(rows, "income-ordinary-wages", "spouse2");
  const wageIncome = wageIncomeSpouse1 + wageIncomeSpouse2;
  const seSpouse1 = selfEmploymentSpouse1FromRows(rows);
  const seSpouse2 = selfEmploymentSpouse2FromRows(rows);
  const pretaxRows = cappedPretaxRows(rows, taxYear, filingStatus);
  const ordinary = findScenarioAmountById(rows, "income-ordinary");
  const allPretax = findScenarioAmountById(pretaxRows, "input-pretax");
  const longTermCapGains = findScenarioAmountById(rows, "income-longTermCapGains");
  const deductions = findScenarioAmountById(rows, "deduction-");

  const metrics: ScenarioMetrics = {
    rows,
    taxYear,
    filingStatus,
    residenceState: getResidenceStateFromRows(rows),
    useItemizedDeductions: getUseItemizedFromRows(rows),
    qualifyingChildren: getNumericSettingFromRows(rows, "qualifyingChildren"),
    otherDependents: getNumericSettingFromRows(rows, "otherDependents"),
    incomeSources: incomeSourcesFromRows(rows),
    pretaxBenefitSources: pretaxBenefitSourcesFromRows(pretaxRows),
    itemizedDeductions: itemizedDeductionsFromRows(rows),
    federalTaxCredits: federalTaxCreditsFromRows(rows),
    income: {
      wagesSpouse1: wageIncomeSpouse1,
      wagesSpouse2: wageIncomeSpouse2,
      wages: wageIncome,
      ficaWagesSpouse1: ficaWagesSpouse1FromRows(pretaxRows),
      ficaWagesSpouse2: ficaWagesSpouse2FromRows(pretaxRows),
      selfEmploymentSpouse1: seSpouse1,
      selfEmploymentSpouse2: seSpouse2,
      selfEmployment: seSpouse1 + seSpouse2,
      ordinary,
      shortTermCapGains: findScenarioAmountById(rows, "income-ordinary-shortTermCapGains"),
      longTermCapGains,
      total: ordinary + longTermCapGains,
    },
    pretax: {
      electiveDeferrals401kFamilyExcludingCatchUp: sumPretaxKinds(pretaxRows, (kind) =>
        ELECTIVE_DEFERRAL_BASE_KIND_SET.has(kind),
      ),
      preTax401k: findScenarioAmountById(pretaxRows, "input-pretax-401K"),
      hsa: findScenarioAmountById(pretaxRows, "input-pretax-hsa"),
      other: findScenarioAmountById(pretaxRows, "input-pretax-otherPretax"),
      all: allPretax,
      traditionalIra: findScenarioAmountById(pretaxRows, "input-pretax-traditionalIra"),
    },
    credits: {
      education: findScenarioAmountById(rows, "input-credit-education"),
      retirementSavingsContributions: findScenarioAmountById(rows, "retirementSavingsContributions"),
      other: findScenarioAmountById(rows, "input-credit-other"),
    },
    deductions: {
      totalItemized: Math.max(0, deductions),
    },
  };
  metricsCache.set(rows, metrics);
  return metrics;
}

export function scenarioMetricsToTaxCalculationInputs(metrics: ScenarioMetrics): TaxCalculationInputs {
  return {
    taxYear: metrics.taxYear,
    filingStatus: metrics.filingStatus,
    qualifyingChildren: metrics.qualifyingChildren,
    otherDependents: metrics.otherDependents,
    incomeSources: metrics.incomeSources,
    pretaxBenefitSources: metrics.pretaxBenefitSources,
    useItemizedDeductions: metrics.useItemizedDeductions,
    itemizedDeductions: metrics.itemizedDeductions,
    federalTaxCredits: metrics.federalTaxCredits,
  };
}
