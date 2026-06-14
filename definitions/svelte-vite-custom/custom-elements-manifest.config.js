import { createSveltePlugin } from "@ce-ts-playground/cem-plugin-svelte";
import { dts } from "cem-plugin-dts";
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
    dts({
      path: "./register-types/html-element.d.ts",
    }),
  ],
  overrideModuleCreation,
};
