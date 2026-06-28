import { ref } from "lit/directives/ref.js";

export function initializeRegistry(registry: CustomElementRegistry) {
  return ref((element) => {
    if (element) {
      registry.initialize(element);
    }
  });
}
