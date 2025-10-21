/**
 * Redis Persistence Utilities
 *
 * Utilities for managing Redis key persistence to the file system.
 * Handles conversion between Redis keys and file names, variant management,
 * and versioning metadata.
 */

import fs from "fs/promises";
import path from "path";
import { sanitizeVariant } from "@/shared/variantUtils";
import { safeReadJsonFile, safeWriteJsonFile } from "./file-system-utils";
import { FILE_CONFIG, REDIS_CONFIG } from "@/config/constants";

const REDIS_KEYS_DIR = path.resolve(__dirname, "../../redis-keys");

// ============================================================================
// Key ↔ Filename Conversion
// ============================================================================

/**
 * Convert a Redis key to a filename
 * @param redisKey - The Redis key (e.g., "clock-display-config:my-display")
 * @param variant - The variant name (e.g., "default", "production")
 * @returns Filename (e.g., "clock-display-config.my-display.default.json")
 */
export function keyToFileName(redisKey: string, variant: string = "default"): string {
  const sanitized = redisKey.replace(/:/g, ".");
  const safeVariant = sanitizeVariant(variant);
  return `${sanitized}.${safeVariant}.json`;
}

/**
 * Parse a filename back into Redis key and variant
 * @param fileName - The filename (e.g., "clock-display-config.my-display.default.json")
 * @returns Object with key and variant
 */
export function fileNameToKey(fileName: string): { key: string; variant: string } {
  const withoutExt = fileName.replace(/\.json$/, "");
  const parts = withoutExt.split(".");
  const variant = parts[parts.length - 1];
  const keySanitized = parts.slice(0, -1).join(".");
  const key = keySanitized.replace(/\./g, ":");
  return { key, variant };
}

// ============================================================================
// Variant Discovery
// ============================================================================

/**
 * List all available variants for a specific Redis key
 * @param redisKey - The Redis key to find variants for
 * @returns Array of variant names
 */
export async function listVariantsForKey(redisKey: string): Promise<string[]> {
  try {
    const sanitized = redisKey.replace(/:/g, ".");
    const prefix = `${sanitized}.`;
    const files = await fs.readdir(REDIS_KEYS_DIR);

    const variants = files
      .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
      .map((f) => f.replace(prefix, "").replace(".json", ""))
      .sort();

    return variants;
  } catch (error) {
    console.error(`Error listing variants for ${redisKey}:`, error);
    return [];
  }
}

/**
 * List all Redis keys that exist in a specific variant
 * @param variant - The variant name
 * @returns Array of Redis keys
 */
export async function listKeysForVariant(variant: string): Promise<string[]> {
  try {
    const safeVariant = sanitizeVariant(variant);
    const suffix = `.${safeVariant}.json`;
    const files = await fs.readdir(REDIS_KEYS_DIR);

    const keys = files
      .filter((f) => f.endsWith(suffix))
      .map((f) => {
        const { key } = fileNameToKey(f);
        return key;
      })
      .sort();

    return keys;
  } catch (error) {
    console.error(`Error listing keys for variant ${variant}:`, error);
    return [];
  }
}

/**
 * List all available variants across all keys
 * @param keyPattern - Optional regex to filter by key pattern
 * @returns Array of unique variant names
 */
export async function listAllVariants(keyPattern?: RegExp): Promise<string[]> {
  try {
    const files = await fs.readdir(REDIS_KEYS_DIR);
    const variants = new Set<string>();

    files
      .filter((f) => f.endsWith(".json"))
      .forEach((f) => {
        // If no pattern provided, include all files (backward compatibility)
        if (!keyPattern || keyPattern.test(f)) {
          const { variant } = fileNameToKey(f);
          variants.add(variant);
        }
      });

    return Array.from(variants).sort();
  } catch (error) {
    console.error("Error listing all variants:", error);
    return [];
  }
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Delete a specific key file for a variant
 * @param redisKey - The Redis key
 * @param variant - The variant name
 */
export async function deleteKeyFile(redisKey: string, variant: string): Promise<void> {
  const fileName = keyToFileName(redisKey, variant);
  const filePath = path.join(REDIS_KEYS_DIR, fileName);
  await fs.unlink(filePath);
}

// ============================================================================
// Versioning Metadata
// ============================================================================

/**
 * Remove version metadata fields from data object
 * @param data - Data object that may contain version fields
 * @returns Clean data without version fields
 */
export function stripVersionMetadata(data: any): any {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const { lastModifiedAt, lastModifiedBy, ...clean } = data;
    return clean;
  }
  return data;
}

/**
 * Add version metadata fields to data object
 * @param data - Data object to add version fields to
 * @param lastModifiedBy - User/system identifier for who made the modification
 * @returns Data with version fields added
 */
export function addVersionMetadata(
  data: any,
  lastModifiedBy: string = REDIS_CONFIG.VERSIONING.DEFAULT_MODIFIED_BY
): any {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const timestamp = Date.now();
    return {
      ...data,
      lastModifiedAt: timestamp,
      lastModifiedBy,
    };
  }
  return data;
}

// ============================================================================
// Exports
// ============================================================================

export { REDIS_KEYS_DIR, safeReadJsonFile, safeWriteJsonFile };
