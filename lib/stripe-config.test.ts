import { describe, expect, it } from "vitest";

import { isStripeKeyConfigured } from "./stripe-config";

describe("isStripeKeyConfigured", () => {
  it.each([undefined, "", "   ", "replace_with_stripe_secret_key"])(
    "rejects missing or placeholder key %j",
    (value) => {
      expect(isStripeKeyConfigured(value)).toBe(false);
    }
  );

  it("accepts a configured Stripe key", () => {
    expect(isStripeKeyConfigured("sk_test_example")).toBe(true);
  });
});
