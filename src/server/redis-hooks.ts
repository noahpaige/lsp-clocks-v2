import { RedisClientType } from "redis";
import { REDIS_CONFIG } from "@/config/constants";
import { getDisplayConfigKey, extractDisplayConfigId } from "@/utils/redisKeyUtils";

/**
 * Hook function that runs after a key is restored to Redis
 * @param redis - Redis client instance
 * @param key - The key that was just restored
 * @param data - The data that was restored (after version metadata added)
 */
type PostRestoreHook = (redis: RedisClientType, key: string, data: any) => Promise<void>;

interface HookRegistration {
  pattern: RegExp;
  hook: PostRestoreHook;
  description?: string;
}

/**
 * Central registry for post-restore hooks.
 * Add new hooks here when you need side effects after restoring keys.
 */
const POST_RESTORE_HOOKS: HookRegistration[] = [
  {
    pattern: REDIS_CONFIG.KEYS.DISPLAY_CONFIG.PATTERN,
    description: "Maintain clock-display-config:list set",
    hook: async (redis, key, _data) => {
      const id = extractDisplayConfigId(key);
      if (id) {
        await redis.sAdd(REDIS_CONFIG.KEYS.DISPLAY_CONFIG.LIST, id);
        console.log(`Added ${id} to ${REDIS_CONFIG.KEYS.DISPLAY_CONFIG.LIST}`);
      }
    },
  },
  // Add more hooks here as needed
  // Example:
  // {
  //   pattern: /^user:/,
  //   description: "Maintain user index",
  //   hook: async (redis, key, data) => {
  //     const userId = key.replace("user:", "");
  //     await redis.sAdd("user:list", userId);
  //   },
  // },
];

/**
 * Execute all matching post-restore hooks for a given key
 */
export async function executePostRestoreHooks(redis: RedisClientType, key: string, data: any): Promise<void> {
  const matchingHooks = POST_RESTORE_HOOKS.filter((registration) => registration.pattern.test(key));

  for (const { hook, description } of matchingHooks) {
    try {
      await hook(redis, key, data);
    } catch (error) {
      console.error(`Post-restore hook failed for key "${key}"${description ? ` (${description})` : ""}:`, error);
      // Don't throw - we want other hooks to still run
    }
  }
}

/**
 * Register a new post-restore hook dynamically (optional, for advanced use cases)
 */
export function registerPostRestoreHook(pattern: RegExp, hook: PostRestoreHook, description?: string): void {
  POST_RESTORE_HOOKS.push({ pattern, hook, description });
}
