import { Express, Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { createClient } from 'redis';
import { Server as HTTPServer } from 'http';

export class RedisAPI {
  private app: Express;
  private io: SocketServer;
  private redis = createClient();
  private subscriber = this.redis.duplicate();
  private allowedCommands = new Set([
    'set', 'get', 'del', 'hset', 'hget', 'hdel', 'rpush', 'lpop', 'lrange', 'incr'
  ]);

  constructor(app: Express, server: HTTPServer) {
    this.app = app;
    this.io = new SocketServer(server, { cors: { origin: '*' } });

    this.redis.connect();
    this.subscriber.connect();
    this.configureRoutes();
    this.setupWebSocketServer();
    this.listenForRedisChanges();
  }

  private configureRoutes() {
    this.app.post('/api/items', async (req, res) => {
        await this.onMessage(req, res);
        });
  }

  private async onMessage(req: Request, res: Response) {
    try {
      const { command, key, args = [], batch } = req.body;

      if (batch) {
        if (!Array.isArray(batch)) {
          return res.status(400).json({ error: 'Batch request must be an array' });
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
        return res.status(400).json({ error: 'Missing command or key' });
      }

      if (!this.allowedCommands.has(command)) {
        return res.status(403).json({ error: `Command not allowed: ${command}` });
      }

      const result = await (this.redis as any)[command](key, ...args);
      return res.json({ success: true, command, key, result });

    } catch (error) {
      console.error('Redis Command Error:', error);
      res.status(500).json({ error: 'Redis command execution failed' });
    }
  }

  private setupWebSocketServer() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribe', (key) => {
        console.log(`Client subscribed to key: ${key}`);
        socket.join(key);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private async listenForRedisChanges() {
    await this.subscriber.configSet('notify-keyspace-events', 'KEA');

    this.subscriber.pSubscribe('__keyspace@0__:*', async (message, channel) => {
      const key = channel.split(':')[1];
      console.log(`Redis key updated: ${key}, Event: ${message}`);

      this.io.to(key).emit('redis-update', { key, event: message });
    });
  }
}
