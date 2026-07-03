import { defineUniqueElement } from "./define-unique-element";

function shouldCreateDelegatePropertyDescriptor(name: string): boolean {
  return name !== "constructor";
}

export function makeElementDelegate(
  constructor: CustomElementConstructor,
): CustomElementConstructor {
  let instance: HTMLElement | undefined;

  function getInstance() {
    if (!instance) {
      throw new Error("Element to delegate to has not been defined");
    }

    return instance;
  }

  const preConnectionInstanceProps = {};

  class Delegate extends HTMLElement {
    constructor() {
      super();

      Object.setPrototypeOf(
        this,
        new Proxy(Object.create(HTMLElement.prototype), {
          get(_target, property, receiver) {
            const instance = getInstance();

            return Reflect.get(instance, property, receiver);
          },
          set(...args) {
            debugger;
            return Reflect.set(...args);
          },
        }),
      );
    }

    connectedCallback() {
      let registry = new CustomElementRegistry();
      const tagName = defineUniqueElement(constructor, registry);

      const shadow = this.attachShadow({
        mode: "open",
        customElementRegistry: registry,
      });

      instance = document.createElement(tagName);

      shadow.append(instance);
    }
  }

  // for (const [name, originalDescriptor] of Object.entries(
  //   Object.getOwnPropertyDescriptors(constructor.prototype),
  // )) {
  //   if (shouldCreateDelegatePropertyDescriptor(name)) {
  //     let delegateDescriptor: PropertyDescriptor = {};

  //     if (originalDescriptor.get) {
  //       delegateDescriptor.get = () => {
  //         debugger;

  //         const instance = getInstance();
  //         return Reflect.get(instance, name);
  //       };
  //     }

  //     if (originalDescriptor.set) {
  //       delegateDescriptor.set = (value) => {
  //         debugger;

  //         const instance = getInstance();
  //         return Reflect.set(instance, name, value);
  //       };
  //     }

  //     Object.defineProperty(Delegate, name, delegateDescriptor);
  //   }
  // }

  return Delegate;
}
