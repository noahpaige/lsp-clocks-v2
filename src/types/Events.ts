/**
 * Used in conjunction with SyncBus.
 * Defines all valid event names and their expected payloads.
 * This helps maintain a centralized event structure for SyncBusProxy.
 */

export type Events = {
  "user:loggedIn": { id: number; name: string };
  "user:loggedOut": undefined;
  "counter-updated": number;
  toast: {
    title: string;
    options?: Record<string, unknown>;
    type?: "success" | "info" | "warning" | "error"; // defaults to info
    deliverTo?: "displays" | "home" | "all"; // defaults to home
  };
  "toast:displays": {
    title: string;
    options?: Record<string, unknown>;
    type?: "success" | "info" | "warning" | "error"; // defaults to info
    deliverTo?: "displays" | "home" | "all"; // defaults to home
  };
  "toast:home": {
    title: string;
    options?: Record<string, unknown>;
    type?: "success" | "info" | "warning" | "error"; // defaults to info
    deliverTo?: "displays" | "home" | "all"; // defaults to home
  };
};

// ✅ Allows both scoped and non-scoped events
export type ScopedEvent<T extends string> = `${T}:${string}`;
export type ValidEvent<T> = keyof T | ScopedEvent<Extract<keyof T, string>>;

/*
 * 🔹 Why Do We Define `Events`?
 * ----------------------------------------------------------
 * The `Events` type defines a strict contract for allowed event names and their expected payloads.
 * - This prevents typos (e.g., `syncBus.emit("userLogin")` would fail if the correct event is `"userLoggedIn"`).
 * - TypeScript ensures that each event **only** receives the correct payload type.
 *
 * ✅ Example:
 * ```typescript
 * type Events = {
 *   userLoggedIn: { id: number; name: string };
 *   userLoggedOut: undefined;
 *   messageReceived: { sender: string; content: string };
 * };
 * ```
 * - If `userLoggedIn` expects `{ id: number; name: string }`, TypeScript enforces that structure.
 * - If `userLoggedOut` expects `undefined`, emitting anything else will cause a compile-time error.
 */
