import { Express, Request, Response } from "express";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import { createClient, RedisClientType } from "redis";
import { Server as HTTPServer } from "http";
import {
  keyToFileName,
  listVariantsForKey,
  stripVersionMetadata,
  addVersionMetadata,
  safeReadJsonFile,
  safeWriteJsonFile,
  REDIS_KEYS_DIR,
} from "./redis-file-utils";
import { isValidVariant } from "@/shared/variantUtils";
import path from "path";
import { executePostRestoreHooks } from "./redis-hooks";

class RedisAPI {
  private app!: Express;
  private io!: SocketServer;
  private redis!: RedisClientType;
  private subscriber!: RedisClientType;
  private allowedCommands = new Set([
    "**GETALL**", // custom command that retrieves the contents of a given key, regardless of key type
    "SET",
    "GET",
    "DEL",
    "HSET",
    "HGET",
    "HGETALL",
    "HDEL",
    "RPUSH",
    "LPOP",
    "LRANGE",
    "INCR",
    "SMEMBERS",
    "SADD",
    "SREM",
    "ZADD",
    "ZRANGE",
    "ZREM",
  ]);

  private initialized = false;

  public async init(app: Express, server: HTTPServer) {
    if (this.initialized) return;

    this.app = app;
    // Use CORS middleware for Express
    this.app.use(
      cors({
        origin: "http://localhost:5173", // change this to your client URL
        credentials: true,
      })
    );

    // Configure Socket.IO with CORS options
    this.io = new SocketServer(server, {
      cors: {
        origin: "http://localhost:5173", // change this to your client URL
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.redis = createClient();
    this.subscriber = this.redis.duplicate();

    await this.redis.connect();
    await this.subscriber.connect();

    this.configureRoutes();
    this.setupWebSocketServer();
    this.listenForRedisChanges();

    this.initialized = true;
  }

  private configureRoutes() {
    this.app.post("/api/items", async (req, res) => {
      await this.onMessage(req, res);
    });

    this.app.post("/api/save-restore/save-keys", async (req, res) => {
      await this.saveKeysToFiles(req, res);
    });

    this.app.post("/api/save-restore/restore-keys", async (req, res) => {
      await this.restoreKeysFromFiles(req, res);
    });

    this.app.get("/api/save-restore/list-variants", async (req, res) => {
      await this.listVariants(req, res);
    });
  }

  private async sendGetAll(args: any[]) {
    const key = args[0];
    if (!key) throw new Error("**GETALL** requires a key as the first argument.");

    const type = await this.redis.type(key);
    const cmdInfo = typeToCommandMap.get(type);

    if (!cmdInfo) {
      if (type === "none") return null; // Key doesn't exist yet
      throw new Error(`Unsupported Redis type: ${type}`);
    }

    return await this.sendCmd(cmdInfo.command, cmdInfo.args ? [key, ...cmdInfo.args] : [key]);
  }

  public async sendCmd(command: string, args: any[] = []): Promise<any> {
    try {
      const commandUpper = command.toUpperCase();

      if (!this.allowedCommands.has(commandUpper)) {
        throw new Error(`Command ${commandUpper} is not allowed.`);
      }

      if (commandUpper === "**GETALL**") {
        return this.sendGetAll(args);
      }

      // Handle normal Redis commands
      const cmd = (this.redis as any)[commandUpper];
      if (typeof cmd !== "function") {
        throw new Error(`Command ${commandUpper} is not a valid Redis command.`);
      }

      return await cmd.apply(this.redis, args);
    } catch (error) {
      console.error("sendCmd failed:", error);
      throw error;
    }
  }

  private async onMessage(req: Request, res: Response) {
    try {
      const { command, key, args = [], batch } = req.body;

      if (batch) {
        if (!Array.isArray(batch)) {
          return res.status(400).json({ error: "Batch request must be an array" });
        }

        const results = await Promise.all(
          batch.map(async ({ command, key, args = [] }: any) => {
            const commandUpper = command.toUpperCase();
            if (!this.allowedCommands.has(commandUpper)) {
              return { event: commandUpper, key, error: `Command not allowed: ${commandUpper}` };
            }
            try {
              const result = await this.sendCmd(commandUpper, [key, ...args]);
              return res.json(result);
            } catch (err: any) {
              return { event: commandUpper, key, error: err.message };
            }
          })
        );

        return res.json({ success: true, results, blart: "mallcop" });
      }

      if (!command || !key) {
        return res.status(400).json({ error: "Missing command or key" });
      }

      const commandUpper = command.toUpperCase();
      if (!this.allowedCommands.has(commandUpper)) {
        return res.status(403).json({ error: `Command not allowed: ${commandUpper}` });
      }

      const result = await this.sendCmd(commandUpper, [key, ...args]);
      return res.json(result);
    } catch (error) {
      console.error("Redis Command Error:", error);
      res.status(500).json({ error: "Redis command execution failed" });
    }
  }

  private setupWebSocketServer() {
    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("subscribe", (key) => {
        console.log(`Client subscribed to key: ${key}`);
        socket.join(key);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  private async listenForRedisChanges() {
    await this.subscriber.configSet("notify-keyspace-events", "KEA");

    this.subscriber.pSubscribe("__keyspace@0__:*", async (message, channel) => {
      // Convert the event message to uppercase.
      const event = message.toUpperCase();
      const key = channel.replace("__keyspace@0__:", "");
      console.log(`Redis key updated: ${key}, Event: ${event}`);

      // Look up the retrieval command based on the uppercase event.
      const dataType = commandToTypeMap.get(event);
      const retrieval = typeToCommandMap.get(dataType);
      let data = null;

      if (retrieval) {
        try {
          const args = retrieval.args ? [key, ...retrieval.args] : [key];
          data = await this.sendCmd(retrieval.command, args);
        } catch (err) {
          console.error("Error fetching data for key:", key, err);
        }
      }

      this.io.to(key).emit("redis-update", { key, event, data });
    });
  }

  private async saveKeysToFiles(req: Request, res: Response) {
    try {
      const { keys, variant = "default", stripVersionFields = true } = req.body;

      if (!Array.isArray(keys) || keys.length === 0) {
        return res.status(400).json({ error: "keys array is required" });
      }

      if (!isValidVariant(variant)) {
        return res.status(400).json({ error: "Invalid variant name" });
      }

      const saved: { key: string; variant: string }[] = [];
      const errors: { key: string; error: string }[] = [];

      for (const key of keys) {
        try {
          const raw = await this.redis.get(key);
          if (!raw) {
            errors.push({ key, error: "Key not found in Redis" });
            continue;
          }

          let data = JSON.parse(raw);
          if (stripVersionFields) {
            data = stripVersionMetadata(data);
          }

          const fileName = keyToFileName(key, variant);
          const filePath = path.join(REDIS_KEYS_DIR, fileName);

          await safeWriteJsonFile(filePath, { key, type: "string", data });
          saved.push({ key, variant });
        } catch (error: any) {
          errors.push({ key, error: error.message });
        }
      }

      res.json({ success: true, saved, errors: errors.length > 0 ? errors : undefined });
    } catch (error: any) {
      console.error("Error in saveKeysToFiles:", error);
      res.status(500).json({ error: error.message });
    }
  }

  private async restoreKeysFromFiles(req: Request, res: Response) {
    try {
      const { keys, variant = "default", addVersionFields = true, versionOptions = {} } = req.body;

      if (!Array.isArray(keys) || keys.length === 0) {
        return res.status(400).json({ error: "keys array is required" });
      }

      if (!isValidVariant(variant)) {
        return res.status(400).json({ error: "Invalid variant name" });
      }

      const restored: { key: string; variant: string }[] = [];
      const errors: { key: string; variant: string; error: string }[] = [];

      for (const key of keys) {
        try {
          const fileName = keyToFileName(key, variant);
          const filePath = path.join(REDIS_KEYS_DIR, fileName);

          const fileData = await safeReadJsonFile(filePath);
          let { data } = fileData;

          if (addVersionFields) {
            data = addVersionMetadata(data, versionOptions.lastModifiedBy || "restore:user");
          }

          // Store to Redis
          await this.redis.set(key, JSON.stringify(data));

          // Execute post-restore hooks for this key
          await executePostRestoreHooks(this.redis, key, data);

          restored.push({ key, variant });
        } catch (error: any) {
          errors.push({ key, variant, error: error.message });
        }
      }

      res.json({ success: true, restored, errors: errors.length > 0 ? errors : undefined });
    } catch (error: any) {
      console.error("Error in restoreKeysFromFiles:", error);
      res.status(500).json({ error: error.message });
    }
  }

  private async listVariants(req: Request, res: Response) {
    try {
      const { key } = req.query;

      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "key query parameter is required" });
      }

      const variants = await listVariantsForKey(key);
      res.json({ success: true, key, variants });
    } catch (error: any) {
      console.error("Error listing variants:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

const commandToTypeMap = new Map<string, string>([
  ["SET", "string"],
  ["INCR", "string"],
  ["HSET", "hash"],
  ["HDEL", "hash"],
  ["RPUSH", "list"],
  ["LPOP", "list"],
  ["SADD", "set"],
  ["SREM", "set"],
  ["ZADD", "zset"],
]);

const typeToCommandMap = new Map<string, { command: string; args?: any[] }>([
  ["string", { command: "GET" }],
  ["hash", { command: "HGETALL" }],
  ["list", { command: "LRANGE", args: [0, -1] }],
  ["set", { command: "SMEMBERS" }],
  ["zset", { command: "ZRANGE", args: [0, -1, "WITHSCORES"] }],
]);

// Singleton instance
const redisAPI = new RedisAPI();
export default redisAPI;
