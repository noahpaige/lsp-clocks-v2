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

  function getLockKey(redisKey: string) {
    return `lock:${redisKey}`;
  }

  async function acquireLock(redisKey: string): Promise<EditLock | null> {
    try {
      const lock: EditLock = {
        resourceKey: redisKey,
        sessionId: sessionId.value,
        userName: userName.value,
        timestamp: Date.now(),
        expires: Date.now() + LOCK_DURATION_MS,
      };
      await sendInstantCommand("SET", getLockKey(redisKey), [JSON.stringify(lock), "EX", "300"]);
      startRefresh(redisKey);
      return lock;
    } catch (e) {
      console.error("Failed to acquire lock", e);
      return null;
    }
  }

  async function releaseLock(redisKey: string): Promise<void> {
    try {
      await sendInstantCommand("DEL", getLockKey(redisKey));
    } catch (e) {
      console.error("Failed to release lock", e);
    } finally {
      stopRefresh(redisKey);
    }
  }

  async function checkLock(redisKey: string): Promise<EditLock | null> {
    try {
      const resp = await sendInstantCommand("GET", getLockKey(redisKey));
      const raw = resp?.data;
      if (!raw || typeof raw !== "string") return null;
      const parsed = parseEditLock(JSON.parse(raw));
      if (parsed.expires < Date.now()) {
        await releaseLock(redisKey);
        return null;
      }
      if (parsed.sessionId === sessionId.value) return null;
      return parsed;
    } catch (e) {
      console.error("Failed to check lock", e);
      return null;
    }
  }

  function startRefresh(redisKey: string) {
    stopRefresh(redisKey);
    const interval = setInterval(async () => {
      try {
        const lock: EditLock = {
          resourceKey: redisKey,
          sessionId: sessionId.value,
          userName: userName.value,
          timestamp: Date.now(),
          expires: Date.now() + LOCK_DURATION_MS,
        };
        await sendInstantCommand("SET", getLockKey(redisKey), [JSON.stringify(lock), "EX", "300"]);
      } catch (e) {
        console.error("Failed to refresh lock", e);
        stopRefresh(redisKey);
      }
    }, LOCK_REFRESH_INTERVAL_MS);
    activeIntervals.value.set(redisKey, interval);
  }

  function stopRefresh(redisKey: string) {
    const existing = activeIntervals.value.get(redisKey);
    if (existing) {
      clearInterval(existing);
      activeIntervals.value.delete(redisKey);
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
