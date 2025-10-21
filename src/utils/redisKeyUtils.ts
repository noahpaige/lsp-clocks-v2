/**
 * Redis Key Utility Functions
 *
 * Centralized utilities for generating, validating, and parsing Redis keys.
 * This ensures consistency across the application and makes key management easier.
 */

import { REDIS_CONFIG } from "@/config/constants";

// ============================================================================
// Display Configuration Key Utilities
// ============================================================================

/**
 * Generate a Redis key for a display configuration
 * @param id - The display configuration ID
 * @returns The full Redis key (e.g., "clock-display-config:my-display")
 */
export function getDisplayConfigKey(id: string): string {
  return `${REDIS_CONFIG.KEYS.DISPLAY_CONFIG.PREFIX}${id}`;
}

/**
 * Generate a display configuration list key
 * @returns The Redis key for the display config list set
 */
export function getDisplayConfigListKey(): string {
  return REDIS_CONFIG.KEYS.DISPLAY_CONFIG.LIST;
}

/**
 * Check if a Redis key matches the display config pattern
 * @param key - The Redis key to check
 * @returns True if the key is a display configuration key
 */
export function isDisplayConfigKey(key: string): boolean {
  return REDIS_CONFIG.KEYS.DISPLAY_CONFIG.PATTERN.test(key);
}

/**
 * Extract display config ID from a Redis key
 * @param key - The Redis key (e.g., "clock-display-config:my-display")
 * @returns The display config ID or null if not a valid display config key
 */
export function extractDisplayConfigId(key: string): string | null {
  if (!isDisplayConfigKey(key)) return null;
  return key.replace(REDIS_CONFIG.KEYS.DISPLAY_CONFIG.PREFIX, "");
}

// ============================================================================
// Generic Key Utilities (for future expansion)
// ============================================================================

/**
 * Generate a lock key for a given Redis key
 * @param redisKey - The resource key to lock
 * @returns The lock key (e.g., "lock:clock-display-config:my-display")
 */
export function getLockKey(redisKey: string): string {
  return `lock:${redisKey}`;
}

/**
 * Parse a Redis key into its components
 * @param key - The Redis key to parse
 * @returns Object with prefix and id, or null if invalid
 */
export function parseRedisKey(key: string): { prefix: string; id: string } | null {
  const colonIndex = key.lastIndexOf(":");
  if (colonIndex === -1) return null;

  return {
    prefix: key.substring(0, colonIndex + 1),
    id: key.substring(colonIndex + 1),
  };
}
