import type { StateYearValues } from "./types";

/**
 * 2023 state individual income tax rules (rates, brackets, standard deduction, exemptions).
 * Source: Tax Foundation, rates as of January 1, 2023 — https://taxfoundation.org/data/all/state/state-income-tax-rates-2023/
 * Entries marked "Retroactive" were changed after that snapshot. `null` = no broad-based income tax.
 */
export const STATE_VALUES_2023: StateYearValues = {
  AL: {
    brackets: { single: [[0, 0.02], [500, 0.04], [3000, 0.05]], joint: [[0, 0.02], [1000, 0.04], [6000, 0.05]] },
    standardDeduction: [3000, 8500],
    personalExemption: [1500, 3000],
    dependentExemption: 1000,
    federalIncomeTaxDeductionCap: "unlimited",
  },
  AK: null,
  AZ: { brackets: [[0, 0.025]], standardDeduction: "federal", dependentExemptionCredit: 100 },
  // Retroactive: Act 532 of 2023 cut the top rate to 4.7% retroactive to Jan 1, 2023.
  AR: {
    brackets: [[0, 0.02], [4300, 0.04], [8500, 0.047]],
    standardDeduction: [2270, 4540],
    personalExemptionCredit: [29, 58],
    dependentExemptionCredit: 29,
  },
  CA: {
    brackets: { single: [[0, 0.01], [10099, 0.02], [23942, 0.04], [37788, 0.06], [52455, 0.08], [66295, 0.093], [338639, 0.103], [406364, 0.113], [677275, 0.123], [1000000, 0.133]], joint: [[0, 0.01], [20198, 0.02], [47884, 0.04], [75576, 0.06], [104910, 0.08], [132590, 0.093], [677278, 0.103], [812728, 0.113], [1000000, 0.123], [1354550, 0.133]] },
    standardDeduction: [5202, 10404],
    personalExemptionCredit: [140, 280],
    dependentExemptionCredit: 433,
  },
  CO: { brackets: [[0, 0.044]], standardDeduction: "federal" },
  CT: {
    brackets: { single: [[0, 0.03], [10000, 0.05], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]], joint: [[0, 0.03], [20000, 0.05], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]] },
    personalExemption: [15000, 24000],
  },
  DE: {
    brackets: [[2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]],
    standardDeduction: [3250, 6500],
    personalExemptionCredit: [110, 220],
    dependentExemptionCredit: 110,
  },
  DC: {
    brackets: [[0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]],
    standardDeduction: "federal",
  },
  FL: null,
  GA: {
    brackets: { single: [[0, 0.01], [750, 0.02], [2250, 0.03], [3750, 0.04], [5250, 0.05], [7000, 0.0575]], joint: [[0, 0.01], [1000, 0.02], [3000, 0.03], [5000, 0.04], [7000, 0.05], [10000, 0.0575]] },
    standardDeduction: [5400, 7100],
    personalExemption: [2700, 7400],
    dependentExemption: 3000,
  },
  HI: {
    brackets: { single: [[0, 0.014], [2400, 0.032], [4800, 0.055], [9600, 0.064], [14400, 0.068], [19200, 0.072], [24000, 0.076], [36000, 0.079], [48000, 0.0825], [150000, 0.09], [175000, 0.1], [200000, 0.11]], joint: [[0, 0.014], [4800, 0.032], [9600, 0.055], [19200, 0.064], [28800, 0.068], [38400, 0.072], [48000, 0.076], [72000, 0.079], [96000, 0.0825], [300000, 0.09], [350000, 0.1], [400000, 0.11]] },
    standardDeduction: [2200, 4400],
    personalExemption: [1144, 2288],
    dependentExemption: 1144,
  },
  ID: { brackets: [[0, 0.058]], standardDeduction: "federal" },
  IL: { brackets: [[0, 0.0495]], personalExemption: [2425, 2850], dependentExemption: 2425 },
  IN: { brackets: [[0, 0.0315]], personalExemption: [1000, 2000], dependentExemption: 1000 },
  // Starting point is federal taxable income (since 2023), so the federal standard deduction applies.
  IA: {
    brackets: { single: [[0, 0.044], [6000, 0.0482], [30000, 0.057], [75000, 0.06]], joint: [[0, 0.044], [12000, 0.0482], [60000, 0.057], [150000, 0.06]] },
    standardDeduction: "federal",
    personalExemptionCredit: [40, 80],
    dependentExemptionCredit: 40,
  },
  KS: {
    brackets: { single: [[0, 0.031], [15000, 0.0525], [30000, 0.057]], joint: [[0, 0.031], [30000, 0.0525], [60000, 0.057]] },
    standardDeduction: [3500, 8000],
    personalExemption: [2250, 4500],
    dependentExemption: 2250,
  },
  KY: { brackets: [[0, 0.045]], standardDeduction: [2770, 5540] },
  LA: {
    brackets: { single: [[0, 0.0185], [12500, 0.035], [50000, 0.0425]], joint: [[0, 0.0185], [25000, 0.035], [100000, 0.0425]] },
    personalExemption: [4500, 9000],
    dependentExemption: 1000,
  },
  ME: {
    brackets: { single: [[0, 0.058], [24500, 0.0675], [58050, 0.0715]], joint: [[0, 0.058], [49050, 0.0675], [116100, 0.0715]] },
    standardDeduction: "federal",
    personalExemption: [4700, 9400],
    dependentExemptionCredit: 300,
  },
  MD: {
    brackets: { single: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575]], joint: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575]] },
    standardDeduction: [2400, 4850],
    personalExemption: [3200, 6400],
    dependentExemption: 3200,
  },
  MA: { brackets: [[0, 0.05], [1000000, 0.09]], personalExemption: [4400, 8800], dependentExemption: 1000 },
  MI: { brackets: [[0, 0.0425]], personalExemption: [5000, 10000], dependentExemption: 5000 },
  MN: {
    brackets: { single: [[0, 0.0535], [30070, 0.068], [98760, 0.0785], [183340, 0.0985]], joint: [[0, 0.0535], [43950, 0.068], [174610, 0.0785], [304970, 0.0985]] },
    standardDeduction: [13825, 27650],
    dependentExemption: 4800,
  },
  MS: {
    brackets: [[10000, 0.05]],
    standardDeduction: [2300, 4600],
    personalExemption: [6000, 12000],
    dependentExemption: 1500,
  },
  MO: {
    brackets: [[1121, 0.02], [2242, 0.025], [3363, 0.03], [4484, 0.035], [5605, 0.04], [6726, 0.045], [7847, 0.0495]],
    standardDeduction: "federal",
    federalIncomeTaxDeductionCap: [5000, 10000],
  },
  MT: {
    brackets: [[0, 0.01], [3600, 0.02], [6300, 0.03], [9700, 0.04], [13000, 0.05], [16800, 0.06], [21600, 0.0675]],
    standardDeduction: [5540, 11080],
    personalExemption: [2960, 5920],
    dependentExemption: 2960,
    federalIncomeTaxDeductionCap: [5000, 10000],
  },
  NE: {
    brackets: { single: [[0, 0.0246], [3700, 0.0351], [22170, 0.0501], [35730, 0.0664]], joint: [[0, 0.0246], [7390, 0.0351], [44350, 0.0501], [71460, 0.0664]] },
    standardDeduction: [7900, 15800],
    personalExemptionCredit: [157, 314],
    dependentExemptionCredit: 157,
  },
  NV: null,
  NH: null,
  NJ: {
    brackets: { single: [[0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.05525], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]], joint: [[0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.05525], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]] },
    personalExemption: [1000, 2000],
    dependentExemption: 1500,
  },
  NM: {
    brackets: { single: [[0, 0.017], [5500, 0.032], [11000, 0.047], [16000, 0.049], [210000, 0.059]], joint: [[0, 0.017], [8000, 0.032], [16000, 0.047], [24000, 0.049], [315000, 0.059]] },
    standardDeduction: "federal",
    dependentExemption: 4000,
  },
  NY: {
    brackets: { single: [[0, 0.04], [8500, 0.045], [11700, 0.0525], [13900, 0.055], [80650, 0.06], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]], joint: [[0, 0.04], [17150, 0.045], [23600, 0.0525], [27900, 0.055], [161550, 0.06], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]] },
    standardDeduction: [8000, 16050],
    dependentExemption: 1000,
  },
  NC: { brackets: [[0, 0.0475]], standardDeduction: [12750, 25500] },
  ND: {
    brackets: { single: [[0, 0.011], [41775, 0.0204], [101050, 0.0227], [210825, 0.0264], [458350, 0.029]], joint: [[0, 0.011], [69700, 0.0204], [168450, 0.0227], [256650, 0.0264], [458350, 0.029]] },
    standardDeduction: "federal",
  },
  // Retroactive: HB 33 (2023) set a 0% band to $26,050 and rates of 2.75% / 3.688% / 3.75% retroactive to Jan 1, 2023.
  OH: {
    brackets: [[26050, 0.0275], [100000, 0.03688], [115300, 0.0375]],
    personalExemption: [2400, 4800],
    dependentExemption: 2400,
  },
  OK: {
    brackets: { single: [[0, 0.0025], [1000, 0.0075], [2500, 0.0175], [3750, 0.0275], [4900, 0.0375], [7200, 0.0475]], joint: [[0, 0.0025], [2000, 0.0075], [5000, 0.0175], [7500, 0.0275], [9800, 0.0375], [12200, 0.0475]] },
    standardDeduction: [6350, 12700],
    personalExemption: [1000, 2000],
    dependentExemption: 1000,
  },
  OR: {
    brackets: { single: [[0, 0.0475], [4050, 0.0675], [10200, 0.0875], [125000, 0.099]], joint: [[0, 0.0475], [8100, 0.0675], [20400, 0.0875], [250000, 0.099]] },
    standardDeduction: [2605, 5210],
    personalExemptionCredit: [236, 472],
    dependentExemptionCredit: 236,
    federalIncomeTaxDeductionCap: [7800, 7800],
  },
  PA: { brackets: [[0, 0.0307]] },
  RI: {
    brackets: [[0, 0.0375], [68200, 0.0475], [155050, 0.0599]],
    standardDeduction: [10000, 20050],
    personalExemption: [4700, 9400],
    dependentExemption: 4700,
  },
  SC: { brackets: [[0, 0.0], [3200, 0.03], [16040, 0.065]], standardDeduction: "federal", dependentExemption: 4430 },
  SD: null,
  TN: null,
  TX: null,
  // Retroactive: HB 54 (2023) cut the rate to 4.65% retroactive to Jan 1, 2023.
  UT: { brackets: [[0, 0.0465]], federalDeductionCreditRate: 0.06, dependentExemptionCredit: 108 },
  VT: {
    brackets: { single: [[0, 0.0335], [42150, 0.066], [102200, 0.076], [213150, 0.0875]], joint: [[0, 0.0335], [70450, 0.066], [170300, 0.076], [259500, 0.0875]] },
    standardDeduction: [6500, 13050],
    personalExemption: [4500, 9000],
    dependentExemption: 4500,
  },
  VA: {
    brackets: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]],
    standardDeduction: [8000, 16000],
    personalExemption: [930, 1860],
    dependentExemption: 930,
  },
  WA: null,
  WV: {
    brackets: [[0, 0.03], [10000, 0.04], [25000, 0.045], [40000, 0.06], [60000, 0.065]],
    personalExemption: [2000, 4000],
    dependentExemption: 2000,
  },
  WI: {
    brackets: { single: [[0, 0.0354], [13810, 0.0465], [27630, 0.053], [304170, 0.0765]], joint: [[0, 0.0354], [18420, 0.0465], [36840, 0.053], [405550, 0.0765]] },
    standardDeduction: [12760, 23620],
    personalExemption: [700, 1400],
    dependentExemption: 700,
  },
  WY: null,
};
