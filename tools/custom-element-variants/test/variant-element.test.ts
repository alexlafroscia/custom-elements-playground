import { html } from "lit";
import { describe, expect, expectTypeOf, test } from "vitest";
import { render } from "vitest-browser-lit";

import { createVariantElement, type VariantElement } from "../src/index.ts";

const STATES = ["idle", "busy"];

class AlphaElement extends HTMLElement {
  static observedAttributes = ["label", "state"];

  #count = 0;

  get count(): number {
    return this.#count;
  }

  set count(value: number) {
    this.#count = value;
  }

  increment(): number {
    return ++this.#count;
  }

  notify(): void {
    this.dispatchEvent(new CustomEvent("alpha-notify", { detail: this.#count }));
  }

  /** Updates the element's own property, as it might in response to user interaction */
  reset(): void {
    this.count = 0;
  }

  /** Updates the element's own attribute, as it might to expose its state for styling */
  start(): void {
    this.setAttribute("state", "busy");
  }

  connectedCallback() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.innerHTML = `<span part="label"></span><slot name="icon"></slot><slot></slot>`;
    this.#renderLabel();

    if (!this.hasAttribute("state")) this.setAttribute("state", "idle");
  }

  attributeChangedCallback(name: string, _oldValue: string | null, value: string | null) {
    this.#renderLabel();

    // Normalize unknown states, so that the element writes to an attribute it was just given
    if (name === "state" && value !== null && !STATES.includes(value)) {
      this.setAttribute("state", "idle");
    }
  }

  #renderLabel() {
    const label = this.shadowRoot?.querySelector("span");
    if (label) label.textContent = this.getAttribute("label") ?? "";
  }
}

class BetaElement extends HTMLElement {
  message = "";

  get shout(): string {
    return this.message.toUpperCase();
  }
}

customElements.define("test-alpha", AlphaElement);
customElements.define("test-beta", BetaElement);

const TestVariant = createVariantElement({ alpha: AlphaElement, beta: BetaElement });
customElements.define("test-variant", TestVariant);

type TestVariantElement = InstanceType<typeof TestVariant>;

function childOf(host: Element): HTMLElement {
  return host.shadowRoot!.firstElementChild as HTMLElement;
}

describe("selecting a variant", () => {
  test("from the `variant` attribute", async () => {
    const screen = render(html`<test-variant variant="alpha"></test-variant>`);
    const host = screen.container.querySelector("test-variant")!;

    expect(host.variant).toBe("alpha");
    expect(childOf(host)).toBeInstanceOf(AlphaElement);
  });

  test("from the `variant` property", () => {
    const host = document.createElement("test-variant");
    host.variant = "beta";

    expect(childOf(host)).toBeInstanceOf(BetaElement);
  });

  test("from a property set before the element was upgraded", () => {
    const host = document.createElement("test-variant-late") as TestVariantElement;
    Object.assign(host, { variant: "alpha", count: 3 });

    customElements.define("test-variant-late", createVariantElement({ alpha: AlphaElement }));
    customElements.upgrade(host);

    expect(childOf(host)).toBeInstanceOf(AlphaElement);
    expect((childOf(host) as AlphaElement).count).toBe(3);
  });

  test("throws for an unknown variant", () => {
    const host = document.createElement("test-variant");

    expect(() => {
      host.variant = "gamma" as "alpha";
    }).toThrow('Unknown variant "gamma"; expected one of "alpha", "beta"');
  });

  test("throws when the variant changes", () => {
    const host = document.createElement("test-variant");
    host.variant = "alpha";

    expect(() => {
      host.variant = "beta";
    }).toThrow("`variant` cannot be changed once set");
  });
});

function renderAlpha() {
  const screen = render(html`<test-variant variant="alpha"></test-variant>`);
  const host = screen.container.querySelector("test-variant")!;
  if (host.variant !== "alpha") throw new Error("Expected the `alpha` variant");

  return { host, child: childOf(host) as AlphaElement };
}

describe("properties", () => {
  test("set before the variant are applied to the child", () => {
    const host = document.createElement("test-variant") as TestVariantElement & AlphaElement;
    host.count = 5;
    expect(host.count).toBe(5);

    host.variant = "alpha";

    expect((childOf(host) as AlphaElement).count).toBe(5);
  });

  test("and methods are forwarded to the child", () => {
    const host = document.createElement("test-variant");
    host.variant = "alpha";

    if (host.variant === "alpha") {
      expect(host.increment()).toBe(1);
      host.count = 10;
      expect(host.count).toBe(10);
      expect((childOf(host) as AlphaElement).count).toBe(10);
    }
  });

  test("the child sets on itself are visible on the wrapper", () => {
    const { host, child } = renderAlpha();
    host.count = 5;

    child.reset();

    expect(host.count).toBe(0);
  });
});

describe("attributes", () => {
  test("that are observed are forwarded to the child", async () => {
    const screen = render(html`<test-variant variant="alpha" label="Hello"></test-variant>`);
    const host = screen.container.querySelector("test-variant")!;

    expect(childOf(host).getAttribute("label")).toBe("Hello");

    host.setAttribute("label", "Goodbye");
    expect(childOf(host).getAttribute("label")).toBe("Goodbye");

    host.removeAttribute("label");
    expect(childOf(host).hasAttribute("label")).toBe(false);
  });

  test("that are unobserved are not forwarded to the child", async () => {
    const screen = render(html`<test-variant variant="alpha" class="foo"></test-variant>`);
    const host = screen.container.querySelector("test-variant")!;

    expect(childOf(host).hasAttribute("class")).toBe(false);
  });

  test("the child sets on itself are reflected to the wrapper", async () => {
    const { host, child } = renderAlpha();

    child.start();

    await expect.poll(() => host.getAttribute("state")).toBe("busy");
  });

  test("the child removes from itself are removed from the wrapper", async () => {
    const { host, child } = renderAlpha();
    await expect.poll(() => host.getAttribute("state")).toBe("idle");

    child.removeAttribute("state");

    await expect.poll(() => host.hasAttribute("state")).toBe(false);
  });

  test("the child sets while connecting are reflected to the wrapper", async () => {
    const { host } = renderAlpha();

    await expect.poll(() => host.getAttribute("state")).toBe("idle");
  });

  test("set on the wrapper are not overwritten by the child's default", async () => {
    const screen = render(html`<test-variant variant="alpha" state="busy"></test-variant>`);
    const host = screen.container.querySelector("test-variant")!;

    await Promise.resolve();

    expect(host.getAttribute("state")).toBe("busy");
    expect(childOf(host).getAttribute("state")).toBe("busy");
  });

  test("the child normalizes are reflected back to the wrapper", async () => {
    const { host, child } = renderAlpha();

    host.setAttribute("state", "unknown");

    await expect.poll(() => host.getAttribute("state")).toBe("idle");
    expect(child.getAttribute("state")).toBe("idle");
  });

  test("reflected from the child can be observed on the wrapper", async () => {
    const { host, child } = renderAlpha();
    await expect.poll(() => host.getAttribute("state")).toBe("idle");

    const changes: (string | null)[] = [];
    new MutationObserver((records) => {
      for (const record of records) changes.push(host.getAttribute(record.attributeName!));
    }).observe(host, { attributeFilter: ["state"] });

    child.start();

    await expect.poll(() => changes).toEqual(["busy"]);
  });
});

describe("events", () => {
  test("that are not composed are re-dispatched from the wrapper", () => {
    const host = document.createElement("test-variant");
    host.variant = "alpha";

    const details: unknown[] = [];
    host.addEventListener("alpha-notify", (event) => {
      details.push((event as CustomEvent).detail);
    });

    if (host.variant === "alpha") {
      host.increment();
      host.notify();
    }

    expect(details).toEqual([1]);
  });
});

describe("slots", () => {
  test("slotted content reaches the child's slots", async () => {
    const screen = render(html`
      <test-variant variant="alpha" label="Label">
        <b slot="icon">Icon</b>
        <i>Content</i>
      </test-variant>
    `);

    await expect.element(screen.getByText("Label")).toBeVisible();
    await expect.element(screen.getByText("Icon")).toBeVisible();
    await expect.element(screen.getByText("Content")).toBeVisible();
  });
});

test("the instance type is discriminated on `variant`", () => {
  expectTypeOf<TestVariantElement>().toEqualTypeOf<VariantElement<typeof TestVariant.variants>>();
  expectTypeOf<TestVariantElement["variant"]>().toEqualTypeOf<"alpha" | "beta">();

  const host: TestVariantElement = document.createElement("test-variant");

  if (host.variant === "alpha") {
    expectTypeOf(host.count).toEqualTypeOf<number>();
    expectTypeOf(host.increment).toEqualTypeOf<() => number>();
  } else {
    expectTypeOf(host.shout).toEqualTypeOf<string>();
    expectTypeOf(host).not.toHaveProperty("count");
  }
});

declare global {
  interface HTMLElementTagNameMap {
    "test-variant": TestVariantElement;
  }
}
