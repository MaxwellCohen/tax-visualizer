import { defineHandler } from "nitro";
import { getFederalYearConfig } from "~/lib/tax/api/catalog";
import { yearNotFound } from "../../../utils/yearNotFound";

export default defineHandler((event) => {
  const year = event.context.params?.year;
  return getFederalYearConfig(Number(year)) ?? yearNotFound(year);
});
