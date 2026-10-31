import { html } from "lit";
import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { render } from "vitest-browser-lit";

import { createVariantElement, type VariantDescriptor, type VariantElement } from "../src/index.ts";

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

const alpha = {
  tagName: "test-alpha",
  attributes: ["label", "state"],
  members: [
    { name: "count", kind: "field" },
    { name: "increment", kind: "method" },
    { name: "notify", kind: "method" },
    { name: "reset", kind: "method" },
    { name: "start", kind: "method" },
  ],
  slots: ["icon"],
  parts: ["label"],
} as const satisfies VariantDescriptor;

const beta = {
  tagName: "test-beta",
  attributes: [],
  members: [
    { name: "message", kind: "field" },
    { name: "shout", kind: "field", readonly: true },
  ],
  slots: [],
  parts: [],
} as const satisfies VariantDescriptor;

customElements.define("test-alpha", AlphaElement);
customElements.define("test-beta", BetaElement);

const TestVariant = createVariantElement({ alpha, beta });
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

    customElements.define("test-variant-late", createVariantElement({ alpha }));
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

  test("throws when a variant has a part named `variant`", () => {
    const Wrapper = createVariantElement({ alpha: { ...alpha, parts: ["variant"] } });

    expect(() => customElements.define("test-variant-part", Wrapper)).toThrow(
      'Variant "alpha" cannot have a part named "variant"',
    );
  });
});

class DeferredElement extends HTMLElement {
  static observedAttributes = ["label"];

  value = "";

  describe(): string {
    return `${this.getAttribute("label")}: ${this.value}`;
  }
}

const deferred = {
  tagName: "test-deferred",
  attributes: ["label"],
  members: [
    { name: "value", kind: "field" },
    { name: "describe", kind: "method" },
  ],
  slots: [],
  parts: [],
} as const satisfies VariantDescriptor;

const DeferredVariant = createVariantElement({ deferred });
customElements.define("test-deferred-variant", DeferredVariant);

describe("a variant defined after the wrapper", () => {
  test("is created once its element is defined", async () => {
    const host = document.createElement("test-deferred-variant");
    host.setAttribute("label", "Label");
    host.variant = "deferred";
    host.value = "Value";

    expect(host.shadowRoot!.childElementCount).toBe(0);
    expect(host.value).toBe("Value");
    expect(() => host.describe()).toThrow(
      "Cannot call `describe` before <test-deferred> is defined",
    );

    customElements.define("test-deferred", DeferredElement);
    await customElements.whenDefined("test-deferred");

    expect(childOf(host)).toBeInstanceOf(DeferredElement);
    expect(host.describe()).toBe("Label: Value");
  });

  test("warns when its element is never defined", () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const never = { ...deferred, tagName: "test-never" } as const;
      customElements.define("test-never-variant", createVariantElement({ never }));

      const host = document.createElement("test-never-variant") as HTMLElement & {
        variant: string;
      };
      host.variant = "never";
      vi.runAllTimers();

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("<test-never> has not been defined"),
      );
    } finally {
      warn.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe("descriptors", () => {
  test("that do not match the element produce a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const stale = {
        ...alpha,
        attributes: ["label", "size"],
        members: [...alpha.members, { name: "missing", kind: "method" }],
      } as const;
      customElements.define("test-stale-variant", createVariantElement({ stale }));

      const host = document.createElement("test-stale-variant") as HTMLElement & {
        variant: string;
      };
      host.variant = "stale";

      expect(warn).toHaveBeenCalledOnce();
      const [message] = warn.mock.calls[0]!;
      expect(message).toContain("member `missing` does not exist");
      expect(message).toContain("attribute `size` is not observed");
      expect(message).toContain("attribute `state` is observed but not described");
    } finally {
      warn.mockRestore();
    }
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

  test("declared as class fields are forwarded to the child", () => {
    const host = document.createElement("test-variant");
    host.variant = "beta";

    if (host.variant === "beta") {
      host.message = "hello";
      expect((childOf(host) as BetaElement).message).toBe("hello");
      expect(host.shout).toBe("HELLO");
    }
  });

  test("that are read-only cannot be set on the wrapper", () => {
    const host = document.createElement("test-variant") as unknown as Record<string, unknown>;

    expect(() => {
      host.shout = "nope";
    }).toThrow(TypeError);
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

  test("content moved into a named slot after the child was created reaches it", async () => {
    const screen = render(html`
      <test-variant variant="alpha">
        <b>Icon</b>
      </test-variant>
    `);
    const icon = screen.container.querySelector("b")!;
    const iconSlot = childOf(
      screen.container.querySelector("test-variant")!,
    ).shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon"]')!;

    icon.slot = "icon";

    await expect.poll(() => iconSlot.assignedElements({ flatten: true })).toEqual([icon]);
  });
});

describe("parts", () => {
  test("of the child can be styled through the wrapper", () => {
    const screen = render(html`
      <style>
        .styled::part(label) {
          color: rgb(255, 0, 0);
        }
      </style>
      <test-variant class="styled" variant="alpha" label="Label"></test-variant>
    `);
    const label = childOf(
      screen.container.querySelector("test-variant")!,
    ).shadowRoot!.querySelector("span")!;

    expect(getComputedStyle(label).color).toBe("rgb(255, 0, 0)");
  });
});

class SizedElement extends HTMLElement {
  connectedCallback() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>:host { display: block; width: 50px; height: 20px; }</style>`;
  }
}

const sized = {
  tagName: "test-sized",
  attributes: [],
  members: [],
  slots: [],
  parts: [],
} as const satisfies VariantDescriptor;

customElements.define("test-sized", SizedElement);
customElements.define("test-sized-variant", createVariantElement({ sized }));

function rectOf(element: Element) {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

describe("layout", () => {
  test("the wrapper does not generate a box", () => {
    const { host, child } = renderAlpha();

    expect(getComputedStyle(host).display).toBe("contents");
    expect(host.getClientRects()).toHaveLength(0);
    expect(childOf(host)).toBe(child);
  });

  test("the child is the item of a flex container", () => {
    const screen = render(html`
      <div data-testid="container" style="display: flex; width: 300px;">
        <div style="width: 100px;"></div>
        <test-sized-variant variant="sized" style="flex: 1;"></test-sized-variant>
      </div>
    `);
    const host = screen.container.querySelector("test-sized-variant")!;

    expect(rectOf(childOf(host)).width).toBe(200);
  });

  test("the child is the item of a grid container", () => {
    const screen = render(html`
      <div style="display: grid; grid-template-areas: 'a b'; grid-template-columns: 100px 100px;">
        <test-sized-variant variant="sized" style="grid-area: b;"></test-sized-variant>
      </div>
    `);
    const container = screen.container.firstElementChild!;
    const host = screen.container.querySelector("test-sized-variant")!;

    expect(rectOf(childOf(host)).left - rectOf(container).left).toBe(100);
  });

  test("`order` on the wrapper reorders the child", () => {
    const screen = render(html`
      <div style="display: flex;">
        <test-sized-variant variant="sized" id="first"></test-sized-variant>
        <test-sized-variant variant="sized" id="second" style="order: -1;"></test-sized-variant>
      </div>
    `);
    const first = childOf(screen.container.querySelector("#first")!);
    const second = childOf(screen.container.querySelector("#second")!);

    expect(rectOf(second).left).toBeLessThan(rectOf(first).left);
  });

  test("`align-self` on the wrapper aligns the child", () => {
    const screen = render(html`
      <div style="display: flex; align-items: flex-start; height: 100px;">
        <test-sized-variant variant="sized" style="align-self: flex-end;"></test-sized-variant>
      </div>
    `);
    const container = screen.container.firstElementChild!;
    const host = screen.container.querySelector("test-sized-variant")!;

    expect(rectOf(childOf(host)).top - rectOf(container).top).toBe(80);
  });

  test("`margin` on the wrapper is applied to the child", () => {
    const screen = render(html`
      <div style="display: flex;">
        <test-sized-variant variant="sized" style="margin-left: 20px;"></test-sized-variant>
      </div>
    `);
    const container = screen.container.firstElementChild!;
    const host = screen.container.querySelector("test-sized-variant")!;

    expect(rectOf(childOf(host)).left - rectOf(container).left).toBe(20);
  });

  test("the child's own sizing is not overridden by the wrapper", () => {
    const screen = render(html`<test-sized-variant variant="sized"></test-sized-variant>`);
    const host = screen.container.querySelector("test-sized-variant")!;

    expect(rectOf(childOf(host))).toMatchObject({ width: 50, height: 20 });
  });

  test("the child can be sized through the `variant` part", () => {
    const screen = render(html`
      <style>
        .wide::part(variant) {
          width: 120px;
        }
      </style>
      <test-sized-variant class="wide" variant="sized"></test-sized-variant>
    `);
    const host = screen.container.querySelector("test-sized-variant")!;

    expect(rectOf(childOf(host)).width).toBe(120);
  });

  test("the `hidden` attribute hides the child", () => {
    const screen = render(html`<test-sized-variant variant="sized" hidden></test-sized-variant>`);
    const host = screen.container.querySelector<HTMLElement>("test-sized-variant")!;

    expect(childOf(host).checkVisibility()).toBe(false);

    host.hidden = false;

    expect(childOf(host).checkVisibility()).toBe(true);
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

test("variants cannot declare a `variant` property", () => {
  const field = { ...sized, tagName: "test-field" } as const;
  const accessor = { ...sized, tagName: "test-accessor" } as const;
  const optional = { ...sized, tagName: "test-optional" } as const;

  createVariantElement({ alpha, beta });

  // @ts-expect-error -- `variant` is owned by the wrapper
  createVariantElement({ field });
  // @ts-expect-error -- `variant` is owned by the wrapper
  createVariantElement({ accessor });
  // @ts-expect-error -- `variant` is owned by the wrapper
  createVariantElement({ optional });
});

class FieldVariant extends HTMLElement {
  variant = "field";
}

class AccessorVariant extends HTMLElement {
  get variant(): string {
    return "accessor";
  }
}

class OptionalVariant extends HTMLElement {
  variant?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "test-alpha": AlphaElement;
    "test-beta": BetaElement;
    "test-deferred": DeferredElement;
    "test-never": DeferredElement;
    "test-sized": SizedElement;
    "test-field": FieldVariant;
    "test-accessor": AccessorVariant;
    "test-optional": OptionalVariant;
    "test-variant": TestVariantElement;
    "test-deferred-variant": InstanceType<typeof DeferredVariant>;
  }
}
