// Future Dev :: Throttling and debouncing help control how often events are emitted.
// - **Throttling** ensures an event is fired at most once in a specified time period (e.g., limit frequent updates like typing events).
// - **Debouncing** delays event execution until no new events occur within a set time window (e.g., wait before sending a search request).
// Using them can prevent excessive event emissions, improving performance and reducing unnecessary cross-tab communication.

// Future DEV :: Scoped Events
// add scopeed events chat:message, chat:typing, user:loggedIn, etc.
// This makes it possible to:
//    Listen only for events within a specific scope (e.g., "chat:*").
//    Emit events with clear categorization (e.g., "user:profileUpdated" instead of "profileUpdated").
//    Filter events before they reach components.
// If/when we implement, we should use string prefixes for names, and allow for wildcard (chat:*) subscriptions.

// For our version of DataStore:
// To optimize performance, send only minimal updates (e.g., IDs) instead of full objects when notifying listeners of database changes.
// This reduces payload size, speeds up event processing, and allows listeners to fetch full data only when needed.
// ** Can use this to notify a tab of an update, and then make that tab fetch from the DB.

import mitt, { Emitter } from "mitt";
import { BroadcastChannel } from "broadcast-channel";
import { Events } from "@/types/Events";

class SyncBusProxy<T extends Record<string, any>> {
  // Ensures T is an object
  private emitter: Emitter<T>;
  private channel: BroadcastChannel<{ event: keyof T; payload: T[keyof T] }>;
  private listenerMap: WeakMap<object, Map<keyof T, (payload: any) => void>>;

  constructor(channelName: string) {
    this.emitter = mitt<T>();
    this.channel = new BroadcastChannel<{ event: keyof T; payload: T[keyof T] }>(channelName);
    this.listenerMap = new WeakMap();

    this.channel.onmessage = (data) => {
      this.emitter.emit(data.event, data.payload);
    };
  }

  /**
   * Subscribe an object to an event, tracking its handlers in WeakMap.
   */
  on<K extends keyof T>(subscriber: object, event: K, handler: (payload: T[K]) => void): void {
    this.emitter.on(event, handler);

    if (!this.listenerMap.has(subscriber)) {
      this.listenerMap.set(subscriber, new Map());
    }

    const eventHandlers = this.listenerMap.get(subscriber)!;
    eventHandlers.set(event, handler);
  }

  /**
   * Unsubscribe an object's event handler, using WeakMap for cleanup.
   */
  off<K extends keyof T>(subscriber: object, event: K): void {
    const eventHandlers = this.listenerMap.get(subscriber);
    if (eventHandlers && eventHandlers.has(event)) {
      const handler = eventHandlers.get(event)!;
      this.emitter.off(event, handler);
      eventHandlers.delete(event);

      if (eventHandlers.size === 0) {
        this.listenerMap.delete(subscriber);
      }
    }
  }

  /**
   * Publish an event (local and cross-tab).
   */
  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.emitter.emit(event, payload);
    this.channel.postMessage({ event, payload }); // ✅ Now correctly typed
  }

  /**
   * Close the broadcast channel when it's no longer needed.
   */
  close(): void {
    this.channel.close();
  }
}

export const SyncBus = new SyncBusProxy<Events>("app-events");

// Below are some explanations of common questions about this file

/*
 * 🔹 Why Do We Use `WeakMap`?
 * ----------------------------------------------------------
 * A `WeakMap` stores event listeners efficiently while preventing memory leaks.
 * - If a Vue component (or any object) is removed, its event handlers are automatically garbage collected.
 * - Unlike a regular `Map`, `WeakMap` does NOT prevent the garbage collector from cleaning up unused objects.
 *
 * ✅ Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
 *
 * 🛠️ Implementation in `SyncBusProxy`:
 * ```typescript
 * private listenerMap: WeakMap<object, Map<keyof T, (payload: any) => void>>;
 * ```
 * - The **key** is the subscribing object (e.g., a Vue component).
 * - The **value** is a `Map` that tracks event handlers for that object.
 * - If a component is destroyed, its handlers are removed automatically.
 */

/*
 * 🔹 What Does `T` Mean in `SyncBusProxy<T extends Events>`?
 * ----------------------------------------------------------
 * `T` is a **generic type parameter** that allows `SyncBusProxy` to work with different event structures.
 *
 * ✅ Benefits:
 * - Makes `SyncBusProxy` reusable with **custom event types**.
 * - TypeScript ensures that `T` **must match the `Events` type structure**.
 *
 * ✅ Example Usage:
 * ```typescript
 * const myBus = new SyncBusProxy<{ customEvent: number }>("custom-channel");
 * ```
 * - Here, `T` becomes `{ customEvent: number }`, making `myBus.emit("customEvent", 123);` **type-safe**.
 * - If `myBus.emit("randomEvent", "oops");` is called, TypeScript **throws an error**.
 *
 * ✅ More on Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html
 */

/*
 * 🔹 What Does `keyof T` Mean?
 * ----------------------------------------------------------
 * `keyof T` extracts **all valid event names** as a **union type**.
 *
 * ✅ Example:
 * ```typescript
 * type Events = {
 *   userLoggedIn: { id: number };
 *   userLoggedOut: undefined;
 * };
 * type EventNames = keyof Events; // "userLoggedIn" | "userLoggedOut"
 * ```
 * - This ensures that `EventNames` **can only be** `"userLoggedIn"` or `"userLoggedOut"`.
 *
 * ✅ In `SyncBusProxy`:
 * ```typescript
 * on<K extends keyof T>(subscriber: object, event: K, handler: (payload: T[K]) => void): void;
 * ```
 * - `K extends keyof T` → Ensures `event` **must be a valid event name**.
 * - `T[K]` → Ensures **payload matches the expected type** for that event.
 *
 * ✅ More on `keyof`: https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
 */
