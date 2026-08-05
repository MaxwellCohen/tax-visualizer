import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";

export default defineConfig({
  server: {
    host: true
  },
  plugins: [
    devtools({ autoname: true }),
    solidStart(),
    tailwindcss(),
    nitro()
  ],
  nitro: {
    preset: "vercel"
  }
});
