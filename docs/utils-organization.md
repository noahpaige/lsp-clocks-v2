# Utils Organization Guide

## Overview

This document explains the organization of utility functions across the codebase. The utilities are split by **concern** and **runtime environment** to ensure proper separation and reusability.

---

## Directory Structure

```
src/
├── config/
│   └── constants.ts              # Pure constants (no functions)
│
├── utils/                         # Shared utilities (client + server)
│   ├── apiUtils.ts               # API URL generation
│   ├── redisKeyUtils.ts          # Redis key manipulation (pure functions)
│   └── NotificationBus.ts        # Notification system
│
├── server/                        # Server-only utilities
│   ├── file-system-utils.ts      # Generic file I/O operations
│   ├── redis-persistence-utils.ts # Redis ↔ File system sync
│   ├── redis-hooks.ts            # Post-restore hooks
│   └── redis-loader.ts           # Initial data loading
│
└── shared/                        # Shared business logic
    └── variantUtils.ts           # Variant name validation
```

---

## File Purposes

### **`src/config/constants.ts`**

**Purpose**: Pure configuration data only (no functions)

**Contains**:

- `API_CONFIG` - API endpoints and URLs
- `REDIS_CONFIG` - Redis key patterns and versioning
- `SECURITY_CONFIG` - Rate limiting and command restrictions
- `FILE_CONFIG` - File system paths
- `WS_CONFIG` - WebSocket configuration

**Runtime**: Client + Server

---

### **`src/utils/apiUtils.ts`**

**Purpose**: Client-side API utilities (pure functions, no Node.js dependencies)

**Functions**:

- `getApiUrl(endpoint)` - Generate full API URLs
- `getWebSocketUrl()` - Get WebSocket URL

**Runtime**: Client + Server (shared)

**Why separate?**: No Node.js dependencies, can run in browser

---

### **`src/utils/redisKeyUtils.ts`**

**Purpose**: Redis key string manipulation (pure functions, no I/O)

**Functions**:

- `getDisplayConfigKey(id)` - Generate display config keys
- `getDisplayConfigListKey()` - Get list key
- `isDisplayConfigKey(key)` - Validate key pattern
- `extractDisplayConfigId(key)` - Parse ID from key
- `getLockKey(redisKey)` - Generate lock keys
- `parseRedisKey(key)` - Parse key components

**Runtime**: Client + Server (shared)

**Why separate?**:

- No I/O operations
- Pure string manipulation
- Can run in browser
- Used by both client and server

---

### **`src/server/file-system-utils.ts`**

**Purpose**: Generic, reusable file system operations (Node.js only)

**Functions**:

- `safeReadJsonFile(path)` - Read and parse JSON with error handling
- `safeWriteJsonFile(path, data)` - Atomic write with temp files
- `fileExists(path)` - Check if file exists
- `safeDeleteFile(path)` - Safe file deletion

**Runtime**: Server only (requires Node.js `fs`)

**Why separate?**:

- Generic utilities that can be reused beyond Redis
- No domain-specific logic
- Pure file I/O operations
- Atomic write operations for safety

---

### **`src/server/redis-persistence-utils.ts`**

**Purpose**: Redis-specific persistence to file system

**Functions**:

- `keyToFileName(key, variant)` - Convert Redis key to filename
- `fileNameToKey(fileName)` - Parse filename back to key
- `listVariantsForKey(key)` - Find all variants for a key
- `listKeysForVariant(variant)` - Find all keys in a variant
- `listAllVariants(pattern?)` - List all available variants
- `deleteKeyFile(key, variant)` - Delete a variant file
- `stripVersionMetadata(data)` - Remove version fields
- `addVersionMetadata(data, by)` - Add version fields

**Runtime**: Server only (uses `file-system-utils.ts`)

**Why separate?**:

- Domain-specific to Redis persistence
- Combines file I/O with Redis key logic
- Handles variant management
- Manages versioning metadata

---

## Design Principles

### 1. **Separation by Runtime Environment**

- **Shared utils** (`/utils`) = No Node.js dependencies, can run in browser
- **Server utils** (`/server`) = Requires Node.js (fs, path, etc.)

### 2. **Separation by Concern**

- **Constants** = Data only, no logic
- **API Utils** = URL generation
- **Key Utils** = String manipulation
- **File System Utils** = Generic I/O operations
- **Persistence Utils** = Domain-specific persistence logic

### 3. **Dependency Direction**

```
Constants (config/)
    ↑
Key Utils (utils/) ← API Utils (utils/)
    ↑
File System Utils (server/)
    ↑
Persistence Utils (server/)
    ↑
RedisAPI, redis-loader, redis-hooks
```

### 4. **Single Responsibility**

Each file has ONE clear purpose:

- ❌ **Bad**: `redis-file-utils.ts` with generic file I/O + Redis logic + versioning
- ✅ **Good**: Split into specialized files with clear boundaries

---

## When to Add New Utilities

### Add to `/utils` if:

- ✅ No Node.js dependencies
- ✅ Pure functions (no I/O)
- ✅ Needed by both client and server
- ✅ String manipulation, calculations, formatting

### Add to `/server` if:

- ✅ Requires Node.js APIs (fs, path, crypto, etc.)
- ✅ Performs I/O operations
- ✅ Server-only functionality

### Create a NEW file if:

- ✅ Different concern/responsibility
- ✅ Can be reused in other contexts
- ✅ Would make existing file too large (>300 lines)

---

## Migration Notes

### What Changed?

1. **Deleted**: `src/server/redis-file-utils.ts`
2. **Created**: `src/server/file-system-utils.ts` (generic file I/O)
3. **Created**: `src/server/redis-persistence-utils.ts` (Redis-specific)
4. **Created**: `src/utils/redisKeyUtils.ts` (shared key manipulation)
5. **Created**: `src/utils/apiUtils.ts` (API URL generation)
6. **Cleaned**: `src/config/constants.ts` (removed functions, constants only)

### Why?

- Better separation of concerns
- Generic utilities can be reused
- Clear client vs. server boundaries
- Easier to test individual pieces
- More maintainable as codebase grows

---

## Examples

### ❌ Before (Everything in One File)

```typescript
// redis-file-utils.ts - Mixed concerns
export function keyToFileName(key: string) {
  /* ... */
}
export function safeReadJsonFile(path: string) {
  /* ... */
}
export function addVersionMetadata(data: any) {
  /* ... */
}
export function getDisplayConfigKey(id: string) {
  /* ... */
}
```

### ✅ After (Organized by Concern)

```typescript
// utils/redisKeyUtils.ts - Pure key logic (client + server)
export function getDisplayConfigKey(id: string) {
  /* ... */
}

// server/file-system-utils.ts - Generic I/O (server only)
export function safeReadJsonFile(path: string) {
  /* ... */
}

// server/redis-persistence-utils.ts - Redis persistence (server only)
export function keyToFileName(key: string) {
  /* ... */
}
export function addVersionMetadata(data: any) {
  /* ... */
}
```

---

## Future Considerations

As the codebase grows, consider:

1. **User Management**: Create `src/utils/userKeyUtils.ts` for user-related keys
2. **Session Management**: Create `src/utils/sessionKeyUtils.ts`
3. **Cache Management**: Create `src/server/cache-utils.ts`
4. **Authentication**: Create `src/server/auth-utils.ts`

Always follow the same principles: **runtime environment** and **concern**.
