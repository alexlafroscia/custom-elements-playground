import { resolve } from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
  },

  plugins: [
    svelte(),
    dts({
      tsconfigPath: "./tsconfig.src.json",
    }),
  ],
});
