import type { StateYearValues } from "./types";

/**
 * 2024 state individual income tax rules (rates, brackets, standard deduction, exemptions).
 * Source: Tax Foundation, rates as of January 1, 2024 — https://taxfoundation.org/data/all/state/state-income-tax-rates-2024/
 * Entries marked "Retroactive" were changed after that snapshot. `null` = no broad-based income tax.
 */
export const STATE_VALUES_2024: StateYearValues = {
  AL: {
    brackets: { single: [[0, 0.02], [500, 0.04], [3000, 0.05]], joint: [[0, 0.02], [1000, 0.04], [6000, 0.05]] },
    standardDeduction: [3000, 8500],
    personalExemption: [1500, 3000],
    dependentExemption: 1000,
    federalIncomeTaxDeductionCap: "unlimited",
  },
  AK: null,
  AZ: { brackets: [[0, 0.025]], standardDeduction: "federal", dependentExemptionCredit: 100 },
  AR: {
    brackets: [[0, 0.02], [4400, 0.04], [8800, 0.044]],
    standardDeduction: [2340, 4680],
    personalExemptionCredit: [29, 58],
    dependentExemptionCredit: 29,
  },
  CA: {
    brackets: { single: [[0, 0.01], [10412, 0.02], [24684, 0.04], [38959, 0.06], [54081, 0.08], [68350, 0.093], [349137, 0.103], [418961, 0.113], [698271, 0.123], [1000000, 0.133]], joint: [[0, 0.01], [20824, 0.02], [49368, 0.04], [77918, 0.06], [108162, 0.08], [136700, 0.093], [698274, 0.103], [837922, 0.113], [1000000, 0.123], [1396542, 0.133]] },
    standardDeduction: [5363, 10726],
    personalExemptionCredit: [144, 288],
    dependentExemptionCredit: 446,
  },
  // Retroactive: TABOR-triggered temporary rate of 4.25% for tax year 2024.
  CO: { brackets: [[0, 0.0425]], standardDeduction: "federal" },
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
  // Retroactive: HB 1015 (2024) cut the rate to 5.39% retroactive to Jan 1, 2024.
  GA: { brackets: [[0, 0.0539]], standardDeduction: [12000, 24000], dependentExemption: 3000 },
  HI: {
    brackets: { single: [[0, 0.014], [2400, 0.032], [4800, 0.055], [9600, 0.064], [14400, 0.068], [19200, 0.072], [24000, 0.076], [36000, 0.079], [48000, 0.0825], [150000, 0.09], [175000, 0.1], [200000, 0.11]], joint: [[0, 0.014], [4800, 0.032], [9600, 0.055], [19200, 0.064], [28800, 0.068], [38400, 0.072], [48000, 0.076], [72000, 0.079], [96000, 0.0825], [300000, 0.09], [350000, 0.1], [400000, 0.11]] },
    standardDeduction: [2200, 4400],
    personalExemption: [1144, 2288],
    dependentExemption: 1144,
  },
  // Retroactive: HB 521 (2024) cut the rate to 5.695% retroactive to Jan 1, 2024.
  ID: { brackets: { single: [[4489, 0.05695]], joint: [[8978, 0.05695]] }, standardDeduction: "federal" },
  IL: { brackets: [[0, 0.0495]], personalExemption: [2775, 5550], dependentExemption: 2775 },
  IN: { brackets: [[0, 0.0305]], personalExemption: [1000, 2000], dependentExemption: 1000 },
  // Starting point is federal taxable income (since 2023), so the federal standard deduction applies.
  IA: {
    brackets: { single: [[0, 0.044], [6210, 0.0482], [31050, 0.057]], joint: [[0, 0.044], [12420, 0.0482], [62100, 0.057]] },
    standardDeduction: "federal",
    personalExemptionCredit: [40, 80],
    dependentExemptionCredit: 40,
  },
  // Retroactive: SB 1 (2024 special session) moved to 5.2% / 5.58% brackets and raised the standard deduction and exemptions retroactive to Jan 1, 2024.
  KS: {
    brackets: { single: [[0, 0.052], [23000, 0.0558]], joint: [[0, 0.052], [46000, 0.0558]] },
    standardDeduction: [3605, 8240],
    personalExemption: [9160, 18320],
    dependentExemption: 2320,
  },
  KY: { brackets: [[0, 0.04]], standardDeduction: [3160, 6320] },
  LA: {
    brackets: { single: [[0, 0.0185], [12500, 0.035], [50000, 0.0425]], joint: [[0, 0.0185], [25000, 0.035], [100000, 0.0425]] },
    personalExemption: [4500, 9000],
    dependentExemption: 1000,
  },
  ME: {
    brackets: { single: [[0, 0.058], [26050, 0.0675], [61600, 0.0715]], joint: [[0, 0.058], [52100, 0.0675], [123250, 0.0715]] },
    standardDeduction: "federal",
    personalExemption: [5000, 10000],
    dependentExemptionCredit: 300,
  },
  MD: {
    brackets: { single: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575]], joint: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575]] },
    standardDeduction: [2550, 5150],
    personalExemption: [3200, 6400],
    dependentExemption: 3200,
  },
  MA: { brackets: [[0, 0.05], [1000000, 0.09]], personalExemption: [4400, 8800], dependentExemption: 1000 },
  MI: { brackets: [[0, 0.0425]], personalExemption: [5600, 11200], dependentExemption: 5600 },
  MN: {
    brackets: { single: [[0, 0.0535], [31690, 0.068], [104090, 0.0785], [193240, 0.0985]], joint: [[0, 0.0535], [46330, 0.068], [184040, 0.0785], [321450, 0.0985]] },
    standardDeduction: [14575, 29150],
    dependentExemption: 5050,
  },
  MS: {
    brackets: [[10000, 0.047]],
    standardDeduction: [2300, 4600],
    personalExemption: [6000, 12000],
    dependentExemption: 1500,
  },
  MO: {
    brackets: [[1273, 0.02], [2546, 0.025], [3819, 0.03], [5092, 0.035], [6365, 0.04], [7638, 0.045], [8911, 0.048]],
    standardDeduction: "federal",
    federalIncomeTaxDeductionCap: [5000, 10000],
  },
  MT: {
    brackets: { single: [[0, 0.047], [20500, 0.059]], joint: [[0, 0.047], [41000, 0.059]] },
    standardDeduction: "federal",
  },
  NE: {
    brackets: { single: [[0, 0.0246], [3700, 0.0351], [22170, 0.0501], [35730, 0.0584]], joint: [[0, 0.0246], [7390, 0.0351], [44350, 0.0501], [71460, 0.0584]] },
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
  NC: { brackets: [[0, 0.045]], standardDeduction: [12750, 25500] },
  ND: {
    brackets: { single: [[44725, 0.0195], [225975, 0.025]], joint: [[74750, 0.0195], [275100, 0.025]] },
    standardDeduction: "federal",
  },
  OH: { brackets: [[26050, 0.0275], [92150, 0.035]], personalExemption: [2400, 4800], dependentExemption: 2500 },
  OK: {
    brackets: { single: [[0, 0.0025], [1000, 0.0075], [2500, 0.0175], [3750, 0.0275], [4900, 0.0375], [7200, 0.0475]], joint: [[0, 0.0025], [2000, 0.0075], [5000, 0.0175], [7500, 0.0275], [9800, 0.0375], [12200, 0.0475]] },
    standardDeduction: [6350, 12700],
    personalExemption: [1000, 2000],
    dependentExemption: 1000,
  },
  OR: {
    brackets: { single: [[0, 0.0475], [4300, 0.0675], [10750, 0.0875], [125000, 0.099]], joint: [[0, 0.0475], [8600, 0.0675], [21500, 0.0875], [250000, 0.099]] },
    standardDeduction: [2745, 5495],
    personalExemptionCredit: [249, 498],
    dependentExemptionCredit: 249,
    federalIncomeTaxDeductionCap: [8250, 8250],
  },
  PA: { brackets: [[0, 0.0307]] },
  RI: {
    brackets: [[0, 0.0375], [77450, 0.0475], [176050, 0.0599]],
    standardDeduction: [10550, 21150],
    personalExemption: [4950, 9900],
    dependentExemption: 4950,
  },
  SC: { brackets: [[0, 0.0], [3460, 0.03], [17330, 0.064]], standardDeduction: "federal", dependentExemption: 4610 },
  SD: null,
  TN: null,
  TX: null,
  // Retroactive: HB 106 (2024) cut the rate to 4.55% retroactive to Jan 1, 2024.
  UT: { brackets: [[0, 0.0455]], federalDeductionCreditRate: 0.06, dependentExemptionCredit: 116 },
  VT: {
    brackets: { single: [[0, 0.0335], [45400, 0.066], [110050, 0.076], [229550, 0.0875]], joint: [[0, 0.0335], [75850, 0.066], [183400, 0.076], [279450, 0.0875]] },
    standardDeduction: [7000, 14050],
    personalExemption: [4850, 9700],
    dependentExemption: 4850,
  },
  VA: {
    brackets: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]],
    standardDeduction: [8000, 16000],
    personalExemption: [930, 1860],
    dependentExemption: 930,
  },
  WA: null,
  WV: {
    brackets: [[0, 0.0236], [10000, 0.0315], [25000, 0.0354], [40000, 0.0472], [60000, 0.0512]],
    personalExemption: [2000, 4000],
    dependentExemption: 2000,
  },
  WI: {
    brackets: { single: [[0, 0.035], [14320, 0.044], [28640, 0.053], [315310, 0.0765]], joint: [[0, 0.035], [19090, 0.044], [38190, 0.053], [420420, 0.0765]] },
    standardDeduction: [13230, 24490],
    personalExemption: [700, 1400],
    dependentExemption: 700,
  },
  WY: null,
};
