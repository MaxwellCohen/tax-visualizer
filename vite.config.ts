import { defineConfig } from "vite";
import { nitroV2Plugin as nitro } from "@solidjs/vite-plugin-nitro-2";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";

export default defineConfig({
  // @ts-expect-error devtools is valid in Vite 7
  devtools: true,
  server: {
    host: true
  },
  plugins: [
    devtools({ autoname: true, }),
    solidStart(),
    tailwindcss(),
    nitro({ preset: "vercel" })
  ]
});
