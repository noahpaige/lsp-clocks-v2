/**
 * Application Constants Configuration
 *
 * Centralized configuration for all magic strings, API endpoints, and Redis keys
 * used throughout the application. This improves maintainability and reduces errors.
 *
 * Environment variables are used where appropriate for deployment flexibility.
 * Client-side code will use Vite's import.meta.env, server-side uses process.env.
 */

// ============================================================================
// Server Configuration (Server-side only)
// ============================================================================

const isServer = typeof process !== "undefined" && process.env !== undefined;

export const SERVER_CONFIG = isServer
  ? ({
      /** Express server port */
      PORT: parseInt(process.env.EXPRESS_PORT || "3000", 10),

      /** Redis connection URL */
      REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

      /** Redis server port (for redis-launcher) */
      REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),

      /** Redis server bind address */
      REDIS_BIND: process.env.REDIS_BIND || "127.0.0.1",

      /** Client application URL (for CORS) */
      CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

      /** Enable CORS credentials */
      CORS_CREDENTIALS: process.env.CORS_CREDENTIALS !== "false",

      /** Allowed CORS origins (comma-separated in env var) */
      CORS_ORIGINS: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
        : ["http://localhost:5173"],

      /** Node environment */
      NODE_ENV: process.env.NODE_ENV || "development",
    } as const)
  : ({} as any); // Empty object for client-side

// ============================================================================
// API Configuration (Client + Server)
// ============================================================================

export const API_CONFIG = {
  // Base URLs - use hardcoded for now, will be configured per environment
  // TODO: Client should use import.meta.env.VITE_API_URL in production
  BASE_URL: isServer ? `http://localhost:${SERVER_CONFIG.PORT}` : "http://localhost:3000",

  WS_URL: isServer ? `http://localhost:${SERVER_CONFIG.PORT}` : "http://localhost:3000",

  // API Endpoints
  ENDPOINTS: {
    REDIS_COMMANDS: "/api/items",
    SAVE_RESTORE: {
      BASE: "/api/save-restore",
      SAVE_KEYS: "/api/save-restore/save-keys",
      RESTORE_KEYS: "/api/save-restore/restore-keys",
      LIST_VARIANTS: "/api/save-restore/list-variants",
      LIST_KEYS: "/api/save-restore/list-keys",
      LIST_ALL_VARIANTS: "/api/save-restore/list-all-variants",
    },
  },
} as const;

// ============================================================================
// Redis Configuration
// ============================================================================

export const REDIS_CONFIG = {
  // Key Patterns and Prefixes
  KEYS: {
    DISPLAY_CONFIG: {
      PREFIX: "clock-display-config:",
      LIST: "clock-display-config:list",
      PATTERN: /^clock-display-config:/,
      FILE_PATTERN: /^clock-display-config\..*\.json$/,
    },
  },

  // Versioning Configuration
  VERSIONING: {
    PATTERNS: [/^clock-display-config:/],
    DEFAULT_MODIFIED_BY: "restore:user",
    INIT_MODIFIED_BY: "seed:init",
  },
} as const;

// ============================================================================
// File System Configuration
// ============================================================================

export const FILE_CONFIG = {
  REDIS_KEYS_DIR: "redis-keys",
  FILE_EXTENSION: ".json",
} as const;

// ============================================================================
// Security Configuration
// ============================================================================

export const SECURITY_CONFIG = {
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 100, // Max requests per window
  },

  COMMANDS: {
    // Commands that are safe and don't need rate limiting
    SAFE: ["SET", "GET", "HSET", "HGET", "HDEL", "RPUSH", "LPOP", "INCR", "SADD", "SREM", "ZADD", "ZREM"],

    // Commands that could impact performance and are rate limited
    RATE_LIMITED: ["DEL", "SMEMBERS", "LRANGE", "ZRANGE", "HGETALL"],

    // Commands that are excluded for security reasons
    EXCLUDED: ["KEYS", "SCAN"],
  },
} as const;

// ============================================================================
// WebSocket Configuration
// ============================================================================

export const WS_CONFIG = {
  RECONNECTION: {
    MAX_ATTEMPTS: 5,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 32000, // 32 seconds
  },
  EVENTS: {
    INITIAL: "__initial__",
    REDIS_UPDATE: "redis-update",
    SUBSCRIBE: "subscribe",
    DISCONNECT: "disconnect",
  },
} as const;

// ============================================================================
// Configuration Utilities (Server-side only)
// ============================================================================

/**
 * Validate server configuration
 * Throws descriptive errors if configuration is invalid
 * Only runs on server-side
 */
export function validateServerConfig(): void {
  if (!isServer) return;

  const errors: string[] = [];

  if (SERVER_CONFIG.PORT < 1 || SERVER_CONFIG.PORT > 65535) {
    errors.push(`Invalid PORT: ${SERVER_CONFIG.PORT}. Must be between 1 and 65535.`);
  }

  if (!SERVER_CONFIG.REDIS_URL.startsWith("redis://")) {
    errors.push(`Invalid REDIS_URL: ${SERVER_CONFIG.REDIS_URL}. Must start with "redis://".`);
  }

  if (SERVER_CONFIG.REDIS_PORT < 1 || SERVER_CONFIG.REDIS_PORT > 65535) {
    errors.push(`Invalid REDIS_PORT: ${SERVER_CONFIG.REDIS_PORT}. Must be between 1 and 65535.`);
  }

  if (SERVER_CONFIG.CORS_ORIGINS.length === 0) {
    errors.push("CORS_ORIGINS cannot be empty. At least one origin must be specified.");
  }

  if (errors.length > 0) {
    throw new Error(`Server configuration validation failed:\n${errors.join("\n")}`);
  }
}

/**
 * Log server configuration (masks sensitive values in production)
 * Only runs on server-side
 */
export function logServerConfig(): void {
  if (!isServer) return;

  const isProduction = SERVER_CONFIG.NODE_ENV === "production";

  console.log("=".repeat(60));
  console.log("Server Configuration:");
  console.log("=".repeat(60));
  console.log(`Environment: ${SERVER_CONFIG.NODE_ENV}`);
  console.log(`Port: ${SERVER_CONFIG.PORT}`);
  console.log(`Redis URL: ${isProduction ? "[MASKED]" : SERVER_CONFIG.REDIS_URL}`);
  console.log(`Redis Port: ${SERVER_CONFIG.REDIS_PORT}`);
  console.log(`Redis Bind: ${SERVER_CONFIG.REDIS_BIND}`);
  console.log(`Client URL: ${SERVER_CONFIG.CLIENT_URL}`);
  console.log(`CORS Origins: ${SERVER_CONFIG.CORS_ORIGINS.join(", ")}`);
  console.log(`CORS Credentials: ${SERVER_CONFIG.CORS_CREDENTIALS}`);
  console.log("=".repeat(60));
}
