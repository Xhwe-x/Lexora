import { describe, expect, it } from "vitest";

import {
  getUnconfiguredPreviewBehavior,
  isClerkConfigured,
} from "./preview-mode";

describe("isClerkConfigured", () => {
  it("requires both Clerk keys", () => {
    expect(
      isClerkConfigured({
        publishableKey: "pk_test_example",
        secretKey: "sk_test_example",
      })
    ).toBe(true);
    expect(
      isClerkConfigured({
        publishableKey: "pk_test_example",
        secretKey: undefined,
      })
    ).toBe(false);
  });

  it("rejects documented placeholder values", () => {
    expect(
      isClerkConfigured({
        publishableKey: "replace_with_clerk_publishable_key",
        secretKey: "replace_with_clerk_secret_key",
      })
    ).toBe(false);
  });
});

describe("getUnconfiguredPreviewBehavior", () => {
  it("allows the public homepage", () => {
    expect(getUnconfiguredPreviewBehavior("/")).toBe("ALLOW");
  });

  it("makes API routes unavailable", () => {
    expect(getUnconfiguredPreviewBehavior("/api/courses")).toBe(
      "API_UNAVAILABLE"
    );
    expect(getUnconfiguredPreviewBehavior("/api")).toBe("API_UNAVAILABLE");
    expect(getUnconfiguredPreviewBehavior("/trpc/progress")).toBe(
      "API_UNAVAILABLE"
    );
  });

  it("redirects protected pages to the public homepage", () => {
    expect(getUnconfiguredPreviewBehavior("/learn")).toBe("REDIRECT_HOME");
    expect(getUnconfiguredPreviewBehavior("/sign-in/test")).toBe(
      "REDIRECT_HOME"
    );
  });
});
