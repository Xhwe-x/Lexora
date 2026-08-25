import { describe, expect, it } from "vitest";

import { normalizeWord } from "./normalize-word";

describe("normalizeWord", () => {
  it.each([
    [" Available ", "available"],
    ["ABANDON", "abandon"],
    ["maintain", "maintain"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeWord(input)).toBe(expected);
  });
});
