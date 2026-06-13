import type { TemplateResult } from "lit";
import { tick } from "svelte";
import { beforeEach } from "vitest";
import { type RenderResult, render as normalRender } from "vitest-browser-lit";

let cleanup: (() => void) | undefined;

beforeEach(() => {
  cleanup?.();
});

/**
 * Renders a `lit` template that automatically re-renders based on Svelte's `$effect` system
 *
 * This allows you to pass a `$state()` run into a `lit` template to dynamically
 * change properties over time
 */
export async function render(template: () => TemplateResult): Promise<RenderResult> {
  let renderResult: RenderResult | undefined;

  cleanup = $effect.root(() => {
    $effect(() => {
      if (!renderResult) {
        renderResult = normalRender(template());
      } else {
        renderResult.rerender(template());
      }
    });
  });

  await tick();

  return renderResult!;
}
