import type * as schema from "custom-elements-manifest";

export type FieldEntry = schema.CustomElementField;

export type MethodEntry = schema.ClassMethod;

export type MemberEntry = FieldEntry | MethodEntry;

export type AttributeEntry = schema.Attribute;
