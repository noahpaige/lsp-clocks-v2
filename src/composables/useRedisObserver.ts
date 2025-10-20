import { onMounted, onUnmounted, ref } from "vue";
import io from "socket.io-client";
import { useRedisCommand } from "./useRedisCommand";

const WS_URL = "http://localhost:3000";
const INITIAL_EVENT = "__initial__";

export function useRedisObserver() {
  let socket: ReturnType<typeof io> | null = null;
  const observers = new Map<string, Function[]>();
  const pendingQueue: { key: string; callback: Function }[] = [];
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

    socket.on("redis-update", (data: { key: string; event: string; data: any }) => {
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

  const addObserver = (key: string, callback: Function) => {
    const add = () => {
      if (!observers.has(key)) {
        observers.set(key, []);
        socket?.emit("subscribe", key);
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
    };

    if (!socket || !isConnected.value) {
      console.warn(`Socket not connected yet, queuing observer for key: ${key}`);
      pendingQueue.push({ key, callback });
    } else {
      add();
    }
  };

  return {
    addObserver,
    isConnected,
    INITIAL_EVENT,
  };
}
