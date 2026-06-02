import type { PayFrequency } from "./types";

export const DEFAULT_PAY_FREQUENCY: PayFrequency = "biweekly";

export const PAY_PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  "semi-monthly": 24,
  monthly: 12,
};

export const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly (52)" },
  { value: "biweekly", label: "Biweekly (26)" },
  { value: "semi-monthly", label: "Semi-monthly (24)" },
  { value: "monthly", label: "Monthly (12)" },
];

export function parsePayFrequency(value: string | undefined): PayFrequency {
  if (value && isPayFrequency(value)) {
    return value;
  }
  return DEFAULT_PAY_FREQUENCY;
}

export function isPayFrequency(value: string): value is PayFrequency {
  return value in PAY_PERIODS_PER_YEAR;
}
