import { onMounted, onUnmounted, ref } from "vue";
import io from "socket.io-client";

const WS_URL = "http://localhost:3000";

export function useRedisObserver() {
  let socket: ReturnType<typeof io> | null = null;
  const observers = new Map<string, Function[]>();
  // Queue to store pending observer subscriptions
  const pendingQueue: { key: string; callback: Function }[] = [];
  const isConnected = ref(false);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  // Flush queued observer subscriptions once connected
  const processPendingQueue = () => {
    if (socket) {
      pendingQueue.forEach(({ key, callback }) => {
        if (!observers.has(key)) {
          observers.set(key, []);
          socket.emit("subscribe", key);
        }
        observers.get(key)?.push(callback);
      });
      pendingQueue.length = 0; // Clear the queue
    }
  };

  const connectSocket = () => {
    socket = io(WS_URL, { reconnection: false });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      isConnected.value = true;
      reconnectAttempts = 0;

      // Process any pending subscriptions
      processPendingQueue();

      // Re-subscribe to all keys in case of a reconnect
      observers.forEach((_, key) => socket?.emit("subscribe", key));
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

    socket.on("redis-update", (data: { key: string }) => {
      observers.get(data.key)?.forEach((cb) => cb(data));
    });
  };

  onMounted(connectSocket);
  onUnmounted(() => {
    if (socket) {
      socket.disconnect();
      console.log("WebSocket disconnected on unmount");
    }
  });

  // Updated addObserver that queues if the socket is not ready
  const addObserver = (key: string, callback: Function) => {
    if (!socket || !isConnected.value) {
      console.warn(`Socket not connected yet, queuing observer for key: ${key}`);
      pendingQueue.push({ key, callback });
      return;
    }

    if (!observers.has(key)) {
      observers.set(key, []);
      socket.emit("subscribe", key);
    }
    observers.get(key)?.push(callback);
  };

  return {
    addObserver,
    isConnected,
  };
}
