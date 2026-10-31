import type { Package } from "custom-elements-manifest";
import { expect, expectTypeOf, test } from "vitest";

import type { VariantDescriptor } from "../src/index.ts";
import { describeVariant } from "../src/manifest.ts";

const manifest: Package = {
  schemaVersion: "2.1.0",
  modules: [
    {
      kind: "javascript-module",
      path: "src/helpers.ts",
      declarations: [{ kind: "function", name: "helper" }],
    },
    {
      kind: "javascript-module",
      path: "src/action-button.ts",
      declarations: [
        {
          kind: "class",
          customElement: true,
          name: "ActionButton",
          tagName: "action-button",
          members: [
            { kind: "field", name: "label" },
            { kind: "field", name: "pending", readonly: true },
            { kind: "method", name: "press" },
            { kind: "field", name: "internal", privacy: "private" },
            { kind: "method", name: "assist", privacy: "protected" },
            { kind: "field", name: "#secret" },
            { kind: "field", name: "styles", static: true },
          ],
          attributes: [{ name: "label", fieldName: "label" }],
          slots: [{ name: "" }, { name: "icon" }],
          cssParts: [{ name: "label" }],
        },
      ],
    },
  ],
};

test("describes the public interface of an element", () => {
  expect(describeVariant(manifest, "action-button")).toEqual({
    tagName: "action-button",
    attributes: ["label"],
    members: [
      { name: "label", kind: "field", readonly: false },
      { name: "pending", kind: "field", readonly: true },
      { name: "press", kind: "method" },
    ],
    slots: ["icon"],
    parts: ["label"],
  });
});

test("throws for an element that is not in the manifest", () => {
  expect(() => describeVariant(manifest, "missing-button")).toThrow(
    "<missing-button> was not found in the manifest",
  );
});

test("the descriptor keeps the literal tag name", () => {
  expectTypeOf(describeVariant(manifest, "action-button")).toEqualTypeOf<
    VariantDescriptor<"action-button">
  >();
});
