import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";

function makeUniqueName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 2,
  });
}

export function defineUniqueElement(
  constructor: CustomElementConstructor,
  registry: CustomElementRegistry = window.customElements,
): string {
  const name = makeUniqueName();

  registry.define(name, constructor);

  return name;
}
