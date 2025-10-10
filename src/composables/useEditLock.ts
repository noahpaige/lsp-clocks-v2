import { ref } from "vue";
import { useRedisCommand } from "./useRedisCommand";
import { useSessionId } from "./useSessionId";
import { parseEditLock, type EditLock } from "@/types/EditLock";

const LOCK_DURATION_MS = 300000; // 5 minutes
const LOCK_REFRESH_INTERVAL_MS = 60000; // 1 minute

export function useEditLock() {
  const { sendInstantCommand } = useRedisCommand();
  const { sessionId, userName } = useSessionId();

  const activeIntervals = ref<Map<string, NodeJS.Timeout>>(new Map());

  function getLockKey(configId: string) {
    return `display:config:lock:${configId}`;
  }

  async function acquireLock(configId: string): Promise<EditLock | null> {
    try {
      const lock: EditLock = {
        configId,
        sessionId: sessionId.value,
        userName: userName.value,
        timestamp: Date.now(),
        expires: Date.now() + LOCK_DURATION_MS,
      };
      await sendInstantCommand("SET", getLockKey(configId), [JSON.stringify(lock), "EX", "300"]);
      startRefresh(configId);
      return lock;
    } catch (e) {
      console.error("Failed to acquire lock", e);
      return null;
    }
  }

  async function releaseLock(configId: string): Promise<void> {
    try {
      await sendInstantCommand("DEL", getLockKey(configId));
    } catch (e) {
      console.error("Failed to release lock", e);
    } finally {
      stopRefresh(configId);
    }
  }

  async function checkLock(configId: string): Promise<EditLock | null> {
    try {
      const resp = await sendInstantCommand("GET", getLockKey(configId));
      const raw = resp?.data;
      if (!raw || typeof raw !== "string") return null;
      const parsed = parseEditLock(JSON.parse(raw));
      if (parsed.expires < Date.now()) {
        await releaseLock(configId);
        return null;
      }
      if (parsed.sessionId === sessionId.value) return null;
      return parsed;
    } catch (e) {
      console.error("Failed to check lock", e);
      return null;
    }
  }

  function startRefresh(configId: string) {
    stopRefresh(configId);
    const interval = setInterval(async () => {
      try {
        const lock: EditLock = {
          configId,
          sessionId: sessionId.value,
          userName: userName.value,
          timestamp: Date.now(),
          expires: Date.now() + LOCK_DURATION_MS,
        };
        await sendInstantCommand("SET", getLockKey(configId), [JSON.stringify(lock), "EX", "300"]);
      } catch (e) {
        console.error("Failed to refresh lock", e);
        stopRefresh(configId);
      }
    }, LOCK_REFRESH_INTERVAL_MS);
    activeIntervals.value.set(configId, interval);
  }

  function stopRefresh(configId: string) {
    const existing = activeIntervals.value.get(configId);
    if (existing) {
      clearInterval(existing);
      activeIntervals.value.delete(configId);
    }
  }

  function releaseAllLocks() {
    activeIntervals.value.forEach((_, id) => stopRefresh(id));
  }

  return {
    acquireLock,
    releaseLock,
    checkLock,
    releaseAllLocks,
  };
}
