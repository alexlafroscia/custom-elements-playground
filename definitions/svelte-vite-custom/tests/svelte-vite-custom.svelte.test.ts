import { html } from "lit";
import { expect, test, describe, beforeAll } from "vitest";

import "../src/SimpleVite.svelte";
import { render } from "./reactive-render.svelte";

beforeAll(async () => {
  await customElements.whenDefined("svelte-vite-custom");
});

describe("`name` property", () => {
  test("setting the value as a property", async () => {
    let value = $state("World");

    const screen = await render(
      () => html`<svelte-vite-custom .name=${value}></svelte-vite-custom>`,
    );
    const element = screen.getByText("Hello");

    await expect.element(element).toHaveTextContent(value);

    value = "Friend";

    await expect.element(element).toHaveTextContent(value);
  });

  test("setting the value as an attribute", async () => {
    let value = $state("World");

    const screen = await render(
      () => html`<svelte-vite-custom name=${value}></svelte-vite-custom>`,
    );
    const element = screen.getByText("Hello");

    await expect.element(element).toHaveTextContent(value);

    value = "Friend";

    await expect.element(element).toHaveTextContent(value);
  });
});

describe("`getName` method", () => {
  test("receives the current value", async () => {
    let value = $state("World");

    const screen = await render(
      () => html`<svelte-vite-custom data-testid="root" .name=${value}></svelte-vite-custom>`,
    );

    const locator = screen.getByTestId("root");
    const element: any = await locator.findElement();

    expect(element.getName()).toEqual("World");

    value = "Friend";

    expect.poll(() => {
      expect(element.getName()).toEqual("Friend");
    });
  });
});
