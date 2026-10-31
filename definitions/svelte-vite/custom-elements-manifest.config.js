import { dts } from "cem-plugin-dts";
import { createSveltePlugin } from "cem-plugin-svelte";
import { svelteDts } from "cem-plugin-svelte-dts";
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
      path: "./register-types/html-element.ts",
    }),
    svelteDts({
      path: "./register-types/svelte-elements.d.ts",
      imports: ["./html-element.ts"],
    }),
  ],
  overrideModuleCreation,
};
