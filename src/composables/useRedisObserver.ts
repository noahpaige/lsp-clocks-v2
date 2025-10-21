import { onMounted, onUnmounted, ref } from "vue";
import io from "socket.io-client";
import { useRedisCommand } from "./useRedisCommand";
import { getWebSocketUrl } from "@/utils/apiUtils";
import { WS_CONFIG } from "@/config/constants";
import type { RedisObserverCallback, RedisUpdateEvent, AddObserverOptions } from "@/types/RedisObserver";

const WS_URL = getWebSocketUrl();
const INITIAL_EVENT = WS_CONFIG.EVENTS.INITIAL;

export function useRedisObserver() {
  let socket: ReturnType<typeof io> | null = null;
  const observers = new Map<string, RedisObserverCallback[]>();
  const pendingQueue: { key: string; callback: RedisObserverCallback; options?: AddObserverOptions }[] = [];
  const isConnected = ref(false);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  const { sendInstantCommand } = useRedisCommand();

  const processPendingQueue = () => {
    if (!socket) return;

    pendingQueue.forEach(({ key, callback }) => {
      if (!observers.has(key)) {
        observers.set(key, []);
        socket.emit("subscribe", key);
      }

      const callbacks = observers.get(key)!;
      if (!callbacks.includes(callback)) {
        callbacks.push(callback);
      }

      sendInstantCommand("**GETALL**", key).then(({ data, error }) => {
        if (!error) {
          if (data === null) {
            console.warn(`Key "${key}" does not exist, but subscriber was created anyway.`);
          }
          callback({ key, data, event: INITIAL_EVENT });
        } else {
          console.error(`Failed to fetch current value for key "${key}"`, error);
        }
      });
    });

    pendingQueue.length = 0;
  };

  const connectSocket = () => {
    socket = io(WS_URL, { reconnection: false });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      isConnected.value = true;
      reconnectAttempts = 0;

      // Re-subscribe to all existing keys first
      observers.forEach((_, key) => socket?.emit("subscribe", key));

      // Then process any queued observers
      setTimeout(processPendingQueue, 0); // Defer to avoid race
    });

    socket.on("disconnect", () => {
      console.warn("WebSocket disconnected");
      isConnected.value = false;

      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = 1000 * 2 ** reconnectAttempts;
        console.log(`Attempting reconnect in ${delay / 1000}s...`);
        reconnectAttempts++;
        setTimeout(connectSocket, delay);
      } else {
        console.error("Max reconnect attempts reached");
      }
    });

    socket.on("redis-update", (data: RedisUpdateEvent) => {
      observers.get(data.key)?.forEach((cb) => cb(data));
    });
  };

  onMounted(connectSocket);
  onUnmounted(() => {
    if (socket) {
      socket.off("*"); // Clear all listeners
      socket.disconnect();
      console.log("WebSocket disconnected on unmount");
    }
  });

  const addObserver = <T = any>(key: string, callback: RedisObserverCallback<T>, options?: AddObserverOptions) => {
    const add = () => {
      if (!observers.has(key)) {
        observers.set(key, []);
        socket?.emit("subscribe", key);
      }

      const callbacks = observers.get(key)!;
      if (!callbacks.includes(callback as RedisObserverCallback)) {
        callbacks.push(callback as RedisObserverCallback);
      }

      // Fetch initial value if not explicitly disabled
      const shouldFetchInitial = options?.fetchInitial !== false;
      if (shouldFetchInitial) {
        sendInstantCommand("**GETALL**", key).then(({ data, error }) => {
          if (!error) {
            if (data === null) {
              console.warn(`Key "${key}" does not exist, but subscriber was created anyway.`);
            }
            callback({ key, data, event: INITIAL_EVENT });
          } else {
            console.error(`Failed to fetch current value for key "${key}"`, error);
            options?.onError?.(new Error(error));
          }
        });
      }
    };

    if (!socket || !isConnected.value) {
      console.warn(`Socket not connected yet, queuing observer for key: ${key}`);
      pendingQueue.push({ key, callback: callback as RedisObserverCallback, options });
    } else {
      add();
    }
  };

  const removeObserver = <T = any>(key: string, callback: RedisObserverCallback<T>) => {
    const callbacks = observers.get(key);
    if (callbacks) {
      const index = callbacks.indexOf(callback as RedisObserverCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // Clean up if no more observers for this key
      if (callbacks.length === 0) {
        observers.delete(key);
        socket?.emit("unsubscribe", key);
      }
    }
  };

  return {
    addObserver,
    removeObserver,
    isConnected,
    INITIAL_EVENT,
  };
}
