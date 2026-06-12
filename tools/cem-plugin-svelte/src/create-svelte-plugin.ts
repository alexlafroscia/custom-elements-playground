import type { Plugin } from "@custom-elements-manifest/analyzer";

import type { SupportedCompilerOptions } from "./compile-svelte-file.js";
import { ParserCache } from "./parser-cache.js";
import { createPlugin } from "./plugin.js";
import {
  type OverrideModuleCreation,
  createOverrideModuleCreation,
} from "./override-module-creation.js";
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
}

interface SveltePluginResult {
  plugin: Plugin;
  overrideModuleCreation: OverrideModuleCreation;
}

export function createSveltePlugin({
  cwd = process.cwd(),
  compilerOptions = {},
}: CreateSveltePluginOptions = {}): SveltePluginResult {
  const state: SveltePluginState = {
    compilerOptions,
    cwd,
    parserCache: new ParserCache(),
  };

  return {
    plugin: createPlugin(state),
    overrideModuleCreation: createOverrideModuleCreation(state),
  };
}
