/**
 * Default `kind` values for new line items — must match `subcategories[].key`
 * in the corresponding `make*InputsConfig` in this folder.
 */
export const DEFAULT_INCOME_KIND = "income-ordinary-wages" as const;
export const DEFAULT_PRETAX_BENEFIT_KIND = "input-pretax-401K-preTax401kSpouse1" as const;
export const DEFAULT_ITEMIZED_DEDUCTION_KIND = "deduction-salt-salt" as const;
export const DEFAULT_FEDERAL_CREDIT_KIND = "input-credit-childTax-childTax" as const;
