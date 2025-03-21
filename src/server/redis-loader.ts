import { RedisClientType, createClient } from "redis";
import fs from "fs/promises";
import path from "path";

let redisInstance: RedisClientType | null = null;

async function getRedisInstance(redisUrl: string = "redis://localhost:6379"): Promise<RedisClientType> {
  if (!redisInstance) {
    redisInstance = createClient({ url: redisUrl });
    redisInstance.on("error", (err) => console.error("Redis Client Error:", err));
    await redisInstance.connect();
  }
  return redisInstance;
}

async function loadAllRedisKeys(directory: string, redisUrl: string = "redis://localhost:6379"): Promise<void> {
  const redis = await getRedisInstance(redisUrl);

  try {
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(directory, file);
      const jsonData = await loadJsonFile(filePath);
      if (jsonData) await storeInRedis(redis, jsonData);
    }

    console.log("All JSON files processed successfully.");
  } catch (error) {
    console.error("Error processing JSON files:", error);
  }
}

async function loadRedisKey(filePath: string): Promise<void> {
  try {
    const jsonData = await loadJsonFile(filePath);
    if (!jsonData) return;

    const redis = await getRedisInstance();
    await storeInRedis(redis, jsonData);
    console.log(`Processed file: ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

async function loadJsonFile(filePath: string): Promise<{ key: string; type: string; data: any } | null> {
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading/parsing file ${filePath}:`, error);
    return null;
  }
}

const redisCommands: Record<string, (redis: RedisClientType, key: string, data: any) => Promise<void>> = {
  string: async (redis, key, data) => {
    await redis.sendCommand(["SET", key, JSON.stringify(data)]);
  },

  hash: async (redis, key, data: Record<string, string | number>) => {
    const args = ["HSET", key, ...Object.entries(data).flatMap(([field, value]) => [field, String(value)])];
    await redis.sendCommand(args);
  },

  list: async (redis, key, data: (string | number)[]) => {
    const args = ["RPUSH", key, ...data.map(String)];
    await redis.sendCommand(args);
  },

  set: async (redis, key, data: (string | number)[]) => {
    const args = ["SADD", key, ...data.map(String)];
    await redis.sendCommand(args);
  },

  zset: async (redis, key, data: Record<string, number>) => {
    const args = ["ZADD", key];
    for (const [member, score] of Object.entries(data)) {
      args.push(score.toString(), member);
    }
    await redis.sendCommand(args);
  },
};

async function storeInRedis(
  redis: RedisClientType,
  { key, type, data }: { key: string; type: string; data: any }
): Promise<void> {
  if (!key || !type || !data) {
    console.error("Invalid JSON format:", { key, type, data });
    return;
  }

  const command = redisCommands[type.toLowerCase()];
  if (command) {
    await command(redis, key, data);
    console.log(`Stored ${key} as ${type} in Redis`);
  } else {
    console.error(`Unsupported Redis type: ${type}`);
  }
}

async function closeRedisConnection(): Promise<void> {
  if (redisInstance) {
    console.log("Closing Redis connection...");
    await redisInstance.disconnect();
    redisInstance = null;
    console.log("Redis connection closed.");
  }
}

async function onProcessExit(error: Error | null = null): Promise<void> {
  if (error) {
    console.error("Uncaught Exception:", error);
    process.exitCode = 1;
  } else {
    console.log("Process terminated. Closing JSON Loader Redis client...");
  }

  await closeRedisConnection();
}

process.on("SIGINT", () => onProcessExit());
process.on("SIGTERM", () => onProcessExit());
process.on("uncaughtException", (error) => onProcessExit(error));

export { loadAllRedisKeys, loadRedisKey };
