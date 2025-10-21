/**
 * Redis Command Type Definitions
 *
 * Provides type-safe interfaces for Redis commands with flexible return types.
 * Generic defaults ensure backwards compatibility while enabling strong typing.
 */

/**
 * Result of a Redis command operation
 *
 * @template T The type of data expected from the command (defaults to any)
 *
 * @example
 * // Without type parameter
 * const result: RedisCommandResult = await sendCommand(...);
 *
 * @example
 * // With type parameter (type-safe)
 * const result: RedisCommandResult<string> = await sendCommand<string>(...);
 * if (result.data) {
 *   console.log(result.data.toUpperCase()); // ✅ String methods available
 * }
 */
export interface RedisCommandResult<T = any> {
  /** The data returned from Redis (null if command failed or no data) */
  data: T | null;

  /** Error message if operation failed (null if successful) */
  error: string | null;
}

/**
 * Options for Redis command execution
 */
export interface RedisCommandOptions {
  /** Number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Initial retry delay in milliseconds (default: 100) */
  retryDelay?: number;

  /** Whether to throw on error instead of returning error in result */
  throwOnError?: boolean;
}

/**
 * Redis command types (for documentation/suggestions, not enforced)
 *
 * Note: This is a union type for IDE suggestions, but the system
 * accepts any string to remain flexible for new commands.
 */
export type RedisCommand =
  | "SET"
  | "GET"
  | "DEL"
  | "HSET"
  | "HGET"
  | "HGETALL"
  | "HDEL"
  | "SADD"
  | "SREM"
  | "SMEMBERS"
  | "RPUSH"
  | "LPOP"
  | "LRANGE"
  | "ZADD"
  | "ZREM"
  | "ZRANGE"
  | "INCR"
  | "**GETALL**" // Custom command for getting all key data
  | string; // Allow any string for flexibility

/**
 * Batch command structure
 */
export interface RedisBatchCommand {
  command: string;
  key: string;
  args?: any[];
}
