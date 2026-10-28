import type { StateYearValues } from "./types";

/**
 * 2025 state individual income tax rules (rates, brackets, standard deduction, exemptions).
 * Source: Tax Foundation, rates as of January 1, 2025 — https://taxfoundation.org/data/all/state/state-income-tax-rates/
 * Entries marked "Retroactive" were changed after that snapshot. `null` = no broad-based income tax.
 */
export const STATE_VALUES_2025: StateYearValues = {
  AL: {
    brackets: { single: [[0, 0.02], [500, 0.04], [3000, 0.05]], joint: [[0, 0.02], [1000, 0.04], [6000, 0.05]] },
    standardDeduction: [3000, 8500],
    personalExemption: [1500, 3000],
    dependentExemption: 1000,
    federalIncomeTaxDeductionCap: "unlimited",
  },
  AK: null,
  // Did not adopt the OBBBA standard deduction; keeps the pre-OBBBA federal amount.
  AZ: { brackets: [[0, 0.025]], standardDeduction: [15000, 30000], dependentExemptionCredit: 100 },
  AR: {
    brackets: [[0, 0.02], [4500, 0.039]],
    standardDeduction: [2410, 4820],
    personalExemptionCredit: [29, 58],
    dependentExemptionCredit: 29,
  },
  CA: {
    brackets: { single: [[0, 0.01], [10756, 0.02], [25499, 0.04], [40245, 0.06], [55866, 0.08], [70606, 0.093], [360659, 0.103], [432787, 0.113], [721314, 0.123], [1000000, 0.133]], joint: [[0, 0.01], [21512, 0.02], [50998, 0.04], [80490, 0.06], [111732, 0.08], [141732, 0.093], [721318, 0.103], [865574, 0.113], [1000000, 0.123], [1442628, 0.133]] },
    standardDeduction: [5540, 11080],
    personalExemptionCredit: [149, 298],
    dependentExemptionCredit: 461,
  },
  CO: { brackets: [[0, 0.044]], standardDeduction: "federal" },
  CT: {
    brackets: { single: [[0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]], joint: [[0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]] },
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
  // Retroactive: HB 111 (2025) cut the rate to 5.19% retroactive to Jan 1, 2025.
  GA: { brackets: [[0, 0.0519]], standardDeduction: [12000, 24000], dependentExemption: 4000 },
  HI: {
    brackets: { single: [[0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.1], [325000, 0.11]], joint: [[0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.1], [650000, 0.11]] },
    standardDeduction: [4400, 8800],
    personalExemption: [1144, 2288],
    dependentExemption: 1144,
  },
  // Retroactive: HB 40 (2025) cut the rate to 5.3% retroactive to Jan 1, 2025.
  ID: { brackets: { single: [[4673, 0.053]], joint: [[9346, 0.053]] }, standardDeduction: "federal" },
  IL: { brackets: [[0, 0.0495]], personalExemption: [2850, 5700], dependentExemption: 2850 },
  IN: { brackets: [[0, 0.03]], personalExemption: [1000, 2000], dependentExemption: 1000 },
  // Starting point is federal taxable income (since 2023), so the federal standard deduction applies.
  IA: {
    brackets: [[0, 0.038]],
    standardDeduction: "federal",
    personalExemptionCredit: [40, 80],
    dependentExemptionCredit: 40,
  },
  KS: {
    brackets: { single: [[0, 0.052], [23000, 0.0558]], joint: [[0, 0.052], [46000, 0.0558]] },
    standardDeduction: [3605, 8240],
    personalExemption: [9160, 18320],
    dependentExemption: 2320,
  },
  KY: { brackets: [[0, 0.04]], standardDeduction: [3270, 6540] },
  LA: { brackets: [[0, 0.03]], standardDeduction: [12500, 25000] },
  // Did not adopt the OBBBA standard deduction; keeps the pre-OBBBA federal amount.
  ME: {
    brackets: { single: [[0, 0.058], [26800, 0.0675], [63450, 0.0715]], joint: [[0, 0.058], [53600, 0.0675], [126900, 0.0715]] },
    standardDeduction: [15000, 30000],
    personalExemption: [5150, 10300],
    dependentExemptionCredit: 300,
  },
  // Retroactive: 2025 budget law added 6.25% / 6.5% brackets and a flat standard deduction starting tax year 2025.
  MD: {
    brackets: { single: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575], [500000, 0.0625], [1000000, 0.065]], joint: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575], [600000, 0.0625], [1200000, 0.065]] },
    standardDeduction: [3350, 6700],
    personalExemption: [3200, 6400],
    dependentExemption: 3200,
  },
  MA: { brackets: [[0, 0.05], [1083150, 0.09]], personalExemption: [4400, 8800], dependentExemption: 1000 },
  MI: { brackets: [[0, 0.0425]], personalExemption: [5800, 11600], dependentExemption: 5800 },
  MN: {
    brackets: { single: [[0, 0.0535], [32570, 0.068], [106990, 0.0785], [198630, 0.0985]], joint: [[0, 0.0535], [47620, 0.068], [189180, 0.0785], [330410, 0.0985]] },
    standardDeduction: [14950, 29900],
    dependentExemption: 5200,
  },
  MS: {
    brackets: [[10000, 0.044]],
    standardDeduction: [2300, 4600],
    personalExemption: [6000, 12000],
    dependentExemption: 1500,
  },
  MO: {
    brackets: [[1313, 0.02], [2626, 0.025], [3939, 0.03], [5252, 0.035], [6565, 0.04], [7878, 0.045], [9191, 0.047]],
    standardDeduction: "federal",
    federalIncomeTaxDeductionCap: [5000, 10000],
  },
  MT: {
    brackets: { single: [[0, 0.047], [21100, 0.059]], joint: [[0, 0.047], [42200, 0.059]] },
    standardDeduction: "federal",
  },
  NE: {
    brackets: { single: [[0, 0.0246], [4030, 0.0351], [24120, 0.0501], [38870, 0.052]], joint: [[0, 0.0246], [8040, 0.0351], [48250, 0.0501], [77730, 0.052]] },
    standardDeduction: [8600, 17200],
    personalExemptionCredit: [171, 342],
    dependentExemptionCredit: 171,
  },
  NV: null,
  NH: null,
  NJ: {
    brackets: { single: [[0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.05525], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]], joint: [[0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.05525], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]] },
    personalExemption: [1000, 2000],
    dependentExemption: 1500,
  },
  NM: {
    brackets: { single: [[0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]], joint: [[0, 0.015], [8000, 0.032], [25000, 0.043], [50000, 0.047], [100000, 0.049], [315000, 0.059]] },
    standardDeduction: "federal",
    dependentExemption: 4000,
  },
  NY: {
    brackets: { single: [[0, 0.04], [8500, 0.045], [11700, 0.0525], [13900, 0.055], [80650, 0.06], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]], joint: [[0, 0.04], [17150, 0.045], [23600, 0.0525], [27900, 0.055], [161550, 0.06], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]] },
    standardDeduction: [8000, 16050],
    dependentExemption: 1000,
  },
  NC: { brackets: [[0, 0.0425]], standardDeduction: [12750, 25500] },
  ND: {
    brackets: { single: [[48475, 0.0195], [244825, 0.025]], joint: [[80975, 0.0195], [298075, 0.025]] },
    standardDeduction: "federal",
  },
  // Retroactive: HB 96 (2025) cut the top rate to 3.125% retroactive to Jan 1, 2025.
  OH: { brackets: [[26050, 0.0275], [100000, 0.03125]], personalExemption: [2400, 4800], dependentExemption: 2400 },
  OK: {
    brackets: { single: [[0, 0.0025], [1000, 0.0075], [2500, 0.0175], [3750, 0.0275], [4900, 0.0375], [7200, 0.0475]], joint: [[0, 0.0025], [2000, 0.0075], [5000, 0.0175], [7500, 0.0275], [9800, 0.0375], [14400, 0.0475]] },
    standardDeduction: [6350, 12700],
    personalExemption: [1000, 2000],
    dependentExemption: 1000,
  },
  OR: {
    brackets: { single: [[0, 0.0475], [4400, 0.0675], [11050, 0.0875], [125000, 0.099]], joint: [[0, 0.0475], [8800, 0.0675], [22100, 0.0875], [250000, 0.099]] },
    standardDeduction: [2800, 5600],
    personalExemptionCredit: [250, 500],
    dependentExemptionCredit: 250,
    federalIncomeTaxDeductionCap: [8500, 8500],
  },
  PA: { brackets: [[0, 0.0307]] },
  RI: {
    brackets: [[0, 0.0375], [79900, 0.0475], [181650, 0.0599]],
    standardDeduction: [10900, 21800],
    personalExemption: [5100, 10200],
    dependentExemption: 5100,
  },
  // Did not adopt the OBBBA standard deduction; keeps the pre-OBBBA federal amount.
  SC: {
    brackets: [[0, 0.0], [3560, 0.03], [17830, 0.062]],
    standardDeduction: [15000, 30000],
    dependentExemption: 4790,
  },
  SD: null,
  TN: null,
  TX: null,
  // Retroactive: HB 106 (2025) cut the rate to 4.5% retroactive to Jan 1, 2025.
  UT: { brackets: [[0, 0.045]], federalDeductionCreditRate: 0.06, dependentExemptionCredit: 123 },
  VT: {
    brackets: { single: [[0, 0.0335], [47900, 0.066], [116000, 0.076], [242000, 0.0875]], joint: [[0, 0.0335], [79950, 0.066], [193300, 0.076], [294600, 0.0875]] },
    standardDeduction: [7400, 14850],
    personalExemption: [5100, 10200],
    dependentExemption: 5100,
  },
  VA: {
    brackets: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]],
    standardDeduction: [8500, 17000],
    personalExemption: [930, 1860],
    dependentExemption: 930,
  },
  WA: null,
  WV: {
    brackets: [[0, 0.0222], [10000, 0.0296], [25000, 0.0333], [40000, 0.0444], [60000, 0.0482]],
    personalExemption: [2000, 4000],
    dependentExemption: 2000,
  },
  WI: {
    brackets: { single: [[0, 0.035], [14680, 0.044], [29370, 0.053], [323290, 0.0765]], joint: [[0, 0.035], [19580, 0.044], [39150, 0.053], [431060, 0.0765]] },
    standardDeduction: [13560, 25110],
    personalExemption: [700, 1400],
    dependentExemption: 700,
  },
  WY: null,
};
