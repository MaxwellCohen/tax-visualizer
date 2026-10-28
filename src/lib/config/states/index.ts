import { STATE_VALUES_2023 } from "./STATE_VALUES_2023";
import { STATE_VALUES_2024 } from "./STATE_VALUES_2024";
import { STATE_VALUES_2025 } from "./STATE_VALUES_2025";
import { STATE_VALUES_2026 } from "./STATE_VALUES_2026";
import { STATE_CODES, type StateCode, type StateYearValues } from "./types";

const STATE_VALUES_BY_YEAR: Record<number, StateYearValues> = {
  2023: STATE_VALUES_2023,
  2024: STATE_VALUES_2024,
  2025: STATE_VALUES_2025,
  2026: STATE_VALUES_2026,
};

export function getStateYearValues(year: number): StateYearValues | undefined {
  return STATE_VALUES_BY_YEAR[year];
}

export const STATE_NAMES: Record<StateCode, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const STATE_CODE_SET = new Set<string>(STATE_CODES);

export function isStateCode(value: unknown): value is StateCode {
  return typeof value === "string" && STATE_CODE_SET.has(value);
}
