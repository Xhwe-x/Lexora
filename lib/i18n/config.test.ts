import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, detectBrowserLocale, resolveLocale } from "./config";

describe("resolveLocale", () => {
  it.each([
    ["zh-CN", "zh-CN"],
    ["en", "en"],
    ["en-US", "en"],
    ["zh", "zh-CN"],
  ] as const)("resolves %s to %s", (value, expected) => {
    expect(resolveLocale(value)).toBe(expected);
  });

  it.each([undefined, "", "fr", "unknown"])(
    "falls back to Chinese for %j",
    (value) => {
      expect(resolveLocale(value)).toBe(DEFAULT_LOCALE);
    }
  );
});

describe("detectBrowserLocale", () => {
  it("uses the first supported browser language", () => {
    expect(detectBrowserLocale(["en-US", "zh-CN"])).toBe("en");
    expect(detectBrowserLocale(["fr-FR", "zh-Hans"])).toBe("zh-CN");
  });

  it("defaults to Chinese when no browser language is supported", () => {
    expect(detectBrowserLocale(["fr-FR", "de-DE"])).toBe("zh-CN");
    expect(detectBrowserLocale([])).toBe("zh-CN");
  });
});
