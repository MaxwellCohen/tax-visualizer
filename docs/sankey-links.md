# Sankey link topology

Mermaid diagram of Sankey **source → target** edges defined under `[src/lib/config/page](../src/lib/config/page)`. Parallel links with the same endpoints are drawn once. Ordinary bracket slices use `bracket-i-income` for each index `i` from `[getBracketItems](../src/lib/config/page/taxBracketNodes.ts)`.

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

  subgraph deductions["Deductions"]
    std["standardDeduction"]
    item["itemizedDeductions"]
  end

  subgraph payrollSe["Payroll / SE"]
    pt["payrollTax"]
    setx["selfEmploymentTax"]
  end

  subgraph credits["Credits"]
    ctc["input-credit-childTax"]
    edu["input-credit-education"]
    sav["retirementSavingsContributions"]
    oth["input-credit-other"]
    ftc["federalTaxCredits"]
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
    fset["federalSelfEmploymentTaxes"]
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

  otiN --> setx
  setx --> fset

  otiN --> std
  std --> thp

  otiN --> item

  ctc --> ftc
  edu --> ftc
  sav --> ftc
  oth --> ftc
  ftc --> fit
```



## Implementation notes

- Pretax inputs each register `wages` → `pretaxDeductions` (same edge, multiple config rows).
- Payroll: `ordinaryTaxableIncome` → `payrollTax` → `federalPayrollTaxes` (via `payrollTaxWages` and `payrollTax` items).
- `itemizedDeductions` → `takeHomePay` exists only as a commented-out link in `incomeNodes.ts`.
- Each federal ordinary bracket adds nodes `bracket-i-income`, `bracket-i-keep`, `bracket-i-tax`; Sankey links use `bracket-i-income` as the hub for flows to `takeHomePay` and `federalIncomeTax`.

