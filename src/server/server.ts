import express from "express";
import { createServer } from "http";
import RedisAPI from "./RedisAPI";
import { launchRedisDB } from "./redis-launcher";
import { loadAllRedisKeys } from "./redis-loader";
import path from "path";

const redisKeysFolder = path.resolve(__dirname, "../../redis-keys");

(async () => {
  const app = express();
  const server = createServer(app); // HTTP server for WebSockets

  const PORT = process.env.EXPRESS_PORT || 3000;

  // Middleware to parse JSON requests
  app.use(express.json());

  // Launch Redis DB FIRST! before Redis API and loading redis keys
  await launchRedisDB();
  await loadAllRedisKeys(redisKeysFolder);
  RedisAPI.init(app, server);

  // Start server
  app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
  });
})();
