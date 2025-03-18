import { ChildProcess } from "child_process";

const { exec } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs-extra");

/**
 * Launches the Redis database server and opens the Redis CLI.
 * @returns {Promise<{ serverProcess: ChildProcess, cliProcess: ChildProcess }>}
 */
function launchRedisDB() {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let redisServerBinary, redisCliBinary;
        let cliProcess: ChildProcess, serverProcess: ChildProcess;

        if (platform === "win32") {
            redisServerBinary = path.join(__dirname, "redis-binaries", "windows", "redis-server.exe");
            redisCliBinary = path.join(__dirname, "redis-binaries", "windows", "redis-cli.exe");
        } else if (platform === "darwin") {
            redisServerBinary = path.join(__dirname, "redis-binaries", "macos", "redis-server");
            redisCliBinary = path.join(__dirname, "redis-binaries", "macos", "redis-cli");
        } else {
            return reject(new Error("Unsupported OS: Only Windows and macOS are supported."));
        }

        // Ensure Redis binaries exist
        if (!fs.existsSync(redisServerBinary)) {
            return reject(new Error(`Redis server binary not found at: ${redisServerBinary}`));
        }
        if (!fs.existsSync(redisCliBinary)) {
            return reject(new Error(`Redis CLI binary not found at: ${redisCliBinary}`));
        }

        console.log(`Starting Redis server: ${redisServerBinary}`);

        // Start Redis server
        serverProcess = exec(`"${redisServerBinary}"`, (error: { message: any; }, stdout: any, stderr: any) => {
            if (error) {
                console.error(`Error running Redis server: ${error.message}`);
                return reject(error);
            }
            console.log(`Redis Server Output: ${stdout}`);
            console.error(`Redis Server Errors: ${stderr}`);
        });

        // Wait a few seconds to ensure the server starts before launching the CLI
        setTimeout(() => {
            console.log(`Starting Redis CLI: ${redisCliBinary}`);
            cliProcess = exec(`"${redisCliBinary}"`, (error: { message: any; }, stdout: any, stderr: any) => {
                if (error) {
                    console.error(`Error running Redis CLI: ${error.message}`); 
                    return reject(error);
                }
                console.log(`Redis CLI Output: ${stdout}`);
                console.error(`Redis CLI Errors: ${stderr}`);
            });

            // Resolve with both processes
            resolve({ serverProcess, cliProcess });
        }, 3000); // Delay to ensure Redis server starts first

        // Handle process termination
        process.on("SIGINT", () => {
            serverProcess.kill();
            cliProcess.kill();
            process.exit();
        });
    });
}

module.exports = { launchRedisDB };
