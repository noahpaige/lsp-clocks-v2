/**
 * Redis Observer Type Definitions
 *
 * Provides type-safe interfaces for Redis observers with opt-in type safety.
 * Using generic defaults allows backwards compatibility while enabling
 * strong typing where desired.
 */

/**
 * Redis data update event
 *
 * @template T The type of data expected from Redis (defaults to any for flexibility)
 *
 * @example
 * // Without type parameter (backwards compatible)
 * const event: RedisUpdateEvent = { key: "foo", event: "set", data: someData };
 *
 * @example
 * // With type parameter (type-safe)
 * const event: RedisUpdateEvent<ClockDisplayConfig> = {
 *   key: "clock-display-config:my-clock",
 *   event: "__initial__",
 *   data: myConfig
 * };
 */
export interface RedisUpdateEvent<T = any> {
  /** The Redis key that was updated */
  key: string;

  /** The type of event (e.g., "__initial__", "set", "del", "hset") */
  event: string;

  /** The data associated with the event */
  data: T;
}

/**
 * Callback function for Redis observers
 *
 * @template T The type of data expected from Redis (defaults to any for flexibility)
 *
 * @example
 * // Without type parameter (backwards compatible)
 * const callback: RedisObserverCallback = (event) => {
 *   console.log(event.data); // any type
 * };
 *
 * @example
 * // With type parameter (type-safe)
 * const callback: RedisObserverCallback<ClockDisplayConfig> = (event) => {
 *   console.log(event.data.id); // ✅ Type-safe access
 * };
 */
export type RedisObserverCallback<T = any> = (event: RedisUpdateEvent<T>) => void;

/**
 * Options for adding an observer
 */
export interface AddObserverOptions {
  /** Whether to fetch initial value immediately (default: true) */
  fetchInitial?: boolean;

  /** Custom error handler for this observer */
  onError?: (error: Error) => void;
}
