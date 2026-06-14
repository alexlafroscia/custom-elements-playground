import * as schema from "custom-elements-manifest" with { type: "json" };
import * as dom from "dts-dom";

type Package = schema.Package;

interface Options {
  customElementsManifest: Package;
}

export function cemToDts({ customElementsManifest }: Options): string {
  const declarations: dom.TopLevelDeclaration[] = [];
  const tagNameMap = dom.create.interface("HTMLElementTagNameMap");

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
          const prop = dom.create.property(member.name, mapType(member.type.text));
          if (member.description) {
            prop.jsDocComment = member.description;
          }
          iface.members.push(prop);
        } else if (member.kind === "method") {
          const parameters = (member.parameters ?? []).map((param) =>
            dom.create.parameter(param.name, param.type ? mapType(param.type.text) : dom.type.any),
          );
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
  return declarations.map((d) => dom.emit(d).replace(/(\w)(extends )/g, "$1 $2")).join("\n");
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
