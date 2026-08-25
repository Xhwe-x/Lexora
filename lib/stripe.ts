import Stripe from "stripe";

import { isStripeKeyConfigured } from "./stripe-config";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const apiKey = process.env.STRIPE_API_SECRET_KEY;

  if (!isStripeKeyConfigured(apiKey)) return null;

  stripeClient ??= new Stripe(apiKey!, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
  });

  return stripeClient;
}
