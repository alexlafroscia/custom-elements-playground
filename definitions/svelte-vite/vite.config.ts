import { resolve } from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],

  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "SvelteViteCustom",
      fileName: "index",
      formats: ["es"],
    },
  },
});
