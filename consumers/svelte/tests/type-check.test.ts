import * as assert from "node:assert";
import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const root = path.resolve(import.meta.dirname, "..");
const fixturePath = path.resolve(root, "type-tests/InvalidUsage.svelte");

interface ReportedError {
  line: number;
  message: string;
}

/**
 * Collects the errors declared by `@expect-error` comments, each of which
 * applies to the line after it
 */
async function expectedErrors(): Promise<ReportedError[]> {
  const source = await fs.readFile(fixturePath, { encoding: "utf-8" });

  return source.split("\n").flatMap((text, index) => {
    const match = text.match(/<!-- @expect-error (.*) -->/);
    return match ? [{ line: index + 2, message: match[1] }] : [];
  });
}

/**
 * Runs `svelte-check` against the type tests, returning the errors it reports
 */
async function reportedErrors(): Promise<ReportedError[]> {
  // `svelte-check` exits non-zero when it reports errors
  const { stdout } = await execFileAsync(
    "pnpm",
    ["exec", "svelte-check", "--tsconfig", "./type-tests/tsconfig.json", "--output", "machine"],
    { cwd: root },
  ).catch((error) => error);

  // Lines are formatted as `<timestamp> ERROR "<file>" <line>:<column> "<message>"`
  return (stdout as string).split("\n").flatMap((text) => {
    const match = text.match(/^\d+ ERROR "(.*)" (\d+):\d+ (".*")$/);
    if (!match || path.resolve(root, match[1]) !== fixturePath) return [];
    return [{ line: Number(match[2]), message: JSON.parse(match[3]) }];
  });
}

test("svelte-check reports invalid usage of the custom elements", async () => {
  const [expected, reported] = await Promise.all([expectedErrors(), reportedErrors()]);

  assert.ok(expected.length > 0, "the fixture declares no expected errors");
  assert.strictEqual(
    reported.length,
    expected.length,
    `expected ${expected.length} errors, but svelte-check reported:\n${JSON.stringify(reported, null, 2)}`,
  );

  for (const { line, message } of expected) {
    assert.ok(
      reported.some((error) => error.line === line && error.message.includes(message)),
      `expected an error on line ${line} including "${message}", but svelte-check reported:\n${JSON.stringify(reported, null, 2)}`,
    );
  }
});
