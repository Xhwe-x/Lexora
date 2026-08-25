import { describe, expect, it } from "vitest";

import { siteConfig } from "./index";

describe("siteConfig", () => {
  it("uses Lexora as the product title", () => {
    expect(siteConfig.title).toBe("Lexora");
  });
});
