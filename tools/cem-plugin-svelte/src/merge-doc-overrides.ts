/**
 * Merges partial overrides into a named array.
 *
 * For each override, if an item with the same name already exists it is
 * shallow-merged (defined override values take precedence). Items that have
 * no match in the existing array are appended via `makeNew`.
 */
export function mergeDocOverrides<T extends { name: string }, U extends { name: string }>(
  existing: T[],
  overrides: U[],
  makeNew: (override: U) => T,
): T[] {
  const matched = new Set<string>();

  const result = existing.map((item) => {
    const override = overrides.find((o) => o.name === item.name);
    if (!override) return item;
    matched.add(item.name);
    const defined = Object.fromEntries(Object.entries(override).filter(([, v]) => v !== undefined));
    return { ...item, ...defined } as T;
  });

  for (const override of overrides) {
    if (!matched.has(override.name)) {
      result.push(makeNew(override));
    }
  }

  return result;
}
