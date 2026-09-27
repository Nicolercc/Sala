import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const tokenNames = [
  "surface-base",
  "surface-raised",
  "text-primary",
  "text-secondary",
  "border-default",
  "accent-default",
  "accent-subtle",
  "focus-ring",
  "status-waiting",
  "status-called",
  "status-in-room"
];

describe("design tokens", () => {
  it("defines every token in each theme mode", () => {
    const css = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
    const modes = ["light", "dark", "high-contrast"];

    for (const mode of modes) {
      const start = css.indexOf(`data-theme="${mode}"`);
      expect(start).toBeGreaterThan(-1);
      const block = css.slice(start, css.indexOf("}", start));
      for (const token of tokenNames) {
        expect(block).toContain(`--${token}:`);
      }
    }
  });
});
