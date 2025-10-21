/**
 * File System Utility Functions
 *
 * Generic, reusable file system operations that can be used throughout the server.
 * These are pure utilities with no domain-specific logic.
 */

import fs from "fs/promises";
import path from "path";

/**
 * Safely read and parse a JSON file
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON data
 * @throws Error with descriptive message on failure
 */
export async function safeReadJsonFile(filePath: string): Promise<any> {
  try {
    await fs.access(filePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error("File not found");
    }
    throw new Error(`Cannot access file: ${error.message}`);
  }

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Safely write data to a JSON file using atomic write operation
 * @param filePath - Path where the file should be written
 * @param data - Data to serialize and write
 * @throws Error with descriptive message on failure
 */
export async function safeWriteJsonFile(filePath: string, data: any): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const jsonContent = JSON.stringify(data, null, 2);

    // Atomic write: write to temp file, then rename
    // This prevents corruption if process is interrupted
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, jsonContent, "utf-8");
    await fs.rename(tempPath, filePath);
  } catch (error: any) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(`${filePath}.tmp`);
    } catch {}

    throw new Error(`Failed to write file: ${error.message}`);
  }
}

/**
 * Check if a file exists
 * @param filePath - Path to check
 * @returns True if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely delete a file (doesn't throw if file doesn't exist)
 * @param filePath - Path to the file to delete
 */
export async function safeDeleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    // File doesn't exist, that's fine
  }
}
