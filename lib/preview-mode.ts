type ClerkConfiguration = {
  publishableKey: string | undefined;
  secretKey: string | undefined;
};

export type UnconfiguredPreviewBehavior =
  "ALLOW" | "API_UNAVAILABLE" | "REDIRECT_HOME";

function isConfiguredKey(value: string | undefined) {
  const normalizedValue = value?.trim();
  return Boolean(
    normalizedValue && !normalizedValue.startsWith("replace_with_")
  );
}

export function isClerkConfigured({
  publishableKey,
  secretKey,
}: ClerkConfiguration) {
  return isConfiguredKey(publishableKey) && isConfiguredKey(secretKey);
}

export function getUnconfiguredPreviewBehavior(
  pathname: string
): UnconfiguredPreviewBehavior {
  if (pathname === "/") return "ALLOW";
  if (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/trpc" ||
    pathname.startsWith("/trpc/")
  ) {
    return "API_UNAVAILABLE";
  }
  return "REDIRECT_HOME";
}
