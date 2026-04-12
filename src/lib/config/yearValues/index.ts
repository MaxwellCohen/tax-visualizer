
import type { YearValues } from "../types";
import { YEAR_VALUES_2023 } from "./YEAR_VALUES_2023";
import { YEAR_VALUES_2024 } from "./YEAR_VALUES_2024";
import { YEAR_VALUES_2025 } from "./YEAR_VALUES_2025";
import { YEAR_VALUES_2026 } from "./YEAR_VALUES_2026";

export const YEAR_VALUES_BY_YEAR: Record<number, YearValues> = {
  2023: YEAR_VALUES_2023,
  2024: YEAR_VALUES_2024,
  2025: YEAR_VALUES_2025,
  2026: YEAR_VALUES_2026,
};

export function getYearValues(year: number): YearValues | undefined {
  return YEAR_VALUES_BY_YEAR[year];
}

{ YEAR_VALUES_2023, YEAR_VALUES_2024, YEAR_VALUES_2025, YEAR_VALUES_2026 };