export interface VariantMember {
  readonly name: string;
  readonly kind: "field" | "method";
  readonly readonly?: boolean;
}

/**
 * Describes an element that may be used as a variant: its tag name, and the parts of its public
 * interface that the wrapper forwards. Usually produced from a Custom Elements Manifest with
 * `describeVariant`, but may also be written by hand.
 */
export interface VariantDescriptor<T extends string = string> {
  readonly tagName: T;
  /** Attributes forwarded to, and reflected from, the variant element */
  readonly attributes: readonly string[];
  /** Public properties and methods forwarded to the variant element */
  readonly members: readonly VariantMember[];
  /** Named slots forwarded to the variant element; the default slot is always forwarded */
  readonly slots: readonly string[];
  /** Parts within the variant element's shadow root that are exported through the wrapper */
  readonly parts: readonly string[];
}

export type Variants = Record<string, VariantDescriptor<keyof HTMLElementTagNameMap>>;

/**
 * The wrapper owns the `variant` property, so variant elements may not declare one of their own.
 */
export type ValidVariants<M extends Variants> = {
  [K in keyof M]: "variant" extends keyof HTMLElementTagNameMap[M[K]["tagName"]] ? never : M[K];
};

/**
 * The instance type of an element created by `createVariantElement`: a union of each variant's
 * instance type, discriminated on the `variant` property.
 */
export type VariantElement<M extends Variants> = {
  [K in keyof M & string]: HTMLElementTagNameMap[M[K]["tagName"]] & { variant: K };
}[keyof M & string];

export interface VariantElementConstructor<M extends Variants> {
  new (): VariantElement<M>;
  readonly variants: M;
  readonly observedAttributes: string[];
}

export type MemberKind = "accessor" | "readonly" | "method";
