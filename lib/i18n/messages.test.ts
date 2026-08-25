import { describe, expect, it } from "vitest";

import { messages, translate } from "./messages";

describe("messages", () => {
  it("keeps English and Chinese dictionary keys aligned", () => {
    expect(Object.keys(messages.en).sort()).toEqual(
      Object.keys(messages["zh-CN"]).sort()
    );
  });

  it("returns the requested localized message", () => {
    expect(translate("zh-CN", "brand.tagline")).toContain("词汇");
    expect(translate("en", "brand.tagline")).toContain("vocabulary");
  });

  it("falls back to Chinese and then the key for missing content", () => {
    const incomplete = {
      "zh-CN": { greeting: "你好" },
      en: {},
    };

    expect(translate("en", "greeting", incomplete)).toBe("你好");
    expect(translate("en", "missing", incomplete)).toBe("missing");
  });
});
