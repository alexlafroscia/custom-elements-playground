import type {
  MemberKind,
  ValidVariants,
  VariantDescriptor,
  VariantElementConstructor,
  Variants,
} from "./types.js";

export type {
  VariantDescriptor,
  VariantElement,
  VariantElementConstructor,
  VariantMember,
  Variants,
} from "./types.js";

// Members of a variant that should never be forwarded from the wrapper
const SKIPPED_MEMBERS = new Set<string>([
  "constructor",
  "variant",
  "connectedCallback",
  "disconnectedCallback",
  "adoptedCallback",
  "connectedMoveCallback",
  "attributeChangedCallback",
]);

// The part that the variant element itself is exposed as
const VARIANT_PART = "variant";

// How long to wait for a variant element to be defined before warning that it may never be
const DEFINITION_WARNING_DELAY = 2000;

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
 * Collect the members of every variant that should be forwarded from the wrapper.
 *
 * If a key is a field in any variant it is treated as an accessor, so that reads and writes are
 * forwarded rather than being called. It is only read-only if it is read-only in every variant
 * that declares it.
 */
function collectMembers(variants: Variants): Map<string, MemberKind> {
  const members = new Map<string, MemberKind>();

  for (const { members: declared } of Object.values(variants)) {
    for (const { name, kind, readonly } of declared) {
      if (SKIPPED_MEMBERS.has(name)) continue;

      const previous = members.get(name);
      const next: MemberKind = kind === "method" ? "method" : readonly ? "readonly" : "accessor";

      if (!previous || previous === "method") members.set(name, next);
      else if (previous === "readonly" && next === "accessor") members.set(name, next);
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

/**
 * Warn about differences between a descriptor and the element it describes, which usually mean
 * that the manifest it was generated from is out of date.
 */
function checkDescriptor(descriptor: VariantDescriptor, child: HTMLElement): void {
  const Ctor = child.constructor as { observedAttributes?: readonly string[] };
  const observed = new Set(Ctor.observedAttributes ?? []);
  const described = new Set(descriptor.attributes);

  const problems = [
    ...descriptor.members
      .filter(({ name }) => !(name in child))
      .map(({ name }) => `member \`${name}\` does not exist`),
    ...[...described]
      .filter((name) => !observed.has(name))
      .map((name) => `attribute \`${name}\` is not observed`),
    ...[...observed]
      .filter((name) => name !== "variant" && !described.has(name))
      .map((name) => `attribute \`${name}\` is observed but not described`),
  ];

  if (problems.length > 0) {
    console.warn(
      `The descriptor for <${descriptor.tagName}> does not match the element; is the manifest ` +
        `out of date?\n${problems.map((problem) => `- ${problem}`).join("\n")}`,
    );
  }
}

/**
 * Create a custom element that delegates to one of several variant elements, chosen by the value
 * of its `variant` attribute or property. The variant may be set once, and cannot change after.
 *
 * Properties and methods described by each variant are forwarded to the child element. Writes
 * made before the child is created are buffered and applied once it is.
 *
 * Variant elements may be defined before or after the wrapper; the child is created once its
 * element has been defined.
 */
export function createVariantElement<const M extends Variants>(
  variants: M & ValidVariants<M>,
): VariantElementConstructor<M> {
  let members: Map<string, MemberKind> | undefined;
  const checked = new Set<string>();
  const awaiting = new Set<string>();

  class VariantHost extends HTMLElement {
    static readonly variants = variants;

    static get observedAttributes(): string[] {
      VariantHost.#install();

      const attributes = new Set(["variant"]);
      for (const { attributes: declared } of Object.values(variants)) {
        for (const attribute of declared) attributes.add(attribute);
      }
      return [...attributes];
    }

    /**
     * Install forwarders for every variant member onto the wrapper's prototype. This happens
     * once, when the wrapper is defined, so that instances keep a single shared shape.
     */
    static #install(): void {
      if (members) return;

      for (const [name, { parts }] of Object.entries(variants)) {
        if (parts.includes(VARIANT_PART)) {
          throw new Error(`Variant "${name}" cannot have a part named "${VARIANT_PART}"`);
        }
      }

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

              const variant = this.#variant;
              throw new Error(
                variant === undefined
                  ? `Cannot call \`${key}\` before \`variant\` is set`
                  : `Cannot call \`${key}\` before <${variants[variant]!.tagName}> is defined`,
              );
            },
          });
        } else {
          Object.defineProperty(VariantHost.prototype, key, {
            configurable: true,
            get(this: VariantHost) {
              const child = this.#child;
              return child ? child[key] : this.#pending.get(key);
            },
            set:
              kind === "readonly"
                ? undefined
                : function (this: VariantHost, value: unknown) {
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

    constructor() {
      super();

      const root = this.attachShadow({ mode: "open", delegatesFocus: true });
      root.adoptedStyleSheets = [hostStyles!];

      // Properties set before the element was upgraded are own properties that shadow the
      // forwarders on the prototype; re-apply them so they go through the forwarders instead.
      // Read-only members have no forwarder to write through, so they are left as they are
      for (const [key, kind] of [...members!, ["variant", "accessor"] as const]) {
        if (kind !== "readonly" && Object.hasOwn(this, key)) {
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
      if (!child || !variants[this.#variant!]!.attributes.includes(name)) return;

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

      this.#variant = value;

      const { tagName } = variants[value]!;
      if (customElements.get(tagName)) {
        this.#create();
        return;
      }

      void customElements.whenDefined(tagName).then(() => this.#create());

      if (!awaiting.has(tagName)) {
        awaiting.add(tagName);
        setTimeout(() => {
          if (customElements.get(tagName)) return;
          console.warn(
            `<${tagName}> has not been defined after ${DEFINITION_WARNING_DELAY}ms; ` +
              `is the module that defines it imported?`,
          );
        }, DEFINITION_WARNING_DELAY);
      }
    }

    /**
     * Create the child for the selected variant, once its element has been defined.
     */
    #create() {
      const descriptor = variants[this.#variant!]!;
      const child = document.createElement(descriptor.tagName) as HTMLElement &
        Record<PropertyKey, unknown>;
      child.part.add(VARIANT_PART);

      if (descriptor.parts.length > 0) {
        child.setAttribute("exportparts", descriptor.parts.join(", "));
      }

      const attributes = descriptor.attributes.filter((attribute) => attribute !== "variant");

      for (const attribute of attributes) {
        if (this.hasAttribute(attribute)) copyAttribute(this, child, attribute);
      }

      for (const [key, pendingValue] of this.#pending) child[key] = pendingValue;
      this.#pending.clear();

      this.#forwardEvents(child);
      this.#reflectAttributes(child, attributes);
      this.#forwardSlots(child, descriptor.slots);

      if (!checked.has(descriptor.tagName)) {
        checked.add(descriptor.tagName);
        checkDescriptor(descriptor, child);
      }

      this.#child = child;
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
     * Create a forwarding `<slot>` within the child for the default slot and every named slot,
     * so that slotted content reaches the child's own slots.
     */
    #forwardSlots(child: HTMLElement, names: readonly string[]) {
      child.append(document.createElement("slot"));

      for (const name of names) {
        const slot = document.createElement("slot");
        slot.name = name;
        slot.slot = name;
        child.append(slot);
      }
    }
  }

  return VariantHost as unknown as VariantElementConstructor<M>;
}
