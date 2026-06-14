import { html } from "lit";
import { expect, test, beforeAll } from "vitest";

import { INTERNAL_VALUE } from "../src/MutableInternalState.svelte";
import { render } from "./reactive-render.svelte";

beforeAll(async () => {
  await customElements.whenDefined("mutable-state");
});

test("props update if mutated internally", async () => {
  let value = $state("World");

  const screen = await render(
    () => html`<mutable-state data-testid="root" .expose=${value}></mutable-internal-state>`,
  );

  // Find the button to click on based on the initial value
  const buttonLocator = screen.getByText(value);
  await buttonLocator.click();

  // Find the DOM node for the Svelte component
  const mutableStateLocator = screen.getByTestId("root");
  const mutableStateNode = mutableStateLocator.element() as HTMLMutableInternalStateElement;

  // Ensure the internally-set value is surfaced through the DOM node property
  expect(
    mutableStateNode.expose,
    "The property on the DOM node reflects the internally-updated value",
  ).toBe(INTERNAL_VALUE);

  // Ensure a new externally-set value overrides the internal one
  value = "New External Value";

  await expect
    .poll(() => mutableStateNode.expose, {
      message: "The property on the DOM node reflects the new externally-set value",
    })
    .toBe(value);
});
