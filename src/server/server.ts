import express from "express";
import { createServer } from "http";
import RedisAPI from "./RedisAPI";
import { launchRedisDB } from "./redis-launcher";
import { loadAllRedisKeys } from "./redis-loader";
import { ClockSpooferDR } from "@/server/data-receivers/custom-receivers/ClockSpooferDR";
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
  await RedisAPI.init(app, server);

  const dataReceivers = [new ClockSpooferDR()];

  dataReceivers.forEach((dataReceiver) => {
    dataReceiver.openConnection();
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down server...");

    // Close HTTP server
    server.close(() => {
      console.log("HTTP server closed.");
    });

    dataReceivers.forEach((dataReceiver) => {
      dataReceiver.closeConnection();
    });

    // Exit process
    process.exit();
  };

  process.on("SIGINT", shutdown); // Ctrl+C
  process.on("SIGTERM", shutdown); // Termination from system/Docker/etc.
})();
