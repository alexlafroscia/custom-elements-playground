import { parse } from "comment-parser";
import type { AST } from "svelte/compiler";

import type { ParserCacheEntry } from "./parser-cache.js";

function normalizeDescription(desc: string): string | undefined {
  const trimmed = (desc.startsWith("- ") ? desc.slice(2) : desc).trim();
  return trimmed || undefined;
}

export interface ComponentDocNamedEntry {
  name: string;
  type?: { text: string };
  description?: string;
}

export interface ComponentDoc {
  description?: string;
  summary?: string;
  deprecated?: string | boolean;
  slots?: Array<{ name: string; description?: string }>;
  events?: Array<{ name: string; type?: { text: string }; description?: string }>;
  cssParts?: Array<{ name: string; description?: string }>;
  cssProperties?: Array<{ name: string; description?: string; syntax?: string }>;
  cssStates?: Array<{ name: string; description?: string }>;
  /** Overrides/additions for the `attributes` array (from `@attr` / `@attribute`). */
  attributes?: ComponentDocNamedEntry[];
  /** Overrides/additions for the `members` array (from `@prop` / `@property`). */
  props?: ComponentDocNamedEntry[];
}

export function resolveComponentDoc(cache: ParserCacheEntry): ComponentDoc | undefined {
  const commentNode = cache.svelte.fragment.nodes.find(
    (n): n is AST.Comment => n.type === "Comment" && n.data.trimStart().startsWith("@component"),
  );

  if (!commentNode) return undefined;

  const rawText = commentNode.data.trimStart().slice("@component".length);
  const [parsed] = parse(`/**${rawText}*/`);

  if (!parsed) return undefined;

  const doc: ComponentDoc = {};

  const description = parsed.description.trim();
  if (description) doc.description = description;

  const slots: NonNullable<ComponentDoc["slots"]> = [];
  const events: NonNullable<ComponentDoc["events"]> = [];
  const cssParts: NonNullable<ComponentDoc["cssParts"]> = [];
  const cssProperties: NonNullable<ComponentDoc["cssProperties"]> = [];
  const cssStates: NonNullable<ComponentDoc["cssStates"]> = [];
  const attributes: ComponentDocNamedEntry[] = [];
  const props: ComponentDocNamedEntry[] = [];

  for (const tag of parsed.tags) {
    switch (tag.tag) {
      case "slot": {
        const entry: { name: string; description?: string } = {
          name: tag.name === "-" ? "" : tag.name,
        };
        const desc = normalizeDescription(tag.description);
        if (desc !== undefined) entry.description = desc;
        slots.push(entry);
        break;
      }
      case "fires":
      case "event": {
        const entry: { name: string; type?: { text: string }; description?: string } = {
          name: tag.name === "-" ? "" : tag.name,
        };
        if (tag.type) entry.type = { text: tag.type };
        const desc = normalizeDescription(tag.description);
        if (desc !== undefined) entry.description = desc;
        events.push(entry);
        break;
      }
      case "csspart":
      case "part": {
        const entry: { name: string; description?: string } = {
          name: tag.name === "-" ? "" : tag.name,
        };
        const desc = normalizeDescription(tag.description);
        if (desc !== undefined) entry.description = desc;
        cssParts.push(entry);
        break;
      }
      case "cssprop":
      case "cssproperty": {
        const entry: { name: string; description?: string; syntax?: string } = {
          name: tag.name === "-" ? "" : tag.name,
        };
        if (tag.type) entry.syntax = tag.type;
        const desc = normalizeDescription(tag.description);
        if (desc !== undefined) entry.description = desc;
        cssProperties.push(entry);
        break;
      }
      case "cssstate":
      case "cssState": {
        const entry: { name: string; description?: string } = {
          name: tag.name === "-" ? "" : tag.name,
        };
        const desc = normalizeDescription(tag.description);
        if (desc !== undefined) entry.description = desc;
        cssStates.push(entry);
        break;
      }
      case "prop":
      case "property": {
        const entry: ComponentDocNamedEntry = {
          name: tag.name === "-" ? "" : tag.name,
        };
        if (tag.type) entry.type = { text: tag.type };
        const desc = normalizeDescription(tag.description);
        if (desc !== undefined) entry.description = desc;
        props.push(entry);
        break;
      }
      case "attr":
      case "attribute": {
        const entry: ComponentDocNamedEntry = {
          name: tag.name === "-" ? "" : tag.name,
        };
        if (tag.type) entry.type = { text: tag.type };
        const desc = normalizeDescription(tag.description);
        if (desc !== undefined) entry.description = desc;
        attributes.push(entry);
        break;
      }
      case "summary": {
        const parts = [tag.name, tag.description].filter((s) => s.trim());
        if (parts.length > 0) doc.summary = parts.join(" ");
        break;
      }
      case "deprecated": {
        const text = [tag.name, tag.description]
          .filter((s) => s.trim())
          .join(" ")
          .trim();
        doc.deprecated = text || true;
        break;
      }
    }
  }

  if (slots.length > 0) doc.slots = slots;
  if (events.length > 0) doc.events = events;
  if (cssParts.length > 0) doc.cssParts = cssParts;
  if (cssProperties.length > 0) doc.cssProperties = cssProperties;
  if (cssStates.length > 0) doc.cssStates = cssStates;
  if (attributes.length > 0) doc.attributes = attributes;
  if (props.length > 0) doc.props = props;

  return doc;
}
