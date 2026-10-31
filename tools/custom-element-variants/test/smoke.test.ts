import { html } from "lit";
import { expect, test } from "vitest";
import { render } from "vitest-browser-lit";

class GreetingElement extends HTMLElement {
  connectedCallback() {
    this.textContent = `Hello, ${this.getAttribute("name") ?? "World"}`;
  }
}

customElements.define("smoke-greeting", GreetingElement);

test("renders a custom element in the browser", async () => {
  const screen = render(html`<smoke-greeting name="Vitest"></smoke-greeting>`);

  await expect.element(screen.getByText("Hello, Vitest")).toBeInTheDocument();
});
