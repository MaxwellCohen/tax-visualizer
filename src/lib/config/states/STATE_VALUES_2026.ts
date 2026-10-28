import type { StateYearValues } from "./types";

/**
 * 2026 state individual income tax rules (rates, brackets, standard deduction, exemptions).
 * Source: Tax Foundation, rates as of January 1, 2026 — https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
 * Entries marked "Retroactive" were changed after that snapshot. `null` = no broad-based income tax.
 */
export const STATE_VALUES_2026: StateYearValues = {
  AL: {
    brackets: { single: [[0, 0.02], [500, 0.04], [3000, 0.05]], joint: [[0, 0.02], [1000, 0.04], [6000, 0.05]] },
    standardDeduction: [3000, 8500],
    personalExemption: [1500, 3000],
    dependentExemption: 1000,
    federalIncomeTaxDeductionCap: "unlimited",
  },
  AK: null,
  AZ: { brackets: [[0, 0.025]], standardDeduction: [8350, 16700], dependentExemptionCredit: 100 },
  AR: {
    brackets: [[0, 0.02], [4600, 0.039]],
    standardDeduction: [2470, 4940],
    personalExemptionCredit: [29, 58],
    dependentExemptionCredit: 29,
  },
  CA: {
    brackets: { single: [[0, 0.01], [11079, 0.02], [26264, 0.04], [41452, 0.06], [57542, 0.08], [72724, 0.093], [371479, 0.103], [445771, 0.113], [742953, 0.123], [1000000, 0.133]], joint: [[0, 0.01], [22158, 0.02], [52528, 0.04], [82904, 0.06], [115084, 0.08], [145448, 0.093], [742958, 0.103], [891542, 0.113], [1000000, 0.123], [1485906, 0.133]] },
    standardDeduction: [5540, 11080],
    personalExemptionCredit: [153, 306],
    dependentExemptionCredit: 153,
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
  // Retroactive: HB 463 (2026) set the rate at 4.99% for tax year 2026.
  GA: { brackets: [[0, 0.0499]], standardDeduction: [12000, 24000], dependentExemption: 4000 },
  HI: {
    brackets: { single: [[0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.1], [325000, 0.11]], joint: [[0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.1], [650000, 0.11]] },
    standardDeduction: [4400, 8800],
    personalExemption: [1144, 2288],
    dependentExemption: 1144,
  },
  ID: { brackets: { single: [[4811, 0.053]], joint: [[9622, 0.053]] }, standardDeduction: "federal" },
  IL: { brackets: [[0, 0.0495]], personalExemption: [2925, 5850], dependentExemption: 2925 },
  IN: { brackets: [[0, 0.0295]], personalExemption: [1000, 2000], dependentExemption: 1000 },
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
  KY: { brackets: [[0, 0.035]], standardDeduction: [3360, 3360] },
  LA: { brackets: [[0, 0.03]], standardDeduction: [12875, 25750] },
  ME: {
    brackets: { single: [[0, 0.058], [27399, 0.0675], [64849, 0.0715]], joint: [[0, 0.058], [54849, 0.0675], [129749, 0.0715]] },
    standardDeduction: [8350, 16700],
    personalExemption: [5300, 10600],
    dependentExemptionCredit: 305,
  },
  MD: {
    brackets: { single: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575], [500000, 0.0625], [1000000, 0.065]], joint: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575], [600000, 0.0625], [1200000, 0.065]] },
    standardDeduction: [3350, 6700],
    personalExemption: [3200, 6400],
    dependentExemption: 3200,
  },
  MA: { brackets: [[0, 0.05], [1083150, 0.09]], personalExemption: [4400, 8800], dependentExemption: 1000 },
  MI: { brackets: [[0, 0.0425]], personalExemption: [5900, 11800], dependentExemption: 5900 },
  MN: {
    brackets: { single: [[0, 0.0535], [33310, 0.068], [109430, 0.0785], [203150, 0.0985]], joint: [[0, 0.0535], [48700, 0.068], [193480, 0.0785], [337930, 0.0985]] },
    standardDeduction: [15300, 30600],
    dependentExemption: 5300,
  },
  MS: {
    brackets: [[10000, 0.04]],
    standardDeduction: [2300, 4600],
    personalExemption: [6000, 12000],
    dependentExemption: 1500,
  },
  MO: {
    brackets: [[1348, 0.02], [2696, 0.025], [4044, 0.03], [5392, 0.035], [6740, 0.04], [8088, 0.045], [9436, 0.047]],
    standardDeduction: "federal",
    federalIncomeTaxDeductionCap: [5000, 10000],
  },
  MT: {
    brackets: { single: [[0, 0.047], [47500, 0.0565]], joint: [[0, 0.047], [95000, 0.0565]] },
    standardDeduction: "federal",
  },
  NE: {
    brackets: { single: [[0, 0.0246], [4130, 0.0351], [24760, 0.0455]], joint: [[0, 0.0246], [8250, 0.0351], [49530, 0.0455]] },
    standardDeduction: [8850, 17700],
    personalExemptionCredit: [176, 352],
    dependentExemptionCredit: 176,
  },
  NV: null,
  NH: null,
  NJ: {
    brackets: { single: [[0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.0553], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]], joint: [[0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.0553], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]] },
    personalExemption: [1000, 2000],
    dependentExemption: 1500,
  },
  NM: {
    brackets: { single: [[0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]], joint: [[0, 0.015], [8000, 0.032], [25000, 0.043], [50000, 0.047], [100000, 0.049], [315000, 0.059]] },
    standardDeduction: "federal",
    dependentExemption: 4000,
  },
  NY: {
    brackets: { single: [[0, 0.039], [8500, 0.044], [11700, 0.0515], [13900, 0.054], [80650, 0.059], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]], joint: [[0, 0.039], [17150, 0.044], [23600, 0.0515], [27900, 0.054], [161550, 0.059], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]] },
    standardDeduction: [8000, 16050],
    dependentExemption: 1000,
  },
  NC: { brackets: [[0, 0.0399]], standardDeduction: [12750, 25500] },
  ND: {
    brackets: { single: [[48475, 0.0195], [244825, 0.025]], joint: [[80975, 0.0195], [298075, 0.025]] },
    standardDeduction: "federal",
  },
  OH: { brackets: [[26050, 0.0275]], personalExemption: [2400, 4800], dependentExemption: 2400 },
  OK: {
    brackets: { single: [[3750, 0.025], [4900, 0.035], [7200, 0.045]], joint: [[7500, 0.025], [9800, 0.035], [14400, 0.045]] },
    standardDeduction: [6350, 12700],
    personalExemption: [1000, 2000],
    dependentExemption: 1000,
  },
  // 2026 Oregon cap not yet published; 2025 cap carried forward.
  OR: {
    brackets: { single: [[0, 0.0475], [4550, 0.0675], [11400, 0.0875], [125000, 0.099]], joint: [[0, 0.0475], [9100, 0.0675], [22800, 0.0875], [250000, 0.099]] },
    standardDeduction: [2910, 5820],
    personalExemptionCredit: [256, 512],
    dependentExemptionCredit: 256,
    federalIncomeTaxDeductionCap: [8500, 8500],
  },
  PA: { brackets: [[0, 0.0307]] },
  RI: {
    brackets: [[0, 0.0375], [82050, 0.0475], [186450, 0.0599]],
    standardDeduction: [11200, 22400],
    personalExemption: [5250, 10500],
    dependentExemption: 5250,
  },
  SC: { brackets: [[0, 0.0], [3640, 0.03], [18230, 0.06]], standardDeduction: [8350, 16700], dependentExemption: 4930 },
  SD: null,
  TN: null,
  TX: null,
  // Retroactive: SB 60 (2026) cut the rate to 4.45% retroactive to Jan 1, 2026.
  UT: { brackets: [[0, 0.0445]], federalDeductionCreditRate: 0.06, dependentExemptionCredit: 127 },
  VT: {
    brackets: { single: [[0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]], joint: [[0, 0.0335], [82500, 0.066], [199450, 0.076], [304000, 0.0875]] },
    standardDeduction: [7650, 15300],
    personalExemption: [5300, 10600],
    dependentExemption: 5300,
  },
  VA: {
    brackets: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]],
    standardDeduction: [8750, 17500],
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
    brackets: { single: [[0, 0.035], [15110, 0.044], [51950, 0.053], [332720, 0.0765]], joint: [[0, 0.035], [20150, 0.044], [69260, 0.053], [443630, 0.0765]] },
    standardDeduction: [13960, 25840],
    personalExemption: [700, 1400],
    dependentExemption: 700,
  },
  WY: null,
};
