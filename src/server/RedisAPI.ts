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
  private allowedCommands = new Set(["set", "get", "del", "hset", "hget", "hdel", "rpush", "lpop", "lrange", "incr"]);

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

  public async sendCommand(args: (string | number)[]): Promise<any> {
    try {
      const result = await this.redis.sendCommand([...args.map(String)]);
      return result;
    } catch (error) {
      console.error("sendCommand failed:", error);
      throw new Error("Redis sendCommand failed");
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
          batch.map(async ({ command, key, args = [] }) => {
            if (!this.allowedCommands.has(command)) {
              return { command, key, error: `Command not allowed: ${command}` };
            }

            try {
              const result = await (this.redis as any)[command](key, ...args);
              return { command, key, result };
            } catch (err: any) {
              return { command, key, error: err.message };
            }
          })
        );

        return res.json({ success: true, results });
      }

      if (!command || !key) {
        return res.status(400).json({ error: "Missing command or key" });
      }

      if (!this.allowedCommands.has(command)) {
        return res.status(403).json({ error: `Command not allowed: ${command}` });
      }

      const result = await (this.redis as any)[command](key, ...args);
      return res.json({ success: true, command, key, result });
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
      // Cast the event message to lowercase to avoid false positives
      const event = message.toLowerCase();
      const key = channel.split(":")[1];
      console.log(`Redis key updated: ${key}, Event: ${event}`);

      // Look up the retrieval command based on the lowercased event.
      const retrieval = getCommandMap.get(event);
      let data = null;

      if (retrieval) {
        try {
          // Cast the command to lowercase as well
          const command = retrieval.command.toLowerCase();
          const args = retrieval.args ? [command, key, ...retrieval.args] : [command, key];
          data = await this.sendCommand(args);
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
  ["set", { command: "get" }],
  ["incr", { command: "get" }],

  // Hash type – here we're using HGETALL to retrieve the full hash.
  // (If you truly want to use HGET for a single field, you might need additional context.)
  ["hset", { command: "hgetall" }],
  ["hdel", { command: "hgetall" }],

  // List type – using LRANGE to get all elements.
  ["rpush", { command: "lrange", args: [0, -1] }],
  ["lpop", { command: "lrange", args: [0, -1] }],

  // Set type – SMEMBERS returns all members.
  ["sadd", { command: "smembers" }],
  ["srem", { command: "smembers" }],

  // Sorted set type – ZRANGE with WITHSCORES returns all members with their scores.
  ["zadd", { command: "zrange", args: [0, -1, "WITHSCORES"] }],
  ["zrem", { command: "zrange", args: [0, -1, "WITHSCORES"] }],
]);

// Singleton instance
const redisAPI = new RedisAPI();
export default redisAPI;
