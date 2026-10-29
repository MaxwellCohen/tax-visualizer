import { defineHandler } from "nitro";
import { getOpenApiDocument } from "~/lib/tax/api/openapi";

export default defineHandler(() => getOpenApiDocument());
