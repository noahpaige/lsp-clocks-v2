import { getApiUrl } from "@/utils/apiUtils";
import { API_CONFIG } from "@/config/constants";

const API_URL = getApiUrl(API_CONFIG.ENDPOINTS.REDIS_COMMANDS);

export function useRedisCommand() {
  const queue: { command: string; key: string; args?: any[] }[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;
  const BATCH_DELAY = 100;
  const MAX_RETRIES = 3;

  const withRetry = async (requestFn: () => Promise<any>, retries = MAX_RETRIES, delay = 100): Promise<any> => {
    try {
      return await requestFn();
    } catch (error) {
      if (retries <= 0) {
        console.error("Max retries reached. Request failed.");
        return { data: null, error: "Max retries reached. Request failed." };
      }

      console.warn(`Retrying request in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(requestFn, retries - 1, delay * 2);
    }
  };

  const sendInstantCommand = async (command: string, key: string, args: any[] = []) => {
    return withRetry(async () => {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, key, args }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      return { data: await response.json(), error: null };
    });
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
