import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getUnconfiguredPreviewBehavior,
  isClerkConfigured,
} from "@/lib/preview-mode";

const clerkConfigured = isClerkConfigured({
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});
const configuredClerkMiddleware = clerkConfigured ? clerkMiddleware() : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (configuredClerkMiddleware) {
    return configuredClerkMiddleware(request, event);
  }

  const behavior = getUnconfiguredPreviewBehavior(request.nextUrl.pathname);

  if (behavior === "ALLOW") return NextResponse.next();

  if (behavior === "API_UNAVAILABLE") {
    return NextResponse.json(
      { error: "Authentication is not configured for this preview." },
      { status: 503 }
    );
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
