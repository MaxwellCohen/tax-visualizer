# Sankey link topology

Mermaid diagram of Sankey **source → target** edges defined by the Sankey topology catalog in [`sankeyTopology.ts`](../src/lib/tax/charts/sankeyTopology.ts). Parallel links with the same endpoints are drawn once. Ordinary bracket slices use `bracket-{i}-income` for each index `i` derived from calculated config bracket ids.

**Credits layout:** Federal credits that reduce tax show as **per-bracket** and **LTCG** ribbons from each rate hub to `takeHomePay` (`bracket-{i}-credits` and `ltcg-credits`), with link values from the shared tax evaluation context that also computes `federalTaxCreditsApplied`. Credit **inputs** use a Sankey **node** on the credits row/col from the topology catalog for styling; they do **not** define separate hub edges into a single `federalTaxCredits` config node (that hub was removed as unused).

```mermaid
flowchart LR
  subgraph incomeIn["Income inputs"]
    iw["income-ordinary-wages"]
    ise["income-ordinary-selfEmployment"]
    ist["income-ordinary-shortTermCapGains"]
    io["income-ordinary"]
    il["income-longTermCapGains"]
  end

  subgraph wagesLtcg["Wages / LTCG nodes"]
    w["wages"]
    lcg["longTermCapGains"]
  end

  subgraph pretaxChain["Pretax deferrals"]
    pd["pretaxDeductions"]
    pi["pretaxIncome"]
    pth["pretaxTakehome"]
  end

  subgraph oti["Tax base"]
    otiN["ordinaryTaxableIncome"]
    lti["longTermTaxableIncome"]
  end

  subgraph deductions["Deductions col 3"]
    std["standardDeduction"]
    item["itemizedDeductions"]
  end

  subgraph payrollSe["Payroll / SE hub"]
    pt["payrollTax"]
  end

  subgraph ordBands["Ordinary brackets (i = 0..n-1)"]
    bi["bracket-i-income"]
  end

  subgraph ltcgBand["LTCG band"]
    ltiNode["ltcg-income"]
  end

  subgraph sinks["Sinks"]
    thp["takeHomePay"]
    fit["federalIncomeTax"]
    fpt["federalPayrollTaxes"]
  end

  iw --> pd
  iw --> w
  ise --> w
  ist --> w
  io --> w
  il --> lcg

  w --> otiN
  w --> pd
  pd --> pi
  pi --> pth
  pth --> thp

  lcg --> lti
  lti --> ltiNode
  ltiNode --> fit
  ltiNode --> thp

  otiN --> bi
  bi --> thp
  bi --> fit

  otiN --> pt
  pt --> fpt

  otiN --> std
  std --> thp

  otiN --> item
  item --> thp
```



## Implementation notes

- Pretax input ids each register `wages` → `pretaxDeductions` in the topology catalog (same edge, multiple calculated rows).
- Payroll and SE: a single ribbon **`ordinaryTaxableIncome` → `payrollTax`** uses `sankeyOrdinaryToPayrollTax` (payroll + SE). **`payrollTax` → `federalPayrollTaxes`** splits into wage FICA (`payrollTax`) and SE (`selfEmploymentTax`) rows so link values still balance at the hub.
- Each federal ordinary bracket adds nodes `bracket-{i}-node`, `bracket-{i}-income`, `bracket-{i}-keep`, `bracket-{i}-credits`, `bracket-{i}-tax`; Sankey links use `bracket-{i}-income` as the hub for flows to `takeHomePay` (keep and credits) and `federalIncomeTax` (tax). LTCG tax flows `ltcg-income` → `federalIncomeTax`; LTCG keep and credits flow to `takeHomePay`.
- **Federal income tax node:** Bracket and LTCG tax ribbons terminate at `federalIncomeTax` (gross tax per slice); the node’s summary value is still net federal income tax after credits (link sums may not match that number). Credits to take-home are carried on **`bracket-{i}-credits`** and **`ltcg-credits`** links in [`taxBracketNodes.ts`](../src/lib/config/taxPage/nodes/taxBracketNodes.ts), not via a separate config-only bridge row.
- Credit **input** rows keep a Sankey **node** in the topology catalog for styling; ribbon amounts for credits applied come from bracket/LTCG slice config, aligned with `federalTaxCreditsApplied` in [`deductionNodes.ts`](../src/lib/config/taxPage/nodes/deductionNodes.ts).
- Refundable credit amounts beyond gross federal tax are not shown as a separate ribbon (same cap as `federalTaxCreditsApplied`).

**Implementation:** [`buildSankeyLayout.ts`](../src/lib/tax/charts/buildSankeyLayout.ts) merges calculated config values with the topology catalog and returns the d3-sankey graph rendered by the Solid view.
