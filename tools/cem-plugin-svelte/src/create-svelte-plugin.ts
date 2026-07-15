import type { Plugin } from "@custom-elements-manifest/analyzer";

import type { SupportedCompilerOptions } from "./compile-svelte-file.js";
import {
  type OverrideModuleCreation,
  createOverrideModuleCreation,
} from "./override-module-creation.js";
import { ParserCache } from "./parser-cache.js";
import { createPlugin } from "./plugin.js";
import type { SveltePluginState } from "./state.js";

export interface CreateSveltePluginOptions {
  /**
   * Directory to resolve paths relative to
   */
  cwd?: string;

  /**
   * Svelte compiler options
   */
  compilerOptions?: SupportedCompilerOptions;

  /**
   * Path to a `tsconfig.json` used to configure type resolution (relative paths
   * are resolved against `cwd`). Falls back to `<cwd>/tsconfig.json` when not
   * provided; if neither exists, default compiler options are used.
   */
  tsconfigPath?: string;
}

interface SveltePluginResult {
  plugin: Plugin;
  overrideModuleCreation: OverrideModuleCreation;
}

export function createSveltePlugin({
  cwd = process.cwd(),
  compilerOptions = {},
  tsconfigPath,
}: CreateSveltePluginOptions = {}): SveltePluginResult {
  const state: SveltePluginState = {
    compilerOptions,
    cwd,
    tsconfigPath,
    parserCache: new ParserCache(),
  };

  return {
    plugin: createPlugin(state),
    overrideModuleCreation: createOverrideModuleCreation(state),
  };
}
