/**
 * Error Handling Utilities
 *
 * Provides consistent error handling, logging, and user-facing error messages
 * across the application.
 */

/**
 * Extract a user-friendly error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}

/**
 * Get detailed error context for logging/debugging
 */
export function getErrorContext(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  if (error && typeof error === "object") {
    return { ...error };
  }
  return { error: String(error) };
}

/**
 * Log an error with consistent formatting and context
 *
 * @param source - Component/function name (e.g., "useDisplayConfigs", "RedisAPI")
 * @param action - What was being attempted (e.g., "load config", "save to file")
 * @param error - The error that occurred
 * @param context - Additional context (e.g., { configId: "my-id", variant: "default" })
 */
export function logError(source: string, action: string, error: unknown, context?: Record<string, any>): void {
  const errorDetails = getErrorContext(error);

  console.error(`[${source}] Failed to ${action}:`, {
    ...context,
    error: errorDetails,
  });
}

/**
 * Create a user-friendly error message with action and context
 *
 * @param action - What failed (e.g., "load configuration", "save variant")
 * @param resourceId - Optional resource identifier (e.g., config ID, variant name)
 * @param error - The error that occurred
 * @returns Object with title and optional description for toast
 */
export function createUserErrorMessage(
  action: string,
  resourceId?: string,
  error?: unknown
): { title: string; description?: string } {
  const title = `Failed to ${action}`;

  if (!resourceId && !error) {
    return { title };
  }

  const parts: string[] = [];

  if (resourceId) {
    parts.push(`"${resourceId}"`);
  }

  if (error) {
    const message = getErrorMessage(error);
    // Only include error message if it's meaningful (not just "Error")
    if (message && message !== "Error" && message.length < 100) {
      parts.push(message);
    }
  }

  return {
    title,
    description: parts.length > 0 ? parts.join(": ") : undefined,
  };
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("timeout")
  );
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("invalid") || message.includes("validation") || message.includes("required");
}

/**
 * Get a retry suggestion based on error type
 */
export function getRetrySuggestion(error: unknown): string | null {
  if (isNetworkError(error)) {
    return "Please check your connection and try again.";
  }
  if (isValidationError(error)) {
    return "Please check your input and try again.";
  }
  return "Please try again or contact support if the issue persists.";
}
