/**
 * Application Constants Configuration
 *
 * Centralized configuration for all magic strings, API endpoints, and Redis keys
 * used throughout the application. This improves maintainability and reduces errors.
 */

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
  // Base URLs (will be replaced with environment variables in future)
  BASE_URL: "http://localhost:3000",
  WS_URL: "http://localhost:3000",

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
