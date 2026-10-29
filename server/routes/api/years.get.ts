import { defineHandler } from "nitro";
import { getApiCatalog } from "~/lib/tax/api/catalog";

export default defineHandler(() => getApiCatalog());
