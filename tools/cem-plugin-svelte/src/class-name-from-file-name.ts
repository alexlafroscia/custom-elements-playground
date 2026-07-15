/**
 * Derive a valid class name from a Svelte file name, matching the way
 * `svelte2tsx` names the generated component (e.g. `my-greeter` → `MyGreeter`)
 */
export function classNameFromFileName(fileName: string): string {
  return fileName
    .split(/[^A-Za-z0-9_$]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}
