import { defineHandler } from "nitro";
import { getStateYearConfig } from "~/lib/tax/api/catalog";
import { yearNotFound } from "../../../utils/yearNotFound";

export default defineHandler((event) => {
  const year = event.context.params?.year;
  return getStateYearConfig(Number(year)) ?? yearNotFound(year);
});
