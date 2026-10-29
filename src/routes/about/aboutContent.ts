/** Plain-text About copy shared by the About page components and `llms-full.txt`. */

export const MODELED = [
  "Federal ordinary income tax brackets for supported filing statuses and tax years.",
  "Long-term capital gains using 0% / 15% / 20% bands stacked on ordinary taxable income.",
  "Employee payroll taxes on W-2 wages, including Social Security wage-base limits and Additional Medicare thresholds.",
  "Self-employment tax on Schedule C–style income, with the deductible half of SE tax.",
  "Nonrefundable federal credits entered by the user (or child/other-dependent defaults), capped against income tax — no phaseouts.",
  "Pre-tax payroll benefits, standard deductions, and a single user-entered itemized deduction amount.",
  "State income tax for all 50 states and DC: state brackets on federal AGI after the state standard deduction and flat personal / dependent exemptions (or exemption credits), plus capped federal-tax deductions where a state allows them.",
];

export const OMITTED = [
  "Local and city income taxes, state credits and phaseouts, state-specific income adjustments and itemized deductions, and special regimes such as Washington’s capital gains tax.",
  "Credit phaseouts, refundable credit excess, AMT, Form 8960 / NIIT, qualified business income (section 199A), and other specialized regimes.",
  "Employer-side payroll taxes and full W-4 / state withholding worksheets (see the simplified paycheck estimator on Withholding).",
  "Qualified-dividend, collectibles, or other special capital-gain edge cases.",
];

export const ASSUMPTIONS = [
  "Payroll pretax (401(k), HSA, FSA) applies to that spouse’s W-2 wages; deductible IRA can reduce self-employment income.",
  "Deductions are applied to ordinary income first and then to long-term gains.",
  "The charts show teaching-oriented flows and slices, not a literal Form 1040 line order.",
  "Planning-year figures may be directional before final IRS guidance is published.",
  "State rules come from Tax Foundation’s January 1 tables plus known retroactive changes. Married-separate and head-of-household filers use a state’s single schedule unless the state follows the federal standard deduction.",
];

export const PROVENANCE =
  "The supported tax years in the app are sourced from federal bracket, deduction, long-term capital-gain, and payroll-tax tables encoded in the app itself. Final-year values reflect published inflation adjustments; planning-year values are labeled in the interface so you can distinguish them from final filing guidance.";

export const GLOSSARY = [
  {
    term: "Effective tax rate",
    definition: "In this app: federal plus state income tax, divided by total income. Payroll tax is not included.",
  },
  {
    term: "Take-home pay",
    definition: "Gross income minus modeled pre-tax benefits, federal and state income tax, and payroll tax.",
  },
  {
    term: "Ordinary taxable income",
    definition: "Wages, other ordinary income, and short-term gains remaining after modeled deductions.",
  },
  {
    term: "Long-term taxable income",
    definition: "Long-term capital gains remaining after any deduction that is left over after reducing ordinary income.",
  },
];

export const DISCLAIMER =
  "For education only, not tax advice. If you need filing guidance for a real return, consult a qualified CPA, enrolled agent, or tax attorney.";
