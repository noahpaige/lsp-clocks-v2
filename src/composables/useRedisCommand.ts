import { getApiUrl } from "@/utils/apiUtils";
import { API_CONFIG } from "@/config/constants";
import type { RedisCommandResult, RedisCommandOptions, RedisBatchCommand } from "@/types/RedisCommand";

const API_URL = getApiUrl(API_CONFIG.ENDPOINTS.REDIS_COMMANDS);

export function useRedisCommand() {
  const queue: RedisBatchCommand[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;
  const BATCH_DELAY = 100;
  const MAX_RETRIES = 3;

  const withRetry = async <T = any>(requestFn: () => Promise<T>, retries = MAX_RETRIES, delay = 100): Promise<T> => {
    try {
      return await requestFn();
    } catch (error) {
      if (retries <= 0) {
        console.error("Max retries reached. Request failed.");
        throw error;
      }

      console.warn(`Retrying request in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(requestFn, retries - 1, delay * 2);
    }
  };

  const sendInstantCommand = async <T = any>(
    command: string,
    key: string,
    args: any[] = [],
    options?: RedisCommandOptions
  ): Promise<RedisCommandResult<T>> => {
    const maxRetries = options?.maxRetries ?? MAX_RETRIES;
    const retryDelay = options?.retryDelay ?? 100;

    try {
      return await withRetry(
        async () => {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command, key, args }),
          });

          if (!response.ok) {
            const error = `Error: ${response.statusText}`;
            if (options?.throwOnError) {
              throw new Error(error);
            }
            return { data: null, error };
          }

          const data = await response.json();
          return { data: data as T, error: null };
        },
        maxRetries,
        retryDelay
      );
    } catch (error: any) {
      if (options?.throwOnError) {
        throw error;
      }
      return { data: null, error: error.message || "Max retries reached. Request failed." };
    }
  };

  const sendCommand = (command: string, key: string, args: any[] = []) => {
    const existingIndex = queue.findIndex((cmd) => cmd.key === key && cmd.command === command);
    if (existingIndex !== -1) {
      queue.splice(existingIndex, 1);
    }

    queue.push({ command, key, args });

    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }

    batchTimeout = setTimeout(processBatch, BATCH_DELAY);
  };

  const processBatch = async () => {
    if (queue.length === 0) return;

    const batchCommands = [...queue];
    queue.length = 0;

    return withRetry(async () => {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: batchCommands }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      console.log("Batch request successful:", await response.json());
    });
  };

  return { sendCommand, sendInstantCommand };
}
