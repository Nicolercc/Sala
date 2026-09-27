import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function filesUnder(path: string): string[] {
  return readdirSync(path).flatMap((entry) => {
    const fullPath = join(path, entry);
    return statSync(fullPath).isDirectory() ? filesUnder(fullPath) : [fullPath];
  });
}

describe("board import boundary", () => {
  it("does not import the store or patient type from the route", () => {
    const files = filesUnder(join(process.cwd(), "src/app/board"));
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/@\/store|@\/types\/patient/);
      expect(source).not.toMatch(/src\/store|src\/types\/patient/);
    }
  });
});
