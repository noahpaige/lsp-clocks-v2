import { exec, spawn } from "child_process";
import os from "os";
import path from "path";

const fs = require("fs-extra");

/**
 * Launches the Redis database server as a background process.
 * @returns {Promise<ChildProcess>} Resolves with the Redis process.
 */
export function launchRedisDB() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();

    if (platform !== "win32" && platform !== "darwin") {
      return reject(new Error("Unsupported OS: Only Windows and macOS are supported."));
    }

    const redisDir = path.join(__dirname, "../../redis-binaries");
    const redisServerBinary = path.join(
      redisDir,
      platform === "win32" ? "windows/redis-server.exe" : "macos/redis-server"
    );

    // Ensure Redis binary exists
    if (!fs.existsSync(redisServerBinary)) {
      return reject(new Error(`Redis server binary not found at: ${redisServerBinary}`));
    }

    console.log(`Starting Redis server in the background: ${redisServerBinary}`);

    // Start Redis server as a detached process with common data directory
    // const serverProcess = spawn(redisServerBinary, ["--dir", redisDir], { detached: true, stdio: "ignore" });
    //const serverProcess = spawn(redisServerBinary, ["--dir", redisDir]);
    const serverProcess = spawn(redisServerBinary, ["--port", "6379", "--bind", "127.0.0.1", "--dir", redisDir], {
      detached: true,
      stdio: "ignore",
    });

    serverProcess.unref(); // Allows Node.js to exit independently of the Redis process

    serverProcess.on("error", (error) => {
      console.error(`Error running Redis server: ${error.message}`);
      reject(error);
    });

    const handleClose = (signal?: String) => {
      console.log("Shutting down Redis...");
      if (platform === "win32") {
        exec("taskkill /F /IM redis-server.exe /T", (error, _stdout, stderr) => {
          if (error) {
            console.error(`Error shutting down Redis: ${stderr}`);
          } else {
            console.log("Redis shut down successfully.");
          }
        });
      } else {
        exec("pkill -f redis-server", (error, _stdout, stderr) => {
          if (error) {
            console.error(`Error shutting down Redis: ${stderr}`);
          } else {
            console.log("Redis shut down successfully.");
          }
        });
      }
      process.exit();
    };

    // Graceful shutdown handling
    process.on("SIGINT", () => handleClose("SIGINT"));
    process.on("SIGTERM", () => handleClose("SIGTERM"));

    resolve(serverProcess);
  });
}
