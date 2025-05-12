import { onUnmounted } from "vue";
import { SyncBus } from "@/composables/shared/SyncBus";
import { Events, ValidEvent } from "@/types/Events";

export function useSyncBus() {
  const subscriber = Symbol("syncBusSubscriber"); // ✅ Unique reference for each component
  const registeredEvents = new Set<string>(); // ✅ Track subscribed events for proper cleanup

  /**
   * Subscribe to a SyncBus event with type safety and automatic cleanup.
   */
  function onBusEvent<K extends ValidEvent<Events>>(
    event: K,
    handler: (payload: K extends keyof Events ? Events[K] : any) => void
  ) {
    SyncBus.on({ subscriber }, event, handler);
    registeredEvents.add(event as string); // ✅ Track registered event
  }

  /**
   * Emit a SyncBus event with type safety.
   */
  function emitBusEvent<K extends ValidEvent<Events>>(event: K, payload: K extends keyof Events ? Events[K] : any) {
    SyncBus.emit(event, payload);
  }

  /**
   * Cleanup: Automatically remove only registered listeners on component unmount.
   */
  onUnmounted(() => {
    registeredEvents.forEach((event) => {
      SyncBus.off({ subscriber }, event as keyof Events);
    });
  });

  return { onBusEvent, emitBusEvent };
}
