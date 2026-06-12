import { svelte, overrideModuleCreation } from "@ce-ts-playground/cem-plugin-svelte";

import svelteConfig from "./svelte.config.js";

/** @type {import("@custom-elements-manifest/analyzer").Config} */
export default {
  globs: ["./src/**/*.svelte"],
  plugins: [svelte()],
  overrideModuleCreation: overrideModuleCreation({
    compilerOptions: svelteConfig.compilerOptions,
  }),
};
