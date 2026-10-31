import { dts } from "cem-plugin-dts";
import { createSveltePlugin } from "cem-plugin-svelte";
import { customElementSveltePlugin } from "custom-element-svelte-integration";
import { customElementVsCodePlugin } from "custom-element-vs-code-integration";

import svelteConfig from "./svelte.config.js";

const { plugin: svelte, overrideModuleCreation } = createSveltePlugin({
  compilerOptions: svelteConfig.compilerOptions,
});

/** @type {import("@custom-elements-manifest/analyzer").Config} */
export default {
  globs: ["./src/**/*.svelte"],
  plugins: [
    svelte,
    customElementVsCodePlugin(),
    customElementSveltePlugin({
      outdir: "./register-types",
      fileName: "svelte-elements.d.ts",
    }),
    dts({
      path: "./register-types/html-element.ts",
    }),
  ],
  overrideModuleCreation,
};
