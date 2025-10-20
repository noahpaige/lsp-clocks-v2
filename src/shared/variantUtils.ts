/**
 * Sanitize variant name to prevent path traversal and ensure safe filenames
 * Shared between server and client for consistency
 */
export function sanitizeVariant(variant: string): string {
  // Only allow alphanumeric, dash, underscore
  return variant.replace(/[^a-zA-Z0-9-_]/g, "-").substring(0, 50);
}

/**
 * Validate variant name
 */
export function isValidVariant(variant: string): boolean {
  return /^[a-zA-Z0-9-_]{1,50}$/.test(variant);
}
