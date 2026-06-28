import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";

function makeUniqueName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 2,
  });
}
export function defineUniqueElement(constructor: CustomElementConstructor): string {
  const name = makeUniqueName();

  window.customElements.define(name, constructor);

  return name;
}
