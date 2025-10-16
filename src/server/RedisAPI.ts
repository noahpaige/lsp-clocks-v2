import { Express, Request, Response } from "express";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import { createClient, RedisClientType } from "redis";
import { Server as HTTPServer } from "http";
import fs from "fs/promises";
import path from "path";

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

    this.app.post("/api/display-configs/save-to-files", async (req, res) => {
      await this.saveDisplayConfigsToFiles(req, res);
    });

    this.app.post("/api/display-configs/restore-from-files", async (req, res) => {
      await this.restoreDisplayConfigsFromFiles(req, res);
    });
  }

  private async sendGetAll(args: any[]) {
    const key = args[0];
    if (!key) throw new Error("**GETALL** requires a key as the first argument.");

    const type = await this.redis.type(key);
    const cmdInfo = typeToCommandMap.get(type);

    if (!cmdInfo) {
      if (type === "none") throw new Error(`Key "${key}" does not exist.`);
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
      const key = channel.split(":")[1];
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

  private async saveDisplayConfigsToFiles(req: Request, res: Response) {
    try {
      const configIds = await this.redis.sMembers("display:config:list");
      const savedFiles: string[] = [];

      for (const id of configIds) {
        const raw = await this.redis.get(`display:config:${id}`);
        if (!raw) continue;

        const config = JSON.parse(raw);
        // Strip version metadata
        const { lastModifiedAt, lastModifiedBy, ...cleanConfig } = config;

        const fileName = `display-config-${id}.json`;
        const filePath = path.resolve(__dirname, "../../redis-keys", fileName);
        const fileContent = JSON.stringify(
          { key: `display:config:${id}`, type: "string", data: cleanConfig },
          null,
          2
        );

        await fs.writeFile(filePath, fileContent, "utf-8");
        savedFiles.push(fileName);
      }

      res.json({ success: true, saved: savedFiles });
    } catch (error: any) {
      console.error("Error saving display configs to files:", error);
      res.status(500).json({ error: error.message });
    }
  }

  private async restoreDisplayConfigsFromFiles(req: Request, res: Response) {
    try {
      const { loadAllRedisKeys } = await import("./redis-loader");
      const redisKeysFolder = path.resolve(__dirname, "../../redis-keys");

      await loadAllRedisKeys(redisKeysFolder, "redis://localhost:6379", {
        addVersion: true,
        lastModifiedBy: "restore:user",
        keyPattern: /^display:config:/,
        overwriteIfPresent: true,
      });

      res.json({ success: true, message: "Display configs restored from files" });
    } catch (error: any) {
      console.error("Error restoring display configs from files:", error);
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
