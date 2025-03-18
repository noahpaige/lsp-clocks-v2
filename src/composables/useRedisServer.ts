import { onMounted, onUnmounted, ref } from 'vue';
import io from 'socket.io-client';

const WS_URL = 'http://localhost:3000';

export function useRedisObserver() {
  let socket: ReturnType<typeof io> | null = null; // ✅ Corrected type
  const observers = new Map<string, Function[]>();
  const isConnected = ref(false);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  const connectSocket = () => {
    socket = io(WS_URL, { reconnection: false });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      isConnected.value = true;
      reconnectAttempts = 0;

      // Resubscribe to all keys after reconnecting
      observers.forEach((_, key) => socket?.emit('subscribe', key));
    });

    socket.on('disconnect', () => {
      console.warn('WebSocket disconnected');
      isConnected.value = false;

      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = 1000 * 2 ** reconnectAttempts;
        console.log(`Attempting reconnect in ${delay / 1000}s...`);
        reconnectAttempts++;
        setTimeout(connectSocket, delay);
      } else {
        console.error('Max reconnect attempts reached');
      }
    });

    socket.on('redis-update', (data: { key: string }) => {
      observers.get(data.key)?.forEach((cb) => cb(data));
    });
  };

  onMounted(connectSocket);
  onUnmounted(() => {
    if (socket) {
      socket.disconnect();
      console.log('WebSocket disconnected on unmount');
    }
  });

  return {
    addObserver: (key: string, callback: Function) => {
      if (!socket) {
        console.warn('WebSocket not initialized yet');
        return;
      }

      if (!observers.has(key)) {
        observers.set(key, []);
        socket.emit('subscribe', key);
      }
      observers.get(key)?.push(callback);
    },
    isConnected
  };
}
