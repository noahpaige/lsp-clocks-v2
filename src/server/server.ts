import express from "express";
import { createServer } from "http";
import { RedisAPI } from "./redis-api";
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

  // Launch Redis DB **BEFORE** initializing Redis API
  await launchRedisDB();
  await loadAllRedisKeys(redisKeysFolder);
  // Initialize Redis API with existing Express app & server (after launching Redis DB)
  new RedisAPI(app, server);

  // Start server
  app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
  });
})();
