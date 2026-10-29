import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

const brandBackground = { background: "#0f766e" };

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    // public/favicon.ico is hand-maintained; don't overwrite it.
    transparent: { ...minimal2023Preset.transparent, favicons: [] },
    maskable: { ...minimal2023Preset.maskable, resizeOptions: brandBackground },
    apple: { ...minimal2023Preset.apple, resizeOptions: brandBackground },
  },
  images: ["public/favicon.svg"],
});
