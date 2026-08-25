export function isStripeKeyConfigured(value: string | undefined) {
  const normalizedValue = value?.trim();
  return Boolean(
    normalizedValue && !normalizedValue.startsWith("replace_with_")
  );
}
