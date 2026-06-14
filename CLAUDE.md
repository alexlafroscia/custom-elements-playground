# CLAUDE.md

## Running Scripts

This project uses [`mise`](https://mise.jdx.dev/) to manage tasks. Run tasks with `mise run <task>` from the relevant package directory (or from the root for workspace-level tasks).

### Root workspace

| Task                    | Description                      |
| ----------------------- | -------------------------------- |
| `mise run format`       | Format all files with oxfmt      |
| `mise run format:check` | Check formatting without writing |
| `mise run test`         | Run formatting check             |

### `tools/cem-plugin-dts`

| Task                       | Description                                 |
| -------------------------- | ------------------------------------------- |
| `mise run build`           | Compile TypeScript to `dist/`               |
| `mise run test`            | Build, typecheck tests, then run unit tests |
| `mise run typecheck:tests` | Type-check test files only                  |

### `tools/cem-plugin-svelte`

| Task                       | Description                                 |
| -------------------------- | ------------------------------------------- |
| `mise run build`           | Compile TypeScript to `dist/`               |
| `mise run test`            | Build, typecheck tests, then run unit tests |
| `mise run typecheck:tests` | Type-check test files only                  |

### `definitions/svelte-vite-custom`

| Task                    | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `mise run build`        | Build library and Custom Elements Manifest       |
| `mise run build:src`    | Build the library via Vite                       |
| `mise run build:cem`    | Generate `custom-elements.json` via CEM analyzer |
| `mise run check`        | Run all svelte-check / tsc type checks           |
| `mise run test`         | Run checks and browser tests (headless)          |
| `mise run test:browser` | Run Vitest browser tests interactively           |

### Cross-package references

`mise` supports cross-package task dependencies using the `//path/to/package:task` syntax. For example, `build:cem` in `definitions/svelte-vite-custom` depends on `//tools/cem-plugin-dts:build` and `//tools/cem-plugin-svelte:build`, so those tool packages are built automatically when needed.
