# Tax page `ConfigItem` registry

This document lists every [`ConfigItem`](../src/lib/config/taxPage/types.ts) returned by [`getConfigItems`](../src/lib/config/taxPage/taxPage.config.ts): line-item inputs, Sankey/Mekko nodes, and summary metrics. It is a maintainer map of **ids and wiring**, not tax law documentation.

**Line items only:** [`getInputItems`](../src/lib/config/taxPage/taxPage.config.ts) filters to items that include an `input` block (`"input" in item`).

**Computed values:** [`calculateAllConfigValues`](../src/lib/tax/calc/calculateTaxes.ts) sets `computedValue = item.calculate?.(…) ?? 0` for every row.

**Maintenance:** After editing factories, refresh this file and run `rg 'id: "' src/lib/config/taxPage` to check for duplicate ids.

---

## Assembly order

`getConfigItems` concatenates factories in this order (matches [`taxPage.config.ts`](../src/lib/config/taxPage/taxPage.config.ts)):

1. `makeIncomeInputsConfig`
2. `makePretaxInputsConfig`
3. `makeDeductionInputsConfig`
4. `makePretaxDeductionsNodesConfig`
5. `makeCreditInputsConfig`
6. `makeIncomeNodesConfig`
7. `makeDeductionAmountNodesConfig`
8. `make0taxIncomeNodesConfig`
9. `makePayrollTaxInputConfig`
10. `makePretaxIncomeNodesConfig`
11. `makeTaxNodesConfig`
12. `makeMekkoSliceNodesConfig`
13. `getBracketItems`
14. `makeEndingNodesConfig`

---

## Legend (table columns)

| Column | Meaning |
| --- | --- |
| **input** | Has `input` (form line-item source). |
| **calc** | Has top-level `calculate` (non-optional on that row for pipeline rows). |
| **sankey.links** | `sankey.links` array is present and non-empty (drives [`TaxSankey`](../src/components/tax/TaxSankey.tsx) edges). |
| **sankey.node** | `sankey.node` present (node position when the id appears in the link graph). |
| **mekko** | Numeric `mekko.row` when set (Mekko band ordering in [`buildMekkoFromConfig`](../src/lib/tax/charts/buildMekko.ts)). |
| **summary** | Has `summary` (eligible for [`buildSummaryFromConfig`](../src/lib/tax/charts/buildSummary.ts) if `chartRole` maps via [`asSummaryChartRole`](../src/lib/config/taxPage/chart/chartRole.ts)). |
| **description** | Verbatim `description` field, or `—` if absent. |

---

## `inputConfigs/incomeInputs.ts` — `makeIncomeInputsConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| income-ordinary-wages | Y | — | — | — | — | — | Wages reported on Form W-2 |
| income-ordinary-selfEmployment | Y | — | — | — | — | — | Self-employment income (net of expenses) |
| income-ordinary-shortTermCapGains | Y | — | — | — | — | — | Capital gains held one year or less |
| income-ordinary-other | Y | — | — | — | — | — | Other ordinary income (rent, royalties, etc.) |
| income-longTermCapGains | Y | — | — | — | — | — | Capital gains held longer than one year |

---

## `inputConfigs/pretaxInputs.ts` — `makePretaxInputsConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| input-pretax-401K | Y | Y | Y | Y | — | — | Elective deferrals from W-2 pay |
| input-pretax-hsa | Y | Y | Y | Y | — | — | Payroll HSA contributions |
| input-pretax-otherPretax | Y | Y | Y | Y | — | — | Miscellaneous payroll amounts taken pre-tax |
| input-pretax-traditionalIra | Y | Y | Y | Y | — | — | Traditional IRA (deductible) |

Each pretax input also sets `kindDetail` / validators as in source.

---

## `inputConfigs/deductionInputs.ts` — `makePayrollTaxInputConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| payrollTax | — | Y | Y | Y | — | Y | — |

---

## `inputConfigs/deductionInputs.ts` — `makeDeductionInputsConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| standard | — | Y | Y | — | — | Y | Standard deduction based on filing status |
| Itemized Deductions | — | Y | Y | — | — | Y | Itemized deductions based on filing status |
| deduction-salt | Y | — | — | — | — | — | State and local taxes you elect to deduct |
| deduction-medicalDental | Y | — | — | — | — | — | Medical and dental expenses (7.5% of AGI threshold applied at calculation) |
| deduction-mortgageInterest | Y | — | — | — | — | — | Home mortgage interest |
| deduction-charitable | Y | — | — | — | — | — | Cash and non-cash contributions to qualified charities |

---

## `inputConfigs/creditInputs.ts` — `makeCreditInputsConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| input-credit-childTax | — | Y | — | Y | — | — | Calculated from qualifying children and other dependents entered in Settings; maximum per dependent depends on tax year. |
| input-credit-education | Y | Y | — | Y | — | — | American opportunity credit and/or lifetime learning credit |
| retirementSavingsContributions | Y | Y | — | Y | — | — | Saver's credit for eligible retirement contributions |
| input-credit-other | Y | Y | — | Y | — | — | Any other federal income tax credit |

---

## `nodes/pretaxNodes.ts` — `makePretaxDeductionsNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ordinaryGrossIncome | — | Y | — | — | — | — | — |
| preTaxTotal | — | Y | — | — | — | — | — |
| preTax401k | — | Y | — | Y | — | — | — |
| preTaxHsa | — | Y | — | Y | — | — | — |
| preTaxOther | — | Y | — | Y | — | — | — |
| traditionalIra | — | Y | — | Y | — | — | — |
| wagesAfterPretax | — | Y | — | Y | — | — | — |

---

## `nodes/pretaxNodes.ts` — `makePretaxIncomeNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pretaxIncome | — | — | Y | Y | — | — | — |
| pretaxTakehome | — | — | Y | Y | — | — | — |

Link values for this chain are owned by the `pretaxDeductions` item in `incomeNodes` (same `sankey.links` block).

---

## `nodes/incomeNodes.ts` — `makeIncomeNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| totalIncome | — | Y | — | — | — | Y | — |
| wages | — | Y | Y | Y | — | — | — |
| longTermCapGains | — | Y | Y | Y | — | — | — |
| pretaxDeductions | — | Y | Y | Y | — | Y | — |
| selfEmployment | — | Y | — | — | — | — | — |
| ordinaryIncome | — | Y | — | — | — | — | — |
| shortTermCapGains | — | Y | — | — | — | — | — |
| shortTermCapGainsGrossIncome | — | Y | — | — | — | — | — |
| longTermCapitalGainsGrossIncome | — | Y | — | Y | — | — | — |

**Notes:** `shortTermCapGains` and `shortTermCapGainsGrossIncome` share the same `calculate` (`shortTermCapGains` metric); useful if Sankey or future UI needs a gross STCG label without changing the primary row.

---

## `nodes/deductionNodes.ts` — `makeDeductionAmountNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ordinaryTaxableIncome | — | — | — | Y | — | Y | — |
| longTermTaxableIncome | — | Y | — | Y | — | Y | — |
| taxableIncome | — | Y | — | — | — | Y | — |
| federalTaxCreditsApplied | — | Y | — | — | — | Y | — |
| socialSecurityTax | — | Y | — | Y | — | — | — |
| medicareTax | — | Y | — | Y | — | — | — |

---

## `nodes/deductionNodes.ts` — `make0taxIncomeNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| standardDeduction | — | Y | Y | Y | — | — | — |
| itemizedDeductions | — | Y | Y | Y | — | — | — |

---

## `nodes/deductionNodes.ts` — `makeMekkoSliceNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mekkoPretaxDeferrals | — | Y | — | — | 0 | — | — |
| mekkoPayrollTaxFromShield | — | Y | — | — | 1 | — | — |
| mekkoSelfEmploymentTaxDeduction | — | Y | — | — | 2 | — | — |
| mekkoDeductionShieldNet | — | Y | — | — | 3 | — | — |

**Implementation note:** [`buildMekkoFromConfig`](../src/lib/tax/charts/buildMekko.ts) filters with `i.mekko?.row`, which treats **`mekko.row === 0` as falsy**, so the **pre-tax deferrals** band may be omitted when deferrals are positive. Consider changing the filter to `i.mekko != null && Number.isFinite(i.mekko.row)` if that band should appear.

---

## `nodes/taxNodes.ts` — `makeTaxNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sankeyOrdinaryToPayrollTax | — | Y | Y | — | — | — | — |
| selfEmploymentTax | — | Y | Y | — | — | Y | — |

---

## `nodes/taxBracketNodes.ts` — `getBracketItems`

For each federal **ordinary** bracket index `i` (from `taxData.federalBrackets[filingStatus]`), five ids are emitted:

| id pattern | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- |
| `bracket-{i}-node` | — | — | Y | — | — | — |
| `bracket-{i}-income` | Y | Y | — | Y | Y | — |
| `bracket-{i}-keep` | Y | Y | — | — | — | — |
| `bracket-{i}-credits` | Y | Y | — | — | — | — |
| `bracket-{i}-tax` | Y | Y | — | — | — | — |

**LTCG block** (fixed ids after the loop):

| id | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- |
| ltcg-income | Y | Y | Y | Y | — | — |
| ltcg-tax | Y | Y | — | — | — | — |
| ltcg-credits | Y | Y | — | — | — | — |
| ltcg-keep | Y | Y | — | — | — | — |

---

## `nodes/endingNodes.ts` — `makeEndingNodesConfig`

| id | input | calc | sankey.links | sankey.node | mekko | summary | description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| federalPayrollTaxes | — | — | — | Y | — | — | — |
| takeHomePay | — | Y | — | Y | — | Y | — |
| federalIncomeTax | — | Y | — | Y | — | Y | — |
| effectiveTaxRate | — | Y | — | — | — | Y | — |

---

## Review and recommendations

### Removed dead rows (changelog)

The following ids were removed as unused by Sankey/Mekko/summary and duplicate of other rows:

- **`payrollTaxWages`** — duplicate `calculate` of `payrollTax` with no `sankey.links`.
- **`federalTaxCredits`** — `sankey.node` only; no `sankey.links` referenced this id, so it never entered the Sankey graph.
- **`sankeyOrdinaryToFederalTaxCredits`**, **`sankeyFederalTaxCreditsToTakeHome`** — had `calculate` but no `sankey` payload, so they never contributed links in [`TaxSankey`](../src/components/tax/TaxSankey.tsx).

[`docs/sankey-links.md`](./sankey-links.md) was updated to match the bracket/LTCG credit ribbon topology.

### Naming consistency

- **`Itemized Deductions`** (id with a space) remains for compatibility; renaming to kebab-case would require auditing persisted form data and `findInputById` / row keys — treat as a breaking change if done.

### Description and `kindDetail` accuracy (optional follow-ups)

- **401(k) row:** description says “W-2 pay”; subcategories include **403(b)** and **457(b)** — consider one line that names all three plan types.
- **Traditional IRA:** clarify **not** payroll deferral; note **phase-outs / active participation** if still out of scope in calculations.
- **Charitable `kindDetail`:** “60% of AGI” is cash-only; add a short `modelingNote` for non-cash limits if the model stays simplified.
- **Saver’s credit:** align `description` / `limitNote` with the cap source (`yearValues.caps.credits` and validator).
- **Pipeline nodes:** most rows above have **no `description`**; adding short strings would improve Sankey tooltips where `item.description` is passed through.

### Maintenance

- Re-run **`npm run typecheck`** (or `pnpm typecheck`) after registry edits.
- Optional: CI script to fail on duplicate `id:` literals across `src/lib/config/taxPage`.
