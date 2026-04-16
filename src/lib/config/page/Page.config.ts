import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import { makeCreditInputsConfig } from "./creditInputs";
import { makeDeductionInputsConfig, makePayrollFromWagesInputConfig, makePayrollTaxInputConfig } from "./deductionInputs";
import { makeEndingNodesConfig } from "./endingNodes";
import { makeIncomeInputsConfig } from "./incomeInputs";
import { makeDeductionAmountNodesConfig, makeIncomeNodesConfig, makePretaxIncomeNodesConfig, makePretaxDeductionsNodesConfig, make0taxIncomeNodesConfig } from "./incomeNodes";
import { makePretaxInputsConfig } from "./pretaxInputs";
import { getBracketItems, getLtcgBracketItems } from "./taxBracketNodes";
import { makeTaxNodesConfig } from "./taxNodes";
import type { configItem } from "./pageConfig.types";
import type { TaxTreatment } from "./pageConfig.types";

export type {
    InputRowSettings,
    SankeyLink,
    SankeyNode,
    SankeyCategory,
    TaxTreatment,
    configItem,
} from "./pageConfig.types";

export { findItemById } from "./pageConfig.types";

export function getConfigItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        ...makeIncomeInputsConfig(taxData, filingStatus),
        ...makePretaxInputsConfig(taxData, filingStatus),
        ...makeDeductionInputsConfig(taxData, filingStatus),
        ...makePretaxDeductionsNodesConfig(taxData, filingStatus),
        ...makeCreditInputsConfig(taxData, filingStatus),
        ...makeIncomeNodesConfig(taxData, filingStatus),
        ...makeDeductionAmountNodesConfig(taxData, filingStatus),
        ...makePayrollFromWagesInputConfig(taxData, filingStatus),
        ...make0taxIncomeNodesConfig(taxData, filingStatus),
        ...makePayrollTaxInputConfig(taxData, filingStatus),
        ...makePretaxIncomeNodesConfig(taxData, filingStatus),
        ...makeTaxNodesConfig(taxData, filingStatus),
        ...getBracketItems(taxData, filingStatus),
        ...getLtcgBracketItems(taxData, filingStatus),
        ...makeEndingNodesConfig(taxData, filingStatus),
    ];
}

export function getInputItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return getInputItems(taxData, filingStatus).filter((item) => 'inputRowSettings' in item)
}

export type IncomeKindConfig = {
    id: string;
    label: string;
    taxTreatment: TaxTreatment;
};

export function incomeKindConfigs(taxData: TaxYearConfig, filingStatus: FilingStatus): IncomeKindConfig[] {
    const items = makeIncomeInputsConfig(taxData, filingStatus);
    return items.map(item => ({
        id: item.id,
        label: item.label,
        taxTreatment: item.taxTreatment ?? "ordinary",
    }));
}

export type DeductionKindConfig = {
    id: string;
    label: string;
    aggregationField: string;
};


export type FederalCreditConfig = {
    id: string;
    label: string;
    aggregationField: string;
};


export type PretaxBenefitConfig = {
    id: string;
    label: string;
    limitKey?: keyof TaxYearConfig["pretaxLimits"];
    limitFn?: (limits: TaxYearConfig["pretaxLimits"], joint: boolean) => number;
    isSpouseSpecific: boolean;
    aggregationField: string;
};


export type SelfEmploymentConfig = {
    id: string;
    label: string;
    netEarningsRate: number;
    ssMultiplier: number;
};

export const SANKEY_IDS = {
    ordinaryTaxableIncome: "ordinary-taxable-income",
    payrollOrdinaryStrip: "payroll-ordinary-strip",
    longTermTaxableIncome: "long-term-taxable-income",
    ltcgIncome: "ltcg-income",
    ltcgDeductionShield: "ltcg-deduction-shield",
    taxesFederal: "taxes-federal",
    taxesPayroll: "taxes-payroll",
    federalCredits: "federal-credits",
    keep: "keep",
    deductionBenefitSink: "deduction-benefit-sink",
} as const;

export type SankeyChartNode = {
    id: string;
    label: string;
    kind: string;
    amount: number;
    column?: number;
    order?: number;
    fill?: string;
    stroke?: string;
    incomeKind?: string;
};

export type SankeyChartLink = {
    sourceId: string;
    targetId: string;
    value: number;
    fill?: string;
    stroke?: string;
};


