import { ref } from "vue";
import { useRedisCommand } from "./useRedisCommand";
import { useRedisObserver } from "./useRedisObserver";
import { useSessionId } from "./useSessionId";
import { parseEditLock, type EditLock } from "@/types/EditLock";
import { logError } from "@/utils/errorUtils";

const LOCK_DURATION_MS = 300000; // 5 minutes
const LOCK_REFRESH_INTERVAL_MS = 60000; // 1 minute

export function useEditLock() {
  const { sendInstantCommand } = useRedisCommand();
  const { addObserver } = useRedisObserver();
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
      logError("useEditLock", "acquire lock", e, {
        redisKey,
        sessionId: sessionId.value,
        userName: userName.value,
      });
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
      logError("useEditLock", "release lock", e, { redisKey });
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
      logError("useEditLock", "check lock", e, { redisKey });
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
        logError("useEditLock", "refresh lock", e, { redisKey });
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

  /**
   * Observe real-time changes to a lock using Redis pub/sub
   * @param redisKey - The resource key (e.g., "clock-display-config:foo")
   * @param callback - Called when lock changes, receives EditLock | null
   */
  function observeLock(redisKey: string, callback: (lock: EditLock | null) => void) {
    const lockKey = getLockKey(redisKey);
    console.log(`[useEditLock] Setting up observer for lock: ${redisKey} (lock key: ${lockKey})`);

    addObserver(lockKey, (response: { key: string; data: any; event: string }) => {
      try {
        console.log(`[useEditLock] Observer callback triggered for ${redisKey}:`, {
          event: response.event,
          dataType: typeof response.data,
          data: response.data,
        });
        const raw = response.data;

        // Lock was deleted or doesn't exist
        if (!raw || raw === null || raw === "") {
          console.log(`[useEditLock] Observer detected lock removed/absent for: ${redisKey}`);
          callback(null);
          return;
        }

        // Parse lock data
        if (typeof raw === "string") {
          const parsed = parseEditLock(JSON.parse(raw));
          console.log(`[useEditLock] Observer detected lock update for: ${redisKey}`, parsed);

          // Check if lock is expired
          if (parsed.expires < Date.now()) {
            console.log(`[useEditLock] Observer found expired lock for: ${redisKey}`);
            callback(null);
            return;
          }

          // Return the lock regardless of who owns it
          // The callback can decide how to handle own vs others' locks
          console.log(`[useEditLock] Calling callback with lock owned by: ${parsed.userName}`);
          callback(parsed);
        } else {
          console.warn(`[useEditLock] Observer received unexpected data type for ${redisKey}:`, typeof raw);
          callback(null);
        }
      } catch (error) {
        logError("useEditLock", "parse lock data in observer", error, { redisKey });
        callback(null);
      }
    });
  }

  return {
    acquireLock,
    releaseLock,
    checkLock,
    releaseAllLocks,
    observeLock,
  };
}
