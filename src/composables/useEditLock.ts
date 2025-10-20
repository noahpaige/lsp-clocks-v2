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
      const lockKey = getLockKey(redisKey);
      console.log(`[useEditLock] Acquiring lock for key: ${redisKey} (lock key: ${lockKey})`);
      console.log(`[useEditLock] Session: ${sessionId.value}, User: ${userName.value}`);
      await sendInstantCommand("SET", lockKey, [JSON.stringify(lock), "EX", "300"]);
      console.log(`[useEditLock] Lock acquired successfully for: ${redisKey}`);
      startRefresh(redisKey);
      return lock;
    } catch (e) {
      console.error(`[useEditLock] Failed to acquire lock for ${redisKey}:`, e);
      return null;
    }
  }

  async function releaseLock(redisKey: string): Promise<void> {
    try {
      const lockKey = getLockKey(redisKey);
      console.log(`[useEditLock] Releasing lock for key: ${redisKey} (lock key: ${lockKey})`);
      await sendInstantCommand("DEL", lockKey);
      console.log(`[useEditLock] Lock released successfully for: ${redisKey}`);
    } catch (e) {
      console.error(`[useEditLock] Failed to release lock for ${redisKey}:`, e);
    } finally {
      stopRefresh(redisKey);
    }
  }

  async function checkLock(redisKey: string): Promise<EditLock | null> {
    try {
      const lockKey = getLockKey(redisKey);
      console.log(`[useEditLock] Checking lock for key: ${redisKey} (lock key: ${lockKey})`);
      const resp = await sendInstantCommand("GET", lockKey);
      const raw = resp?.data;
      if (!raw || typeof raw !== "string") {
        console.log(`[useEditLock] No lock found for: ${redisKey}`);
        return null;
      }
      const parsed = parseEditLock(JSON.parse(raw));
      console.log(`[useEditLock] Found lock:`, parsed);

      if (parsed.expires < Date.now()) {
        console.log(`[useEditLock] Lock expired for: ${redisKey}, releasing`);
        await releaseLock(redisKey);
        return null;
      }
      if (parsed.sessionId === sessionId.value) {
        console.log(`[useEditLock] Lock is owned by current session, ignoring`);
        return null;
      }
      console.log(`[useEditLock] Lock is held by another user: ${parsed.userName}`);
      return parsed;
    } catch (e) {
      console.error(`[useEditLock] Failed to check lock for ${redisKey}:`, e);
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
