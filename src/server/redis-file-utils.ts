import fs from "fs/promises";
import path from "path";
import { sanitizeVariant } from "@/shared/variantUtils";

const REDIS_KEYS_DIR = path.resolve(__dirname, "../../redis-keys");

export function keyToFileName(redisKey: string, variant: string = "default"): string {
  const sanitized = redisKey.replace(/:/g, ".");
  const safeVariant = sanitizeVariant(variant);
  return `${sanitized}.${safeVariant}.json`;
}

export function fileNameToKey(fileName: string): { key: string; variant: string } {
  const withoutExt = fileName.replace(/\.json$/, "");
  const parts = withoutExt.split(".");
  const variant = parts[parts.length - 1];
  const keySanitized = parts.slice(0, -1).join(".");
  const key = keySanitized.replace(/\./g, ":");
  return { key, variant };
}

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

export function stripVersionMetadata(data: any): any {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const { lastModifiedAt, lastModifiedBy, ...clean } = data;
    return clean;
  }
  return data;
}

export function addVersionMetadata(data: any, lastModifiedBy: string = "restore:user"): any {
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

export async function safeWriteJsonFile(filePath: string, data: any): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const jsonContent = JSON.stringify(data, null, 2);

    // Atomic write: write to temp file, then rename
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

export { REDIS_KEYS_DIR };
