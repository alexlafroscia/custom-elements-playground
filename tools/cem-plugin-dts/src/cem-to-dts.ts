import { posix } from "node:path";

import * as schema from "custom-elements-manifest" with { type: "json" };
import * as dom from "dts-dom";

type Package = schema.Package;

interface Options {
  customElementsManifest: Package;

  /**
   * Where the emitted file will be written, relative to the same root the
   * manifest's module paths are relative to. Imports of types from local
   * modules are emitted relative to this location; when omitted, the output is
   * assumed to live at that root.
   */
  path?: string;
}

/**
 * A local module reference holds a path like `src/types.ts` relative to the
 * manifest root; the import points at that exact file, relativized to the
 * emitted file's location.
 */
function localImportSpecifier(moduleRef: string, outputPath: string | undefined): string {
  const outputDir = outputPath ? posix.dirname(posix.normalize(outputPath)) : ".";
  const specifier = posix.relative(outputDir, posix.normalize(moduleRef));
  return specifier.startsWith(".") ? specifier : `./${specifier}`;
}

export function cemToDts({ customElementsManifest, path: outputPath }: Options): string {
  const declarations: dom.TopLevelDeclaration[] = [];
  const tagNameMap = dom.create.interface("HTMLElementTagNameMap");

  // Referenced types must be imported for the emitted declarations to resolve;
  // globally-available types (`global:`) need nothing. For external types, a
  // reference's `module` is a subpath within its `package` and the two are
  // joined; a reference with only a `module` is a local module in this package.
  const importsBySpecifier = new Map<string, Set<string>>();
  function collectImports(type: schema.Type | undefined): void {
    for (const reference of type?.references ?? []) {
      if (reference.package === "global:") continue;

      let specifier: string | undefined;
      if (reference.package) {
        specifier = reference.module
          ? `${reference.package}/${reference.module}`
          : reference.package;
      } else if (reference.module) {
        specifier = localImportSpecifier(reference.module, outputPath);
      }
      if (!specifier) continue;

      const names = importsBySpecifier.get(specifier) ?? new Set();
      names.add(reference.name);
      importsBySpecifier.set(specifier, names);
    }
  }

  for (const module of customElementsManifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (
        declaration.kind !== "class" ||
        !("customElement" in declaration) ||
        !declaration.tagName
      ) {
        continue;
      }

      const interfaceName = `HTML${declaration.name}Element`;
      const iface = dom.create.interface(interfaceName);
      iface.baseTypes = [dom.create.interface("HTMLElement")];

      for (const member of declaration.members ?? []) {
        if (member.kind === "field") {
          if (!member.type) continue;
          collectImports(member.type);
          const prop = dom.create.property(member.name, mapType(member.type.text));
          if (member.description) {
            prop.jsDocComment = member.description;
          }
          iface.members.push(prop);
        } else if (member.kind === "method") {
          const parameters = (member.parameters ?? []).map((param) => {
            collectImports(param.type);
            return dom.create.parameter(
              param.name,
              param.type ? mapType(param.type.text) : dom.type.any,
            );
          });
          collectImports(member.return?.type);
          const returnType = member.return?.type ? mapType(member.return.type.text) : dom.type.void;
          const method = dom.create.method(member.name, parameters, returnType);
          if (member.description) {
            method.jsDocComment = member.description;
          }
          iface.members.push(method);
        }
      }

      declarations.push(iface);
      tagNameMap.members.push(
        dom.create.property(declaration.tagName, dom.create.namedTypeReference(interfaceName)),
      );
    }
  }

  declarations.push(tagNameMap);

  // dts-dom@3.7.0 omits the space before `extends` in interface declarations
  const inner = declarations
    .map((d) => dom.emit(d).replace(/(\w)(extends )/g, "$1 $2"))
    .join("\n")
    .replace(/^declare /gm, "");

  const imports = [...importsBySpecifier]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([specifier, names]) => {
      return `import type { ${[...names].sort().join(", ")} } from "${specifier}";`;
    })
    .join("\n");

  return `${imports ? `${imports}\n\n` : ""}export {};\n\ndeclare global {\n${inner}}\n`;
}

function mapType(typeText: string): dom.Type {
  switch (typeText) {
    case "string":
      return dom.type.string;
    case "number":
      return dom.type.number;
    case "boolean":
      return dom.type.boolean;
    case "void":
      return dom.type.void;
    default:
      return dom.create.namedTypeReference(typeText);
  }
}
