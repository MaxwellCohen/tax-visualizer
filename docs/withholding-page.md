# Withholding page

Route: `/withholding`

## Liability source

Annual federal income tax comes from the tax-page registry item `federalIncomeTax` after `calculateAllConfigValues`. That value is **net of nonrefundable credits** applied in the backward pass of `calculateTaxBuckets`—do not subtract credits again in withholding math.

## Paycheck math

- One withholding block per **W-2 wage income row** (each job/spouse line in the income form).
- `suggestedAnnual(job) = federalIncomeTax × (jobWages / totalWages)` (equal split if total wages are zero).
- `suggestedPerPaycheck(job) = suggestedAnnual(job) / payPeriodsPerYear(job)`
- Optional per job: federal withheld per paycheck → `annualWithheld(job) = perPaycheck × payPeriods`
- Household: `estimatedBalance = sum(annualWithheld) − federalIncomeTax`

Pay frequency periods: weekly 52, biweekly 26, semi-monthly 24, monthly 12.

## URL params

- `scenario` — same as Home (`TaxFormData.rows` JSON)
- `whjobs` — URL-encoded JSON array: `[{ "id": "<incomeRowId>", "pay": "biweekly", "withheld": 450 }]`
- Legacy `pay` / `withheld` apply to the first W-2 row when `whjobs` is absent
