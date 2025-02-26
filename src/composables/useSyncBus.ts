import { onUnmounted } from "vue";
import { SyncBus } from "@/logic/SyncBus/SyncBus";
import { Events } from "@/logic/SyncBus/Events";

export function useSyncBus() {
  const subscriber = Symbol("syncBusSubscriber"); // ✅ Unique reference for each component

  /**
   * Subscribe to a SyncBus event with type safety and automatic cleanup.
   */
  function onBusEvent<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void) {
    SyncBus.on(subscriber, event, handler);
  }

  /**
   * Emit a SyncBus event with type safety.
   */
  function emitBusEvent<K extends keyof Events>(event: K, payload: Events[K]) {
    SyncBus.emit(event, payload);
  }

  /**
   * Cleanup: Automatically remove listeners on component unmount.
   */
  onUnmounted(() => {
    for (const key of Object.keys(SyncBus)) {
      SyncBus.off(subscriber, key as keyof Events);
    }
  });

  return { onBusEvent, emitBusEvent };
}
