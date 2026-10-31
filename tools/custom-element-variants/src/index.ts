export type Variants = Record<string, CustomElementConstructor>;

/**
 * The instance type of an element created by `createVariantElement`: a union of each variant's
 * instance type, discriminated on the `variant` property.
 */
export type VariantElement<M extends Variants> = {
  [K in keyof M & string]: HTMLElement & Omit<InstanceType<M[K]>, "variant"> & { variant: K };
}[keyof M & string];

export interface VariantElementConstructor<M extends Variants> {
  new (): VariantElement<M>;
  readonly variants: M;
  readonly observedAttributes: string[];
}

type MemberKind = "accessor" | "method";

// Members of a variant that should never be forwarded from the wrapper
const SKIPPED_MEMBERS = new Set<PropertyKey>([
  "constructor",
  "variant",
  "connectedCallback",
  "disconnectedCallback",
  "adoptedCallback",
  "connectedMoveCallback",
  "attributeChangedCallback",
]);

/**
 * The wrapper generates no box of its own, so that the variant element takes its place in the
 * layout. Properties that place the wrapper within its parent would otherwise be ignored; the
 * variant inherits them so that they apply to it instead.
 *
 * Sizing properties are deliberately not inherited, as the variant's own `:host` styles would
 * always be overridden by the wrapper's defaults.
 */
const HOST_STYLES = `
  :host { display: contents; }
  :host([hidden]) { display: none; }

  :host > * {
    flex: inherit;
    order: inherit;
    align-self: inherit;
    justify-self: inherit;
    grid-area: inherit;
    margin: inherit;
  }
`;

let hostStyles: CSSStyleSheet | undefined;

/**
 * Collect the public members of each variant class, walking each prototype chain up to (but not
 * including) `HTMLElement.prototype`.
 *
 * If a key is an accessor in any variant it is treated as an accessor, so that reads and writes
 * are forwarded rather than being called.
 */
function collectMembers(variants: Variants): Map<PropertyKey, MemberKind> {
  const members = new Map<PropertyKey, MemberKind>();

  for (const Ctor of Object.values(variants)) {
    for (
      let proto = Ctor.prototype;
      proto && proto !== HTMLElement.prototype;
      proto = Object.getPrototypeOf(proto)
    ) {
      for (const key of Reflect.ownKeys(proto)) {
        if (SKIPPED_MEMBERS.has(key) || members.get(key) === "accessor") continue;

        const desc = Object.getOwnPropertyDescriptor(proto, key)!;
        members.set(key, typeof desc.value === "function" ? "method" : "accessor");
      }
    }
  }

  return members;
}

/**
 * Copy the current value of an attribute from one element to another, if it differs.
 */
function copyAttribute(from: Element, to: Element, name: string): void {
  const value = from.getAttribute(name);
  if (to.getAttribute(name) === value) return;

  if (value === null) to.removeAttribute(name);
  else to.setAttribute(name, value);
}

function observedAttributesOf(Ctor: CustomElementConstructor): readonly string[] {
  return (Ctor as { observedAttributes?: readonly string[] }).observedAttributes ?? [];
}

/**
 * Create a custom element that delegates to one of several variant elements, chosen by the value
 * of its `variant` attribute or property. The variant may be set once, and cannot change after.
 *
 * Variant elements must be registered with `customElements.define` before the returned class is
 * defined, so that their properties can be discovered.
 *
 * Properties and methods defined on any variant's prototype are forwarded to the child element.
 * Writes made before the variant is known are buffered and applied once the child is created.
 */
export function createVariantElement<const M extends Variants>(
  variants: M,
): VariantElementConstructor<M> {
  let members: Map<PropertyKey, MemberKind> | undefined;

  class VariantHost extends HTMLElement {
    static readonly variants = variants;

    static get observedAttributes(): string[] {
      VariantHost.#install();

      const attributes = new Set(["variant"]);
      for (const Ctor of Object.values(variants)) {
        for (const attribute of observedAttributesOf(Ctor)) attributes.add(attribute);
      }
      return [...attributes];
    }

    /**
     * Install forwarders for every variant member onto the wrapper's prototype. This happens
     * once, when the wrapper is defined, so that instances keep a single shared shape.
     */
    static #install(): void {
      if (members) return;

      members = collectMembers(variants);
      if (!hostStyles) {
        hostStyles = new CSSStyleSheet();
        hostStyles.replaceSync(HOST_STYLES);
      }

      for (const [key, kind] of members) {
        if (kind === "method") {
          const fallback = (HTMLElement.prototype as unknown as Record<PropertyKey, unknown>)[key];

          Object.defineProperty(VariantHost.prototype, key, {
            configurable: true,
            writable: true,
            value(this: VariantHost, ...args: unknown[]) {
              const child = this.#child;
              if (child) return (child[key] as (...args: unknown[]) => unknown)(...args);
              if (typeof fallback === "function") return fallback.apply(this, args);

              throw new Error(`Cannot call \`${String(key)}\` before \`variant\` is set`);
            },
          });
        } else {
          Object.defineProperty(VariantHost.prototype, key, {
            configurable: true,
            get(this: VariantHost) {
              const child = this.#child;
              return child ? child[key] : this.#pending.get(key);
            },
            set(this: VariantHost, value: unknown) {
              const child = this.#child;
              if (child) child[key] = value;
              else this.#pending.set(key, value);
            },
          });
        }
      }
    }

    #variant: string | undefined;
    #child: (HTMLElement & Record<PropertyKey, unknown>) | undefined;
    #pending = new Map<PropertyKey, unknown>();
    #slots = new Set<string>();

    constructor() {
      super();

      const root = this.attachShadow({ mode: "open", delegatesFocus: true });
      root.adoptedStyleSheets = [hostStyles!];

      // Properties set before the element was upgraded are own properties that shadow the
      // forwarders on the prototype; re-apply them so they go through the forwarders instead
      for (const key of [...members!.keys(), "variant"]) {
        if (Object.hasOwn(this, key)) {
          const value = (this as Record<PropertyKey, unknown>)[key];
          delete (this as Record<PropertyKey, unknown>)[key];
          (this as Record<PropertyKey, unknown>)[key] = value;
        }
      }
    }

    get variant(): string | undefined {
      return this.#variant;
    }

    set variant(value: string) {
      this.#select(value);
    }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null) {
      if (name === "variant") {
        if (value !== null || this.#variant !== undefined) this.#select(value);
        return;
      }

      const child = this.#child;
      if (!child || !observedAttributesOf(variants[this.#variant!]!).includes(name)) return;

      copyAttribute(this, child, name);
    }

    #select(value: string | null) {
      if (this.#variant !== undefined) {
        if (value === this.#variant) return;
        throw new Error(`\`variant\` cannot be changed once set (from "${this.#variant}")`);
      }

      if (value === null || !Object.hasOwn(variants, value)) {
        const expected = Object.keys(variants)
          .map((name) => `"${name}"`)
          .join(", ");
        throw new Error(`Unknown variant "${value}"; expected one of ${expected}`);
      }

      const Ctor = variants[value]!;
      if (!customElements.getName(Ctor)) {
        throw new Error(`The element class for variant "${value}" has not been defined`);
      }

      this.#variant = value;
      const child = new Ctor() as HTMLElement & Record<PropertyKey, unknown>;
      child.part.add("variant");

      const attributes = observedAttributesOf(Ctor).filter((attribute) => attribute !== "variant");

      for (const attribute of attributes) {
        if (this.hasAttribute(attribute)) copyAttribute(this, child, attribute);
      }

      for (const [key, pendingValue] of this.#pending) child[key] = pendingValue;
      this.#pending.clear();

      this.#forwardEvents(child);
      this.#reflectAttributes(child, attributes);

      child.append(document.createElement("slot"));
      this.#child = child;
      this.#syncSlots();
      new MutationObserver(() => this.#syncSlots()).observe(this, { childList: true });

      this.shadowRoot!.append(child);
    }

    /**
     * Events that are not `composed` stop at the wrapper's shadow root; re-dispatch them from the
     * wrapper so that listeners on it observe the same events as they would on the child.
     */
    #forwardEvents(child: HTMLElement) {
      const host = this;
      const dispatchEvent = child.dispatchEvent;

      child.dispatchEvent = function (event: Event): boolean {
        const result = dispatchEvent.call(this, event);
        if (event.composed) return result;

        const EventCtor = event.constructor as new (type: string, init: EventInit) => Event;
        const forwarded = new EventCtor(event.type, event);
        const hostResult = host.dispatchEvent(forwarded);

        if (forwarded.defaultPrevented) event.preventDefault();
        return result && hostResult;
      };
    }

    /**
     * Reflect changes the child makes to its own observed attributes back onto the wrapper, so
     * that they remain observable from outside of it.
     *
     * Values are only written when they differ, which stops changes from bouncing between the
     * wrapper and the child.
     */
    #reflectAttributes(child: HTMLElement, attributes: readonly string[]) {
      if (attributes.length === 0) return;

      // Pick up any attributes the child set on itself while it was being constructed
      for (const attribute of attributes) copyAttribute(child, this, attribute);

      new MutationObserver((records) => {
        const changed = new Set(records.map((record) => record.attributeName!));
        for (const attribute of changed) copyAttribute(child, this, attribute);
      }).observe(child, { attributeFilter: [...attributes] });
    }

    /**
     * Create a forwarding `<slot>` within the child for every named slot used by the wrapper's
     * children, so that slotted content reaches the child's own slots.
     */
    #syncSlots() {
      const child = this.#child!;

      for (const element of this.children) {
        const name = element.getAttribute("slot");
        if (!name || this.#slots.has(name)) continue;

        const slot = document.createElement("slot");
        slot.name = name;
        slot.slot = name;
        child.append(slot);
        this.#slots.add(name);
      }
    }
  }

  return VariantHost as unknown as VariantElementConstructor<M>;
}
