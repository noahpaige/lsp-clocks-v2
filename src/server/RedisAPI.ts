import { Express, Request, Response } from "express";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import { createClient, RedisClientType } from "redis";
import { Server as HTTPServer } from "http";

class RedisAPI {
  private app!: Express;
  private io!: SocketServer;
  private redis!: RedisClientType;
  private subscriber!: RedisClientType;
  private allowedCommands = new Set([
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

  public async sendCmd(command: string, args: any[] = []): Promise<any> {
    try {
      const commandUpper = command.toUpperCase();
      if (!this.allowedCommands.has(commandUpper)) {
        throw new Error(`Command ${commandUpper} is not allowed.`);
      }
      // Get the command-specific method from the Redis client.
      // We assume the method names are in uppercase.
      const cmd = (this.redis as any)[commandUpper];
      if (typeof cmd !== "function") {
        throw new Error(`Command ${commandUpper} is not a valid Redis command.`);
      }
      // Call the command-specific method with the given arguments
      const result = await cmd.apply(this.redis, args);
      return result;
    } catch (error) {
      console.error("sendCmd failed:", error);
      throw error;
    }
  }

  private configureRoutes() {
    this.app.post("/api/items", async (req, res) => {
      await this.onMessage(req, res);
    });
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
              return { command: commandUpper, key, error: `Command not allowed: ${commandUpper}` };
            }
            try {
              const result = await this.sendCmd(commandUpper, [key, ...args]);
              return { command: commandUpper, key, result };
            } catch (err: any) {
              return { command: commandUpper, key, error: err.message };
            }
          })
        );

        return res.json({ success: true, results });
      }

      if (!command || !key) {
        return res.status(400).json({ error: "Missing command or key" });
      }

      const commandUpper = command.toUpperCase();
      if (!this.allowedCommands.has(commandUpper)) {
        return res.status(403).json({ error: `Command not allowed: ${commandUpper}` });
      }

      const result = await this.sendCmd(commandUpper, [key, ...args]);
      return res.json({ success: true, command: commandUpper, key, result });
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
      const retrieval = getCommandMap.get(event);
      let data = null;

      if (retrieval) {
        try {
          const commandUpper = retrieval.command.toUpperCase();
          const args = retrieval.args ? [key, ...retrieval.args] : [key];
          data = await this.sendCmd(commandUpper, args);
        } catch (err) {
          console.error("Error fetching data for key:", key, err);
        }
      }

      this.io.to(key).emit("redis-update", { key, event, data });
    });
  }
}

const getCommandMap = new Map<string, { command: string; args?: any[] }>([
  // String type
  ["SET", { command: "GET" }],
  ["INCR", { command: "GET" }],

  // Hash type – here we're using HGETALL to retrieve the full hash.
  ["HSET", { command: "HGETALL" }],
  ["HDEL", { command: "HGETALL" }],

  // List type – using LRANGE to get all elements.
  ["RPUSH", { command: "LRANGE", args: [0, -1] }],
  ["LPOP", { command: "LRANGE", args: [0, -1] }],

  // Set type – SMEMBERS returns all members.
  ["SADD", { command: "SMEMBERS" }],
  ["SREM", { command: "SMEMBERS" }],

  // Sorted set type – ZRANGE with WITHSCORES returns all members with their scores.
  ["ZADD", { command: "ZRANGE", args: [0, -1, "WITHSCORES"] }],
  ["ZREM", { command: "ZRANGE", args: [0, -1, "WITHSCORES"] }],
]);

// Singleton instance
const redisAPI = new RedisAPI();
export default redisAPI;
