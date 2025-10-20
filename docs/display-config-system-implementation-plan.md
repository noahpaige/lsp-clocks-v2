# Display Configuration System - Implementation Plan

## Overview

This document outlines the implementation plan for building a user-configurable clock display system. The goal is to transition from hard-coded clock displays (like `AllClocks.vue`) to a flexible system where non-technical users can create, modify, and manage custom clock layouts through a visual interface.

**Scope of This Implementation**:

- ✅ Display Configurations List page (CRUD operations)
- ✅ Display Configuration Editor page (visual form builder)
- ✅ Generic Clock Display Component (renders configs dynamically)
- ✅ Data persistence layer (Redis storage)
- ✅ Navigation integration with existing config page
- ✅ Display preview functionality

**What This Achieves**: After this implementation, users will be able to create custom clock display layouts without writing code, store them in Redis, and display them dynamically on screen.

---

## Architecture Decisions

### Data Model

The system uses a three-tier configuration model:

1. **ClockDisplayConfig** - Top-level container for an entire display

   - Contains: `id`, `name`, `description`, `containerClasses`, `rows[]`
   - Example: "Mission Control Display", "Launch Countdown Display"

2. **ClockRowConfig** - Individual row within a display

   - Contains: `clocks[]`, `gap`, `justify`, `align`, `rowClasses`
   - Defines layout for a single horizontal row of clocks

3. **ClockConfig** - Individual clock configuration
   - Contains: `labelLeft`, `labelRight`, `labelTop`, `size`, `format`, `timeType`
   - Maps directly to `Clock.vue` props

### Storage Strategy

- **Redis Key Structure**: `clock-display-config:{id}` for each display configuration
- **List of Displays**: `clock-display-config:list` (set of all display IDs)
- **Metadata Storage**: Store complete JSON object for each display
- **Cache Strategy**: Load all configs on app start, update on change
- **Metadata**: Each config includes `lastModifiedAt` (timestamp) and `lastModifiedBy` fields
- **Edit Locks**: `clock-display-config:lock:{id}` stores temporary edit session info

### Concurrent Editing Strategy

To support multiple users editing configurations simultaneously, we implement a **hybrid optimistic locking system**:

**Components:**

1. **Soft Locks (Awareness)**

   - When user opens editor, create a "soft lock" in Redis (expires after 5 minutes)
   - Shows other users "Currently being edited by User X"
   - Doesn't prevent others from editing, just provides awareness
   - Auto-renewed every minute while editor is open

2. **Version Tracking (Conflict Detection)**

   - Each config has `lastModifiedAt` (timestamp of last save)
   - Each config has `lastModifiedBy` (user identifier)
   - On save, compare current `lastModifiedAt` with the value when loaded
   - If mismatch detected, show conflict resolution UI

3. **Conflict Resolution UI**
   - Show user that config was modified by someone else
   - Options: View Changes, Overwrite, Cancel
   - Display diff showing what changed
   - Require explicit choice from user

**Benefits:**

- ✅ Works without authentication (uses session IDs)
- ✅ Prevents accidental overwrites
- ✅ Allows collaboration
- ✅ No stuck locks (auto-expire)
- ✅ Easy to upgrade to full auth later

**Redis Keys:**

- `clock-display-config:lock:{id}` → `{ sessionId, userName, timestamp, expires }`
- Metadata in config → `{ ...config, lastModifiedAt: timestamp, lastModifiedBy: sessionId }`

#### Long-running Session Hardening (20+ hours)

To keep soft locks reliable over very long sessions without using Web Workers:

- Heartbeat with jitter: refresh every 60s ± random 5–15s to avoid thundering herds
- Visibility/focus recovery: on `visibilitychange` (visible) and `focus`, re-check and reacquire lock
- Offline/online: pause refresh when offline; on `online`, verify and reacquire if needed
- Unload release: use `navigator.sendBeacon` in `beforeunload` to release locks best-effort
- Missed beats: if a refresh is missed/throttled, treat as expired; notify user and attempt reacquire
- Single-tab refresh per user: use `BroadcastChannel` so only one tab per session refreshes a given lock
- Always protect with last-modified timestamps: proceed on save; `lastModifiedAt`-based conflict detection guards against data loss

These measures are more impactful than moving the heartbeat to a Web Worker (which can still be throttled in background tabs) and keep complexity low while maintaining resilience.

### Component Architecture

```
ConfigPage
  └── DisplayConfigsList.vue (List/CRUD)
        ├── Create New Button → DisplayConfigEditor.vue
        └── Edit Button → DisplayConfigEditor.vue

DisplayConfigEditor.vue (Form)
  ├── Display Info Section (name, description)
  ├── Rows Section
  │   ├── Row Editor (for each row)
  │   │   └── Clock Editor (for each clock in row)
  │   └── Add Row Button
  └── Preview Button → Opens preview modal

GenericClockDisplay.vue (Renderer)
  ├── AnimatedBackground
  └── Dynamic Rows
      └── Dynamic Clocks (from config)
```

---

## File Structure

```
src/
├── components/
│   ├── Pages/
│   │   ├── ConfigPage/
│   │   │   └── views/
│   │   │       └── displays/
│   │   │           ├── DisplayConfigsList.vue         # NEW: List/CRUD page
│   │   │           ├── DisplayConfigEditor.vue        # NEW: Editor page
│   │   │           ├── RowEditor.vue                  # NEW: Sub-component
│   │   │           ├── ClockEditor.vue                # NEW: Sub-component
│   │   │           ├── DisplayPreview.vue             # NEW: Preview modal
│   │   │           └── ConflictResolution.vue         # NEW: Conflict resolution modal
│   │   └── Displays/
│   │       └── GenericClockDisplay.vue                # NEW: Dynamic renderer
│   └── Clock/
│       └── Clock.vue                                   # EXISTING: No changes
├── composables/
│   ├── useDisplayConfigs.ts                           # NEW: Config management
│   ├── useEditLock.ts                                 # NEW: Edit lock management
│   └── useSessionId.ts                                # NEW: Session identification
├── types/
│   ├── ClockDisplayConfig.ts                          # EXISTING: Already defined
│   ├── ClockRowConfig.ts                              # EXISTING: Already defined
│   ├── ClockConfig.ts                                 # EXISTING: Already defined
│   ├── EditLock.ts                                    # NEW: Lock type definition
│   └── Versioned.ts                                   # NEW: Generic versioning wrapper
└── router/
    └── routes.ts                                       # UPDATE: Add routes
```

---

## Implementation Steps

### Phase 1: Data Layer & State Management

#### Step 1.1: Create Display Config Composable

**File**: `src/composables/useDisplayConfigs.ts`

**Purpose**: Central state management for display configurations with Redis persistence.

**Key Features**:

- Load all display configs from Redis on initialization
- CRUD operations (Create, Read, Update, Delete)
- Reactive state for UI updates
- Error handling and validation

**Implementation**:

```typescript
import { ref, computed, readonly } from "vue";
import { useRedisCommand } from "./useRedisCommand";
import { ClockDisplayConfig, parseClockDisplayConfig } from "@/types/ClockDisplayConfig";
import { useToaster } from "./useToaster";

const displayConfigs = ref<ClockDisplayConfig[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useDisplayConfigs() {
  const redis = useRedisCommand();
  const { showToast } = useToaster();

  // Redis key constants
  const DISPLAY_LIST_KEY = "clock-display-config:list";
  const getDisplayKey = (id: string) => `clock-display-config:${id}`;

  /**
   * Load all display configs from Redis
   */
  async function loadDisplayConfigs() {
    isLoading.value = true;
    error.value = null;

    try {
      // Get list of all display IDs
      const idsResponse = await redis.send("SMEMBERS", [DISPLAY_LIST_KEY]);
      const ids = idsResponse.data as string[];

      if (!ids || ids.length === 0) {
        displayConfigs.value = [];
        return;
      }

      // Load each display config
      const configs: ClockDisplayConfig[] = [];
      for (const id of ids) {
        const response = await redis.send("GET", [getDisplayKey(id)]);
        if (response.data) {
          const parsed = parseClockDisplayConfig(JSON.parse(response.data));
          configs.push(parsed);
        }
      }

      displayConfigs.value = configs;
    } catch (err) {
      error.value = "Failed to load display configurations";
      showToast({
        title: "Error",
        description: error.value,
        variant: "destructive",
      });
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get a single display config by ID
   */
  function getDisplayConfig(id: string): ClockDisplayConfig | undefined {
    return displayConfigs.value.find((config) => config.id === id);
  }

  /**
   * Create a new display config
   */
  async function createDisplayConfig(config: ClockDisplayConfig): Promise<boolean> {
    try {
      // Validate ID uniqueness
      if (displayConfigs.value.some((c) => c.id === config.id)) {
        showToast({
          title: "Error",
          description: "A display with this ID already exists",
          variant: "destructive",
        });
        return false;
      }

      // Save to Redis
      const configJson = JSON.stringify(config);
      await redis.send("SET", [getDisplayKey(config.id), configJson]);
      await redis.send("SADD", [DISPLAY_LIST_KEY, config.id]);

      // Update local state
      displayConfigs.value.push(config);

      showToast({
        title: "Success",
        description: `Display "${config.name}" created successfully`,
      });

      return true;
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to create display configuration",
        variant: "destructive",
      });
      console.error(err);
      return false;
    }
  }

  /**
   * Update an existing display config
   */
  async function updateDisplayConfig(config: ClockDisplayConfig): Promise<boolean> {
    try {
      // Save to Redis
      const configJson = JSON.stringify(config);
      await redis.send("SET", [getDisplayKey(config.id), configJson]);

      // Update local state
      const index = displayConfigs.value.findIndex((c) => c.id === config.id);
      if (index !== -1) {
        displayConfigs.value[index] = config;
      }

      showToast({
        title: "Success",
        description: `Display "${config.name}" updated successfully`,
      });

      return true;
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to update display configuration",
        variant: "destructive",
      });
      console.error(err);
      return false;
    }
  }

  /**
   * Delete a display config
   */
  async function deleteDisplayConfig(id: string): Promise<boolean> {
    try {
      // Delete from Redis
      await redis.send("DEL", [getDisplayKey(id)]);
      await redis.send("SREM", [DISPLAY_LIST_KEY, id]);

      // Update local state
      displayConfigs.value = displayConfigs.value.filter((c) => c.id !== id);

      showToast({
        title: "Success",
        description: "Display configuration deleted",
      });

      return true;
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to delete display configuration",
        variant: "destructive",
      });
      console.error(err);
      return false;
    }
  }

  /**
   * Duplicate a display config
   */
  async function duplicateDisplayConfig(id: string): Promise<boolean> {
    const original = getDisplayConfig(id);
    if (!original) return false;

    const duplicate: ClockDisplayConfig = {
      ...original,
      id: `${original.id}-copy-${Date.now()}`,
      name: `${original.name} (Copy)`,
    };

    return createDisplayConfig(duplicate);
  }

  return {
    displayConfigs: readonly(displayConfigs),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadDisplayConfigs,
    getDisplayConfig,
    createDisplayConfig,
    updateDisplayConfig,
    deleteDisplayConfig,
    duplicateDisplayConfig,
  };
}
```

**Verify**:

- [ ] Composable exports all necessary functions
- [ ] Redis commands follow existing pattern
- [ ] Error handling includes user-friendly toasts
- [ ] TypeScript types are correct

**Status (Oct 10, 2025)**:

- Implemented `src/composables/useDisplayConfigs.ts` with reactive state, CRUD, and Redis persistence.
- Integrated with existing `useRedisCommand` API using `sendInstantCommand(command, key, args?)` to match current backend contract.
- Used `useToaster().emitToast` for notifications (the plan referenced `showToast`), which is a slight deviation from the draft.
- Parsing uses existing `parseClockDisplayConfig` from `src/types/ClockDisplayConfig.ts`.
- Validation: duplicate ID check and required ID presence on create/update.
- No versioning/locks yet (planned in later steps).

---

#### Step 1.2: Create Generic Versioning Abstraction

**File**: `src/types/Versioned.ts`

Create reusable types and utilities for adding last-modified metadata to any data type:

```typescript
/**
 * Version metadata fields for concurrent editing support
 */
export interface VersionMetadata {
  lastModifiedBy?: string; // Session ID or user ID who made the change
  lastModifiedAt?: number; // Timestamp of last save (for conflict detection and display)
}

/**
 * Generic wrapper type that adds last-modified metadata to any data type
 */
export type Versioned<T> = T & VersionMetadata;

/**
 * Add last-modified metadata to data (for new records)
 * @param data The data to annotate
 * @param sessionId Current session/user ID
 * @returns Data with last-modified metadata attached
 */
export function withVersion<T>(data: T, sessionId: string): Versioned<T> {
  const timestamp = Date.now();
  return {
    ...data,
    lastModifiedBy: sessionId,
    lastModifiedAt: timestamp,
  };
}

/**
 * Update last-modified metadata on existing data (for updates)
 * @param data The data to annotate
 * @param sessionId Current session/user ID
 * @returns Data with updated last-modified metadata
 */
export function updateVersion<T>(data: T, sessionId: string): Versioned<T> {
  const timestamp = Date.now();
  return {
    ...data,
    lastModifiedBy: sessionId,
    lastModifiedAt: timestamp,
  };
}

/**
 * Strip metadata from data (if needed)
 * @param versionedData Data with last-modified metadata
 * @returns Data without metadata
 */
export function withoutVersion<T>(versionedData: Versioned<T>): T {
  const { lastModifiedBy, lastModifiedAt, ...data } = versionedData as any;
  return data as T;
}

/**
 * Parse versioned data from raw object
 * @param raw Raw object (e.g., from JSON.parse)
 * @param parser Function to parse the base data
 * @returns Versioned data with metadata
 */
export function parseVersioned<T>(raw: any, parser: (raw: any) => T): Versioned<T> {
  const baseData = parser(raw);
  return {
    ...baseData,
    lastModifiedBy: raw.lastModifiedBy,
    lastModifiedAt: raw.lastModifiedAt ?? 0,
  };
}
```

**Benefits:**

- ✅ Reusable for any data type (configs, profiles, settings, etc.)
- ✅ Clean separation: base types stay pure, versioning is opt-in
- ✅ Type-safe with TypeScript inference
- ✅ Explicit versioning via utility functions
- ✅ Consistent pattern across entire codebase

**Status (Oct 10, 2025):**

- Implemented `src/types/Versioned.ts` providing `Versioned<T>`, `withVersion`, `updateVersion`, `withoutVersion`, and `parseVersioned`.
- Matches the plan’s API; no deviations required.
- Will be integrated into `useDisplayConfigs` in Step 1.7 for conflict detection.

---

#### Step 1.3: Define Display Config Types with Versioning

**File**: `src/types/ClockDisplayConfig.ts`

Create a base interface for extensibility, then define clock-specific display config:

```typescript
import { ClockRowConfig, parseRowConfig } from "./ClockRowConfig";
import { Versioned } from "./Versioned";
import { BaseDisplayConfig } from "./BaseDisplayConfig";

/**
 * Base display configuration interface
 *
 * This interface defines common fields that ALL display types share,
 * regardless of their content (clocks, maps, charts, etc.)
 *
 * Future display types should extend this interface:
 * - MapDisplayConfig extends BaseDisplayConfig
 * - ChartDisplayConfig extends BaseDisplayConfig
 * - SimulationDisplayConfig extends BaseDisplayConfig
 */
export interface BaseDisplayConfig {
  id: string;
  name: string;
  description: string;
  type: string; // Discriminator: "clock-layout", "map", "chart", etc.
}

/**
 * Clock display configuration (without version field)
 *
 * This type is specific to clock layouts with rows of clocks.
 * Other display types will have different configuration structures
 * appropriate to their needs (e.g., map center/zoom, chart data sources).
 */
export interface ClockDisplayConfig extends BaseDisplayConfig {
  type: "clock-layout"; // Discriminator for clock layout displays
  containerClasses?: string;
  rows: ClockRowConfig[];
}

/**
 * Versioned clock display configuration (for storage and conflict detection)
 */
export type VersionedClockDisplayConfig = Versioned<ClockDisplayConfig>;

/**
 * Union type for all display configurations
 *
 * As new display types are added, add them here:
 * type DisplayConfig = ClockDisplayConfig | MapDisplayConfig | ChartDisplayConfig;
 */
export type DisplayConfig = ClockDisplayConfig;

/**
 * Parse raw data into ClockDisplayConfig
 */
export function parseClockDisplayConfig(raw: any): ClockDisplayConfig {
  return {
    id: raw.id || "",
    name: raw.name || "",
    description: raw.description || "",
    type: raw.type || "clock-layout",
    containerClasses: raw.containerClasses || "",
    rows: raw.rows?.map((rowRaw: any) => parseRowConfig(rowRaw)) || [],
  };
}

/**
 * Parse raw data into VersionedClockDisplayConfig
 */
export function parseVersionedClockDisplayConfig(raw: any): VersionedClockDisplayConfig {
  const base = parseClockDisplayConfig(raw);
  return {
    ...base,
    lastModifiedBy: raw.lastModifiedBy,
    lastModifiedAt: raw.lastModifiedAt ?? 0,
  };
}
```

**Key Design Notes:**

1. **BaseDisplayConfig**: Provides common fields for all display types
2. **Type Discriminator**: The `type` field enables TypeScript discriminated unions
3. **Extensibility**: New display types can extend `BaseDisplayConfig` with their own configuration
4. **Clock-Specific**: `ClockDisplayConfig` uses the detailed row-based layout for clocks
5. **Future-Proof**: Other displays (maps, charts) can use simpler configs appropriate to their needs

**Usage Example:**

```typescript
// For new configs
const newConfig: ClockDisplayConfig = {
  id: "test",
  name: "Test",
  type: "clock-layout",
  rows: [...]
};
const versioned = withVersion(newConfig, sessionId);

// For updates
const updated = updateVersion(existingConfig, sessionId);

// For type annotations
function saveConfig(config: VersionedClockDisplayConfig) { ... }
```

---

#### Step 1.4: Create EditLock Type

**File**: `src/types/EditLock.ts`

Define the structure for edit locks:

```typescript
export interface EditLock {
  configId: string;
  sessionId: string;
  userName: string; // Display name or "Anonymous User"
  timestamp: number;
  expires: number;
}

export function parseEditLock(raw: any): EditLock {
  return {
    configId: raw.configId || "",
    sessionId: raw.sessionId || "",
    userName: raw.userName || "Anonymous User",
    timestamp: raw.timestamp || Date.now(),
    expires: raw.expires || Date.now() + 300000, // 5 minutes default
  };
}
```

**Status (Oct 10, 2025):**

- Implemented `BaseDisplayConfig` (moved to `src/types/BaseDisplayConfig.ts`), `ClockDisplayConfig` (kept `type` optional for backward compatibility), `VersionedClockDisplayConfig`, and `DisplayConfig` union.
- Added `parseClockDisplayConfig` and `parseVersionedClockDisplayConfig` that default `type` to `"clock-layout"` when missing.
- Deviation: `type` is optional instead of required to avoid breaking existing code; plan assumed strict discriminator.

---

#### Step 1.5: Create Session Management Composable

**File**: `src/composables/useSessionId.ts`

Generate and persist a unique session identifier for each browser session:

```typescript
import { ref, readonly } from "vue";

const sessionId = ref<string>("");
const userName = ref<string>("Anonymous User");

// Generate a simple unique ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useSessionId() {
  /**
   * Initialize session ID (call once on app start)
   */
  function initializeSession() {
    // Try to get existing session from sessionStorage (clears on tab close)
    let storedSessionId = sessionStorage.getItem("lsp-clocks-session-id");

    if (!storedSessionId) {
      storedSessionId = generateSessionId();
      sessionStorage.setItem("lsp-clocks-session-id", storedSessionId);
    }

    sessionId.value = storedSessionId;

    // Try to get user name from localStorage
    const storedUserName = localStorage.getItem("lsp-clocks-user-name");
    if (storedUserName) {
      userName.value = storedUserName;
    }
  }

  /**
   * Set a display name for this session
   */
  function setUserName(name: string) {
    userName.value = name || "Anonymous User";
    localStorage.setItem("lsp-clocks-user-name", userName.value);
  }

  return {
    sessionId: readonly(sessionId),
    userName: readonly(userName),
    initializeSession,
    setUserName,
  };
}
```

**Note**: This provides basic session tracking without authentication. When real auth is added, replace `sessionId` with actual user IDs.

---

#### Step 1.6: Create Edit Lock Composable

**File**: `src/composables/useEditLock.ts`

Manage soft locks for editing:

```typescript
import { ref } from "vue";
import { useRedisCommand } from "./useRedisCommand";
import { useSessionId } from "./useSessionId";
import { EditLock, parseEditLock } from "@/types/EditLock";

const LOCK_DURATION = 300000; // 5 minutes in milliseconds
const LOCK_REFRESH_INTERVAL = 60000; // Refresh every 1 minute

export function useEditLock() {
  const redis = useRedisCommand();
  const { sessionId, userName } = useSessionId();

  const activeLocks = ref<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Redis key for a config lock
   */
  function getLockKey(configId: string): string {
    return `clock-display-config:lock:${configId}`;
  }

  /**
   * Acquire a soft lock on a config
   */
  async function acquireLock(configId: string): Promise<EditLock | null> {
    try {
      const lock: EditLock = {
        configId,
        sessionId: sessionId.value,
        userName: userName.value,
        timestamp: Date.now(),
        expires: Date.now() + LOCK_DURATION,
      };

      const lockKey = getLockKey(configId);
      const lockJson = JSON.stringify(lock);

      // Set lock with expiration (Redis will auto-delete after 5 minutes)
      await redis.send("SET", [lockKey, lockJson, "EX", "300"]);

      // Start auto-refresh interval
      startLockRefresh(configId);

      return lock;
    } catch (err) {
      console.error("Failed to acquire lock:", err);
      return null;
    }
  }

  /**
   * Release a soft lock
   */
  async function releaseLock(configId: string): Promise<void> {
    try {
      const lockKey = getLockKey(configId);
      await redis.send("DEL", [lockKey]);

      // Stop auto-refresh
      stopLockRefresh(configId);
    } catch (err) {
      console.error("Failed to release lock:", err);
    }
  }

  /**
   * Check if a config is locked by someone else
   */
  async function checkLock(configId: string): Promise<EditLock | null> {
    try {
      const lockKey = getLockKey(configId);
      const response = await redis.send("GET", [lockKey]);

      if (!response.data) {
        return null;
      }

      const lock = parseEditLock(JSON.parse(response.data));

      // Check if lock is expired
      if (lock.expires < Date.now()) {
        await releaseLock(configId);
        return null;
      }

      // If it's our own lock, return null (we can edit)
      if (lock.sessionId === sessionId.value) {
        return null;
      }

      return lock;
    } catch (err) {
      console.error("Failed to check lock:", err);
      return null;
    }
  }

  /**
   * Start periodic lock refresh
   */
  function startLockRefresh(configId: string) {
    // Clear existing interval if any
    stopLockRefresh(configId);

    const interval = setInterval(async () => {
      try {
        const lockKey = getLockKey(configId);
        const lock: EditLock = {
          configId,
          sessionId: sessionId.value,
          userName: userName.value,
          timestamp: Date.now(),
          expires: Date.now() + LOCK_DURATION,
        };

        // Refresh lock expiration
        await redis.send("SET", [lockKey, JSON.stringify(lock), "EX", "300"]);
      } catch (err) {
        console.error("Failed to refresh lock:", err);
        stopLockRefresh(configId);
      }
    }, LOCK_REFRESH_INTERVAL);

    activeLocks.value.set(configId, interval);
  }

  /**
   * Stop lock refresh interval
   */
  function stopLockRefresh(configId: string) {
    const interval = activeLocks.value.get(configId);
    if (interval) {
      clearInterval(interval);
      activeLocks.value.delete(configId);
    }
  }

  /**
   * Clean up all locks when component unmounts
   */
  function releaseAllLocks() {
    activeLocks.value.forEach((_, configId) => {
      releaseLock(configId);
    });
  }

  return {
    acquireLock,
    releaseLock,
    checkLock,
    releaseAllLocks,
  };
}
```

---

#### Step 1.7: Update useDisplayConfigs with Version Checking

Update the save functions to use the generic versioning utilities:

```typescript
// Add to useDisplayConfigs composable
import { withVersion, updateVersion, type Versioned } from "@/types/Versioned";
import {
  type ClockDisplayConfig,
  type VersionedClockDisplayConfig,
  parseVersionedClockDisplayConfig,
} from "@/types/ClockDisplayConfig";
import { useSessionId } from "./useSessionId";

const { sessionId } = useSessionId();

/**
 * Create a new display config with last-modified info
 */
async function createDisplayConfig(config: ClockDisplayConfig): Promise<boolean> {
  try {
    // Validate ID uniqueness
    if (displayConfigs.value.some((c) => c.id === config.id)) {
      showToast({
        title: "Error",
        description: "A display with this ID already exists",
        variant: "destructive",
      });
      return false;
    }

    // Add version info using utility function
    const versionedConfig = withVersion(config, sessionId.value);

    // Save to Redis
    const configJson = JSON.stringify(versionedConfig);
    await redis.send("SET", [getDisplayKey(config.id), configJson]);
    await redis.send("SADD", [DISPLAY_LIST_KEY, config.id]);

    // Update local state
    displayConfigs.value.push(versionedConfig);

    showToast({
      title: "Success",
      description: `Display "${config.name}" created successfully`,
    });

    return true;
  } catch (err) {
    showToast({
      title: "Error",
      description: "Failed to create display configuration",
      variant: "destructive",
    });
    console.error(err);
    return false;
  }
}

/**
 * Update with conflict detection
 */
async function updateDisplayConfig(
  config: ClockDisplayConfig,
  originalLastModifiedAt: number
): Promise<{ success: boolean; conflict?: boolean; currentConfig?: VersionedClockDisplayConfig }> {
  try {
    // Get current from Redis
    const response = await redis.send("GET", [getDisplayKey(config.id)]);
    if (response.data) {
      const currentConfig = parseVersionedClockDisplayConfig(JSON.parse(response.data));

      // Check for conflict
      if ((currentConfig.lastModifiedAt ?? 0) !== (originalLastModifiedAt ?? 0)) {
        return {
          success: false,
          conflict: true,
          currentConfig,
        };
      }
    }

    // No conflict, proceed with save using utility function
    const versionedConfig = updateVersion(config, sessionId.value);

    const configJson = JSON.stringify(versionedConfig);
    await redis.send("SET", [getDisplayKey(config.id), configJson]);

    // Update local state
    const index = displayConfigs.value.findIndex((c) => c.id === config.id);
    if (index !== -1) {
      displayConfigs.value[index] = versionedConfig;
    }

    showToast({
      title: "Success",
      description: `Display "${config.name}" updated successfully`,
    });

    return { success: true };
  } catch (err) {
    showToast({
      title: "Error",
      description: "Failed to update display configuration",
      variant: "destructive",
    });
    console.error(err);
    return { success: false };
  }
}
```

**Verify**:

- [ ] Generic `Versioned<T>` type and utilities created
- [ ] `withVersion()` and `updateVersion()` functions work correctly
- [ ] Base `ClockDisplayConfig` remains clean (no version field; uses lastModifiedAt)
- [ ] `VersionedClockDisplayConfig` type alias created
- [ ] Parse functions handle both versioned and non-versioned data
- [ ] Session ID generates uniquely per browser tab
- [ ] Locks acquire and release properly
- [ ] Lock refresh works while editor is open
- [ ] Version conflict detection works
- [ ] Pattern is reusable for future data types

**Status (Oct 10, 2025):**

- Implemented `src/types/EditLock.ts` with `EditLock` and `parseEditLock` utilities.
- No deviations from the plan.

**Status (Oct 10, 2025):**

- Implemented `src/composables/useSessionId.ts` with `initializeSession`, `setUserName`, and reactive getters.
- No deviations from the plan.

**Status (Oct 10, 2025):**

- Implemented `src/composables/useEditLock.ts` with `acquireLock`, `releaseLock`, `checkLock`, and periodic refresh.
- Uses `sendInstantCommand` with `SET key payload EX 300` to set/refresh TTL.
- No deviations from the plan.

**Status (Oct 10, 2025):**

- Updated `useDisplayConfigs` to use `withVersion` on create and `updateVersion` on update.
- Added `getVersionedDisplayConfig` and `updateDisplayConfigWithVersion(config, originalLastModifiedAt)` for conflict detection.
- Kept existing `updateDisplayConfig` for simple updates where conflict handling isn’t needed.
- No deviations beyond naming alignment with current APIs (`sendInstantCommand`, `emitToast`).

---

### Phase 2: Display Configurations List Page

#### Step 2.1: Create DisplayConfigsList Component

**File**: `src/components/Pages/ConfigPage/views/displays/DisplayConfigsList.vue`

**Purpose**: Main page for viewing, searching, and managing display configurations.

**Features**:

- Table view of all display configs
- Search/filter functionality
- Create new display button
- Edit, duplicate, and delete actions for each display
- Preview display button

**Implementation**:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Copy, Trash2, Eye } from "lucide-vue-next";
import DisplayPreview from "./DisplayPreview.vue";

const router = useRouter();
const { displayConfigs, isLoading, loadDisplayConfigs, deleteDisplayConfig, duplicateDisplayConfig } =
  useDisplayConfigs();

const searchQuery = ref("");
const showPreview = ref(false);
const previewConfigId = ref<string | null>(null);

// Filter configs based on search
const filteredConfigs = computed(() => {
  if (!searchQuery.value) return displayConfigs.value;
  const query = searchQuery.value.toLowerCase();
  return displayConfigs.value.filter(
    (config) =>
      config.name.toLowerCase().includes(query) ||
      config.description.toLowerCase().includes(query) ||
      config.id.toLowerCase().includes(query)
  );
});

// Load configs on mount
onMounted(() => {
  loadDisplayConfigs();
});

// Navigate to create page
function createNew() {
  router.push("/config/display-configs/create");
}

// Navigate to edit page
function editConfig(id: string) {
  router.push(`/config/display-configs/${id}/edit`);
}

// Duplicate config
async function duplicateConfig(id: string) {
  await duplicateDisplayConfig(id);
}

// Delete config with confirmation
async function deleteConfig(id: string, name: string) {
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    await deleteDisplayConfig(id);
  }
}

// Show preview modal
function previewConfig(id: string) {
  previewConfigId.value = id;
  showPreview.value = true;
}

// Count total clocks in a display
function getTotalClocks(config: any) {
  return config.rows.reduce((total: number, row: any) => total + row.clocks.length, 0);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold">Display Configurations</h2>
        <p class="text-muted-foreground">Manage clock display layouts</p>
      </div>
      <Button @click="createNew" size="default">
        <Plus class="mr-2 h-4 w-4" />
        Create Display
      </Button>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input v-model="searchQuery" placeholder="Search displays..." class="pl-10" />
    </div>

    <!-- Table -->
    <Card>
      <CardContent class="pt-6">
        <div v-if="isLoading" class="text-center py-8 text-muted-foreground">Loading configurations...</div>

        <div v-else-if="filteredConfigs.length === 0" class="text-center py-8 text-muted-foreground">
          <p>No display configurations found.</p>
          <Button @click="createNew" variant="link" class="mt-2"> Create your first display </Button>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Clocks</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="config in filteredConfigs" :key="config.id">
              <TableCell class="font-medium">
                {{ config.name }}
                <div class="text-xs text-muted-foreground">{{ config.id }}</div>
              </TableCell>
              <TableCell class="max-w-md truncate">
                {{ config.description || "—" }}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{{ config.rows.length }}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{{ getTotalClocks(config) }}</Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button @click="previewConfig(config.id)" variant="ghost" size="icon" title="Preview">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button @click="editConfig(config.id)" variant="ghost" size="icon" title="Edit">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button @click="duplicateConfig(config.id)" variant="ghost" size="icon" title="Duplicate">
                    <Copy class="h-4 w-4" />
                  </Button>
                  <Button @click="deleteConfig(config.id, config.name)" variant="ghost" size="icon" title="Delete">
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Preview Modal -->
    <DisplayPreview v-if="showPreview && previewConfigId" :config-id="previewConfigId" @close="showPreview = false" />
  </div>
</template>
```

**Verify**:

- [ ] Component renders without errors
- [ ] Search filters correctly
- [ ] All buttons navigate/trigger correctly
- [ ] Table displays config data properly

**Status (Oct 10, 2025):**

- Implemented `DisplayConfigsList.vue` with search, table, and actions (create, edit, duplicate, delete, preview hook point).
- Wired to `useDisplayConfigs` (`loadDisplayConfigs`, `deleteDisplayConfig`, `duplicateDisplayConfig`).
- Routing to create/edit matches existing routes.
- Preview modal stub controlled via `showPreview`/`previewConfigId` (component to be added in Phase 4.4).

---

### Phase 3: Generic Clock Display Component

#### Step 3.1: Create GenericClockDisplay Component

**File**: `src/components/Pages/Displays/GenericClockDisplay.vue`

**Purpose**: Dynamically render any clock display configuration. This replaces hard-coded displays like `AllClocks.vue`.

**Features**:

- Accepts `ClockDisplayConfig` as prop
- Renders clocks in flexible row layouts
- Uses same visual style as `AllClocks.vue` (animated background, SVG container)
- Connects to clock data via Redis observer

**Implementation**:

```vue
<script setup lang="ts">
import { reactive, computed, PropType } from "vue";
import Clock from "@/components/Clock/Clock.vue";
import AnimatedBackground4 from "@/components/AnimatedBackground4.vue";
import { useRedisObserver } from "@/composables/useRedisObserver";
import { ClockDataType, parseClockData } from "@/types/ClockData";
import { ClockDisplayConfig } from "@/types/ClockDisplayConfig";
import { generateRowClasses } from "@/types/ClockRowConfig";

const props = defineProps({
  config: {
    type: Object as PropType<ClockDisplayConfig>,
    required: true,
  },
});

const { addObserver } = useRedisObserver();

// Clock data from Redis
const clockData = reactive<ClockDataType>({
  utc: 0,
  local: 0,
  timezoneStr: "",
  t: 0,
  l: 0,
  holdRemaining: 0,
  untilRestart: 0,
  windowUsed: 0,
  windowRemaining: 0,
  tZero: 0,
  met: 0,
});

addObserver("clockdata", (response) => {
  const parsed = parseClockData(response.data);
  Object.assign(clockData, parsed);
});

// Generate container classes
const containerClasses = computed(() => {
  return props.config.containerClasses || "flex flex-col w-full gap-8 justify-center items-center";
});

// Get the clock data value for a specific clock
function getClockTime(clock: any): number {
  // Map label to data property
  const labelMap: Record<string, keyof ClockDataType> = {
    UTC: "utc",
    LOCAL: "local",
    T: "t",
    L: "l",
    "Hold Remaining": "holdRemaining",
    "Time Until Restart": "untilRestart",
    "Window Used": "windowUsed",
    "Window Remaining": "windowRemaining",
    "T-Zero": "tZero",
    MET: "met",
  };

  // Try to match by label
  const key = labelMap[clock.labelLeft || ""] || labelMap[clock.labelRight || ""] || labelMap[clock.labelTop || ""];

  return key ? (clockData[key] as number) : 0;
}
</script>

<template>
  <div class="w-screen h-screen">
    <AnimatedBackground4 />
    <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 2500 1200">
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div class="h-full w-full flex p-5 justify-center items-center">
          <div :class="containerClasses">
            <!-- Render each row -->
            <div v-for="(row, rowIndex) in config.rows" :key="rowIndex" :class="generateRowClasses(row)">
              <!-- Render each clock in the row -->
              <Clock
                v-for="(clock, clockIndex) in row.clocks"
                :key="clockIndex"
                :label-left="clock.labelLeft"
                :label-right="clock.labelRight"
                :label-top="clock.labelTop"
                :size="clock.size"
                :format="clock.format"
                :time-type="clock.timeType"
                :time="getClockTime(clock)"
              />
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>
```

**Important Notes**:

- The `getClockTime()` function maps clock labels to clock data properties
- This mapping may need to be enhanced or made configurable in the future
- Consider adding a `dataBinding` property to `ClockConfig` for explicit data mapping

**Verify**:

- [ ] Component renders with valid config prop
- [ ] Clocks display correct data
- [ ] Layout respects row configurations
- [ ] Background animates correctly

**Status (Oct 10, 2025):**

- Implemented `src/components/Pages/Displays/GenericClockDisplay.vue` using `Clock.vue`, `AnimatedBackground4`, and `useRedisObserver`.
- Label-to-data mapping added; consider explicit binding later as planned.
- No deviations from the plan.

---

### Phase 4: Display Configuration Editor

#### Step 4.1: Create Sub-Components

##### ClockEditor Component

**File**: `src/components/Pages/ConfigPage/views/displays/ClockEditor.vue`

**Purpose**: Form for editing a single clock's configuration.

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { ClockConfig } from "@/types/ClockConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-vue-next";

const props = defineProps<{
  clock: ClockConfig;
  index: number;
}>();

const emit = defineEmits<{
  update: [clock: ClockConfig];
  remove: [];
}>();

const localClock = ref<ClockConfig>({ ...props.clock });

watch(
  localClock,
  (newValue) => {
    emit("update", newValue);
  },
  { deep: true }
);
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm">Clock {{ index + 1 }}</CardTitle>
        <Button @click="emit('remove')" variant="ghost" size="icon">
          <Trash2 class="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="grid grid-cols-3 gap-2">
        <div>
          <Label>Label Left</Label>
          <Input v-model="localClock.labelLeft" placeholder="e.g., T" />
        </div>
        <div>
          <Label>Label Top</Label>
          <Input v-model="localClock.labelTop" placeholder="e.g., T-Zero" />
        </div>
        <div>
          <Label>Label Right</Label>
          <Input v-model="localClock.labelRight" placeholder="e.g., UTC" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div>
          <Label>Size</Label>
          <select
            v-model="localClock.size"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
            <option value="2xl">2XL</option>
          </select>
        </div>
        <div>
          <Label>Format</Label>
          <select
            v-model="localClock.format"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="DDHHMMSS">DD:HH:MM:SS</option>
            <option value="HHMMSS">HH:MM:SS</option>
            <option value="MMSS">MM:SS</option>
            <option value="SS">SS</option>
          </select>
        </div>
        <div>
          <Label>Time Type</Label>
          <select
            v-model="localClock.timeType"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="date">Date</option>
            <option value="timespan">Timespan</option>
          </select>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

##### RowEditor Component

**File**: `src/components/Pages/ConfigPage/views/displays/RowEditor.vue`

**Purpose**: Form for editing a row's configuration and its clocks.

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { ClockRowConfig } from "@/types/ClockRowConfig";
import { ClockConfig } from "@/types/ClockConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-vue-next";
import ClockEditor from "./ClockEditor.vue";

const props = defineProps<{
  row: ClockRowConfig;
  index: number;
}>();

const emit = defineEmits<{
  update: [row: ClockRowConfig];
  remove: [];
}>();

const localRow = ref<ClockRowConfig>({ ...props.row });

watch(
  localRow,
  (newValue) => {
    emit("update", newValue);
  },
  { deep: true }
);

function addClock() {
  const newClock: ClockConfig = {
    size: "md",
    format: "HHMMSS",
    timeType: "date",
  };
  localRow.value.clocks.push(newClock);
}

function updateClock(index: number, clock: ClockConfig) {
  localRow.value.clocks[index] = clock;
}

function removeClock(index: number) {
  localRow.value.clocks.splice(index, 1);
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Row {{ index + 1 }}</CardTitle>
        <Button @click="emit('remove')" variant="ghost" size="icon">
          <Trash2 class="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Row Settings -->
      <div class="grid grid-cols-3 gap-4">
        <div>
          <Label>Gap</Label>
          <Input v-model.number="localRow.gap" type="number" placeholder="8" />
        </div>
        <div>
          <Label>Justify</Label>
          <Input v-model="localRow.justify" placeholder="center" />
        </div>
        <div>
          <Label>Align</Label>
          <Input v-model="localRow.align" placeholder="center" />
        </div>
      </div>

      <!-- Clocks -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label class="text-sm font-medium">Clocks in Row</Label>
          <Button @click="addClock" variant="outline" size="sm">
            <Plus class="mr-1 h-3 w-3" />
            Add Clock
          </Button>
        </div>

        <div v-if="localRow.clocks.length === 0" class="text-center py-4 text-sm text-muted-foreground">
          No clocks in this row. Click "Add Clock" to get started.
        </div>

        <div class="space-y-2">
          <ClockEditor
            v-for="(clock, clockIndex) in localRow.clocks"
            :key="clockIndex"
            :clock="clock"
            :index="clockIndex"
            @update="(c) => updateClock(clockIndex, c)"
            @remove="removeClock(clockIndex)"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

**Verify**:

- [ ] Components render correctly
- [ ] Forms are reactive
- [ ] Add/remove actions work
- [ ] Data updates propagate to parent

**Status (Oct 10, 2025):**

- Implemented `ClockEditor.vue` for single-clock editing with reactive form fields and remove action.
- Implemented `RowEditor.vue` for row settings and clock list management (add/update/remove).
- Wired components with our UI primitives.

---

#### Step 4.2: Create DisplayConfigEditor Page

**File**: `src/components/Pages/ConfigPage/views/displays/DisplayConfigEditor.vue`

**Purpose**: Main editor page for creating/editing display configurations.

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { ClockDisplayConfig } from "@/types/ClockDisplayConfig";
import { ClockRowConfig, defaultRowConfig } from "@/types/ClockRowConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, X } from "lucide-vue-next";
import RowEditor from "./RowEditor.vue";

const route = useRoute();
const router = useRouter();
const { getDisplayConfig, createDisplayConfig, updateDisplayConfig } = useDisplayConfigs();

const isEditMode = computed(() => route.name === "config-display-config-edit");
const configId = computed(() => route.params.id as string);

// Form state
const displayConfig = ref<ClockDisplayConfig>({
  id: "",
  name: "",
  description: "",
  containerClasses: "flex flex-col w-full gap-8 justify-center items-center",
  rows: [],
});

const isSaving = ref(false);

// Load existing config if in edit mode
onMounted(() => {
  if (isEditMode.value && configId.value) {
    const existing = getDisplayConfig(configId.value);
    if (existing) {
      displayConfig.value = JSON.parse(JSON.stringify(existing)); // Deep clone
    } else {
      // Config not found, redirect to list
      router.push("/config/display-configs");
    }
  }
});

// Add a new row
function addRow() {
  displayConfig.value.rows.push({ ...defaultRowConfig, clocks: [] });
}

// Update a row
function updateRow(index: number, row: ClockRowConfig) {
  displayConfig.value.rows[index] = row;
}

// Remove a row
function removeRow(index: number) {
  displayConfig.value.rows.splice(index, 1);
}

// Save configuration
async function save() {
  // Validation
  if (!displayConfig.value.id.trim()) {
    alert("Please enter a display ID");
    return;
  }
  if (!displayConfig.value.name.trim()) {
    alert("Please enter a display name");
    return;
  }

  isSaving.value = true;

  const success = isEditMode.value
    ? await updateDisplayConfig(displayConfig.value)
    : await createDisplayConfig(displayConfig.value);

  isSaving.value = false;

  if (success) {
    router.push("/config/display-configs");
  }
}

// Cancel and go back
function cancel() {
  router.push("/config/display-configs");
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold">
          {{ isEditMode ? "Edit Display Configuration" : "Create Display Configuration" }}
        </h2>
        <p class="text-muted-foreground">
          {{ isEditMode ? "Modify existing display layout" : "Design a new clock display layout" }}
        </p>
      </div>
      <div class="flex gap-2">
        <Button @click="cancel" variant="outline">
          <X class="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button @click="save" :disabled="isSaving">
          <Save class="mr-2 h-4 w-4" />
          {{ isSaving ? "Saving..." : "Save" }}
        </Button>
      </div>
    </div>

    <!-- Display Info -->
    <Card>
      <CardHeader>
        <CardTitle>Display Information</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>Display ID *</Label>
            <Input v-model="displayConfig.id" placeholder="e.g., mission-control-main" :disabled="isEditMode" />
            <p class="text-xs text-muted-foreground mt-1">Unique identifier (cannot be changed after creation)</p>
          </div>
          <div>
            <Label>Display Name *</Label>
            <Input v-model="displayConfig.name" placeholder="e.g., Mission Control Display" />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Input v-model="displayConfig.description" placeholder="Brief description of this display configuration" />
        </div>
        <div>
          <Label>Container Classes (Advanced)</Label>
          <Input v-model="displayConfig.containerClasses" placeholder="Tailwind CSS classes for container" />
          <p class="text-xs text-muted-foreground mt-1">
            Custom CSS classes for the main container (leave default unless you know what you're doing)
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Rows -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-semibold">Rows</h3>
        <Button @click="addRow" variant="outline">
          <Plus class="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </div>

      <div v-if="displayConfig.rows.length === 0" class="text-center py-8 text-muted-foreground">
        <p>No rows yet. Click "Add Row" to start building your display.</p>
      </div>

      <div class="space-y-4">
        <RowEditor
          v-for="(row, rowIndex) in displayConfig.rows"
          :key="rowIndex"
          :row="row"
          :index="rowIndex"
          @update="(r) => updateRow(rowIndex, r)"
          @remove="removeRow(rowIndex)"
        />
      </div>
    </div>
  </div>
</template>
```

**Additional Updates for Concurrent Editing**:

Add lock management and conflict detection to the editor:

```typescript
// Add to DisplayConfigEditor.vue script setup:
import { useEditLock } from "@/composables/useEditLock";
import ConflictResolution from "./ConflictResolution.vue";

const { acquireLock, releaseLock, checkLock } = useEditLock();

const lockInfo = ref<EditLock | null>(null);
const originalLastModifiedAt = ref<number>(0);
const showConflictModal = ref(false);
const conflictConfig = ref<VersionedClockDisplayConfig | null>(null);

// Check for lock when mounting in edit mode
onMounted(async () => {
  if (isEditMode.value && configId.value) {
    const existing = getDisplayConfig(configId.value);
    if (existing) {
      displayConfig.value = JSON.parse(JSON.stringify(existing));
      originalLastModifiedAt.value = existing.lastModifiedAt || 0;

      // Check if someone else is editing
      lockInfo.value = await checkLock(configId.value);

      // Acquire our own lock
      await acquireLock(configId.value);
    } else {
      router.push("/config/display-configs");
    }
  }
});

// Release lock when leaving
onBeforeUnmount(() => {
  if (isEditMode.value && configId.value) {
    releaseLock(configId.value);
  }
});

// Updated save function with conflict detection
async function save() {
  // Validation
  if (!displayConfig.value.id.trim()) {
    alert("Please enter a display ID");
    return;
  }
  if (!displayConfig.value.name.trim()) {
    alert("Please enter a display name");
    return;
  }

  isSaving.value = true;

  if (isEditMode.value) {
    // Check for conflicts
    const result = await updateDisplayConfig(displayConfig.value, originalLastModifiedAt.value);

    if (result.conflict && result.currentConfig) {
      // Show conflict resolution UI
      conflictConfig.value = result.currentConfig;
      showConflictModal.value = true;
      isSaving.value = false;
      return;
    }

    if (result.success) {
      await releaseLock(configId.value);
      router.push("/config/display-configs");
    }
  } else {
    const success = await createDisplayConfig(displayConfig.value);
    if (success) {
      router.push("/config/display-configs");
    }
  }

  isSaving.value = false;
}

// Handle conflict resolution
function handleOverwrite() {
  // User chose to overwrite - force save with current data
  originalLastModifiedAt.value = conflictConfig.value!.lastModifiedAt || 0;
  showConflictModal.value = false;
  save();
}

function handleCancel() {
  showConflictModal.value = false;
  router.push("/config/display-configs");
}
```

Add lock warning to the template:

```vue
<template>
  <div class="space-y-6">
    <!-- Lock Warning Banner -->
    <div v-if="lockInfo" class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">
            <strong>{{ lockInfo.userName }}</strong> is currently editing this configuration. You can still make edits,
            but be aware of potential conflicts.
          </p>
        </div>
      </div>
    </div>

    <!-- Conflict Resolution Modal -->
    <ConflictResolution
      v-if="showConflictModal && conflictConfig"
      :your-config="displayConfig"
      :their-config="conflictConfig"
      @overwrite="handleOverwrite"
      @cancel="handleCancel"
    />

    <!-- Rest of the template... -->
  </div>
</template>
```

**Verify**:

- [ ] Form loads correctly in create mode
- [ ] Form loads existing config in edit mode
- [ ] Lock acquired when opening editor
- [ ] Lock released when leaving editor
- [ ] Warning banner shows when someone else is editing
- [ ] Add/remove rows works
- [ ] Save detects conflicts
- [ ] Conflict modal appears on conflict
- [ ] Validation prevents incomplete configs
- [ ] Cancel returns to list and releases lock

**Status (Oct 10, 2025):**

- Implemented `DisplayConfigEditor.vue` with create/edit flow, validation, add/update/remove rows, and save/cancel actions.
- Currently uses simple save; conflict and lock handling will be added in the next sub-step per plan.

---

#### Step 4.3: Create ConflictResolution Component

**File**: `src/components/Pages/ConfigPage/views/displays/ConflictResolution.vue`

**Purpose**: Modal to handle save conflicts when multiple users edit the same config.

```vue
<script setup lang="ts">
import { computed, PropType } from "vue";
import { type VersionedClockDisplayConfig } from "@/types/ClockDisplayConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-vue-next";

const props = defineProps({
  yourConfig: {
    type: Object as PropType<VersionedClockDisplayConfig>,
    required: true,
  },
  theirConfig: {
    type: Object as PropType<VersionedClockDisplayConfig>,
    required: true,
  },
});

const emit = defineEmits<{
  overwrite: [];
  cancel: [];
}>();

// Format timestamp for display
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

// Simple diff detection
const differences = computed(() => {
  const diffs: string[] = [];

  if (props.yourConfig.name !== props.theirConfig.name) {
    diffs.push(`Name: "${props.theirConfig.name}" → "${props.yourConfig.name}"`);
  }

  if (props.yourConfig.description !== props.theirConfig.description) {
    diffs.push(`Description changed`);
  }

  if (props.yourConfig.rows.length !== props.theirConfig.rows.length) {
    diffs.push(`Rows: ${props.theirConfig.rows.length} → ${props.yourConfig.rows.length}`);
  }

  return diffs;
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <Card class="w-full max-w-2xl mx-4">
      <CardHeader>
        <div class="flex items-center gap-3">
          <AlertCircle class="h-6 w-6 text-destructive" />
          <CardTitle>Save Conflict Detected</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          This configuration was modified by
          <strong>{{ theirConfig.lastModifiedBy || "another user" }}</strong>
          at {{ formatTime(theirConfig.lastModifiedAt || 0) }} while you were editing.
        </p>

        <div class="space-y-2">
          <h4 class="text-sm font-medium">Changes detected:</h4>
          <ul class="list-disc list-inside text-sm text-muted-foreground">
            <li v-for="diff in differences" :key="diff">{{ diff }}</li>
          </ul>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-sm text-yellow-800">
            <strong>Warning:</strong> If you proceed, your changes will overwrite the other user's changes.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <Button @click="emit('cancel')" variant="outline"> Cancel and Discard My Changes </Button>
          <Button @click="emit('overwrite')" variant="destructive"> Save and Overwrite Their Changes </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
```

**Future Enhancement**: Add a "View Full Diff" feature that shows side-by-side comparison of the two versions.

**Verify**:

- [ ] Modal displays when conflict detected
- [ ] Shows who made conflicting changes
- [ ] Shows timestamp of their changes
- [ ] Lists detected differences
- [ ] Overwrite button works
- [ ] Cancel button returns without saving

---

#### Step 4.4: Create DisplayPreview Component

**File**: `src/components/Pages/ConfigPage/views/displays/DisplayPreview.vue`

**Purpose**: Modal to preview how a display configuration will look.

```vue
<script setup lang="ts">
import { computed } from "vue";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import GenericClockDisplay from "@/components/Pages/Displays/GenericClockDisplay.vue";
import { X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  configId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { getDisplayConfig } = useDisplayConfigs();

const config = computed(() => getDisplayConfig(props.configId));
</script>

<template>
  <!-- Full screen modal -->
  <div class="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
    <!-- Close button -->
    <Button @click="emit('close')" variant="ghost" size="icon" class="absolute top-4 right-4 z-10">
      <X class="h-6 w-6" />
    </Button>

    <!-- Display preview -->
    <div v-if="config" class="w-full h-full">
      <GenericClockDisplay :config="config" />
    </div>

    <div v-else class="flex items-center justify-center h-full">
      <p class="text-muted-foreground">Configuration not found</p>
    </div>
  </div>
</template>
```

**Verify**:

- [ ] Modal displays full screen
- [ ] Close button works
- [ ] Display renders correctly
- [ ] Missing config handled gracefully

---

### Phase 5: Router Integration

#### Step 5.1: Update Routes

**File**: `src/router/routes.ts`

Add the display config routes to the existing config section:

```typescript
// Inside the /config parent route's children array:
{
  path: 'display-configs',
  name: 'config-display-configs',
  component: () => import('@/components/Pages/ConfigPage/views/displays/DisplayConfigsList.vue'),
  meta: { title: 'Display Configurations', description: 'Manage clock display layouts', category: 'displays' }
},
{
  path: 'display-configs/create',
  name: 'config-display-config-create',
  component: () => import('@/components/Pages/ConfigPage/views/displays/DisplayConfigEditor.vue'),
  meta: { title: 'Create Display Configuration', description: 'Design a new clock display layout', category: 'displays' }
},
{
  path: 'display-configs/:id/edit',
  name: 'config-display-config-edit',
  component: () => import('@/components/Pages/ConfigPage/views/displays/DisplayConfigEditor.vue'),
  meta: { title: 'Edit Display Configuration', description: 'Modify existing display layout', category: 'displays' }
},
```

**Verify**:

- [ ] Routes compile without errors
- [ ] Navigation to each route works
- [ ] Route params pass correctly

**Status (Oct 10, 2025):**

- Routes for list/create/edit already exist in `src/router/routes.ts` under `/config/display-configs`.
- No changes required.

---

### Phase 6: Initialize Configs on App Load

#### Step 6.1: Update App.vue

**File**: `src/App.vue`

Add display config loading and session initialization to app startup:

```typescript
// In App.vue script setup, add:
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { useSessionId } from "@/composables/useSessionId";

const { loadDisplayConfigs } = useDisplayConfigs();
const { initializeSession } = useSessionId();

// Initialize session and load display configs on app start
onMounted(() => {
  initializeSession(); // Create/restore session ID
  loadDisplayConfigs(); // Load all display configs
});
```

**Optional**: Add a UI element to let users set their display name:

```vue
<!-- In TopNav.vue or similar -->
<script setup>
import { ref } from "vue";
import { useSessionId } from "@/composables/useSessionId";

const { userName, setUserName } = useSessionId();
const isEditingName = ref(false);
const tempName = ref("");

function startEditName() {
  tempName.value = userName.value;
  isEditingName.value = true;
}

function saveName() {
  if (tempName.value.trim()) {
    setUserName(tempName.value.trim());
  }
  isEditingName.value = false;
}
</script>

<template>
  <!-- Add to navigation -->
  <div class="flex items-center gap-2">
    <span v-if="!isEditingName" class="text-sm text-muted-foreground">
      {{ userName }}
      <Button @click="startEditName" variant="ghost" size="sm">Edit</Button>
    </span>
    <div v-else class="flex gap-2">
      <Input v-model="tempName" placeholder="Your name" class="w-40" />
      <Button @click="saveName" size="sm">Save</Button>
    </div>
  </div>
</template>
```

**Verify**:

- [ ] Session ID initializes on app start
- [ ] Session ID persists across page refreshes
- [ ] Session ID clears when tab closes (sessionStorage behavior)
- [ ] User can set their display name
- [ ] Display name persists across sessions
- [ ] Configs load on app start
- [ ] No errors in console
- [ ] Configs available throughout app

**Status (Oct 10, 2025):**

- Added session initialization and display config loading in `App.vue` via `onMounted` using `useSessionId` and `useDisplayConfigs`.
- No deviations from plan.

---

### Phase 7: Enhanced Features

#### Step 7.1: Add Default/Template Configurations

Create a utility to seed the database with sample configurations for first-time users.

**File**: `src/lib/defaultDisplayConfigs.ts`

**Status (Oct 15, 2025):**

- Implemented `src/lib/defaultDisplayConfigs.ts` with 3 sample configs: "All Clocks (Default)", "Mission Countdown", and "Simple Time Display".
- Added `seedDefaultConfigs()` to `useDisplayConfigs` that dynamically imports and creates missing defaults.
- **Redis Loader Enhancement**: Modified `src/server/redis-loader.ts` to support version injection:
  - Added `RedisLoaderOptions` interface with `addVersion`, `lastModifiedBy`, `keyPattern`, `overwriteIfPresent`.
  - `loadAllRedisKeys` and `loadRedisKey` now accept optional `options` parameter.
  - `storeInRedis` applies `injectVersionMetadata` when `addVersion=true`, `type="string"`, and key matches pattern.
  - Defaults: `keyPattern=/^clock-display-config:/`, `lastModifiedBy="seed:init"`, `overwriteIfPresent=true`.
  - This keeps version fields out of JSON files while ensuring stored values include `lastModifiedAt`/`lastModifiedBy` for conflict detection.
- **Deviation from plan**: Plan suggested in-app seeding only; we enhanced redis-loader for broader use (can seed from files at server start with version metadata).

**File**: `src/lib/defaultDisplayConfigs.ts`

```typescript
import { ClockDisplayConfig } from "@/types/ClockDisplayConfig";

export const defaultDisplayConfigs: ClockDisplayConfig[] = [
  {
    id: "all-clocks-default",
    name: "All Clocks (Default)",
    description: "Recreation of the original AllClocks.vue layout",
    containerClasses: "flex flex-col w-full gap-8 justify-center items-center",
    rows: [
      {
        clocks: [
          { labelRight: "UTC", size: "2xl", format: "HHMMSS", timeType: "date" },
          { labelRight: "LOCAL", size: "2xl", format: "HHMMSS", timeType: "date" },
        ],
        gap: 8,
        justify: "center",
        align: "center",
      },
      {
        clocks: [
          { labelLeft: "T", size: "xl", format: "HHMMSS", timeType: "timespan" },
          { labelLeft: "L", size: "xl", format: "HHMMSS", timeType: "timespan" },
        ],
        gap: 8,
        justify: "center",
        align: "center",
      },
      {
        clocks: [{ labelTop: "T-Zero", labelRight: "UTC", size: "xl", format: "DDHHMMSS", timeType: "date" }],
        gap: 8,
        justify: "center",
        align: "center",
      },
      {
        clocks: [
          { labelTop: "Hold Remaining", size: "lg", format: "HHMMSS", timeType: "timespan" },
          { labelTop: "Time Until Restart", size: "lg", format: "HHMMSS", timeType: "timespan" },
          { labelTop: "Window Remaining", size: "lg", format: "HHMMSS", timeType: "timespan" },
          { labelTop: "Window Used", size: "lg", format: "HHMMSS", timeType: "timespan" },
        ],
        gap: 8,
        justify: "center",
        align: "center",
      },
      {
        clocks: [
          { labelLeft: "MET", size: "md", format: "HHMMSS", timeType: "timespan" },
          { labelLeft: "MET", size: "md", format: "SS", timeType: "timespan" },
        ],
        gap: 8,
        justify: "center",
        align: "center",
      },
    ],
  },
  {
    id: "mission-countdown",
    name: "Mission Countdown",
    description: "Focus on countdown timers",
    containerClasses: "flex flex-col w-full gap-12 justify-center items-center",
    rows: [
      {
        clocks: [
          { labelTop: "T", size: "2xl", format: "DDHHMMSS", timeType: "timespan" },
          { labelTop: "L", size: "2xl", format: "DDHHMMSS", timeType: "timespan" },
        ],
        gap: 16,
        justify: "center",
        align: "center",
      },
      {
        clocks: [{ labelTop: "Hold Remaining", size: "xl", format: "HHMMSS", timeType: "timespan" }],
        gap: 8,
        justify: "center",
        align: "center",
      },
    ],
  },
  {
    id: "simple-time",
    name: "Simple Time Display",
    description: "Basic UTC and local time",
    containerClasses: "flex flex-col w-full gap-8 justify-center items-center",
    rows: [
      {
        clocks: [
          { labelTop: "UTC", size: "2xl", format: "HHMMSS", timeType: "date" },
          { labelTop: "Local", size: "2xl", format: "HHMMSS", timeType: "date" },
        ],
        gap: 12,
        justify: "center",
        align: "center",
      },
    ],
  },
];
```

Then add a function in `useDisplayConfigs` to seed defaults:

```typescript
async function seedDefaultConfigs() {
  const { defaultDisplayConfigs } = await import("@/lib/defaultDisplayConfigs");

  for (const config of defaultDisplayConfigs) {
    const exists = displayConfigs.value.some((c) => c.id === config.id);
    if (!exists) {
      await createDisplayConfig(config);
    }
  }
}
```

**Verify**:

- [ ] Default configs are well-designed
- [ ] Seeding function works
- [ ] Doesn't duplicate existing configs

**Status (Oct 16, 2025):**

- ✅ Created 3 default display config JSON files in `redis-keys/`:
  - `display.config.all-clocks-default.default.json`
  - `display.config.mission-countdown.default.json`
  - `display.config.simple-time.default.json`
- ✅ Updated `server.ts` to load all Redis keys with version injection options for display configs
- ✅ Removed in-app seeding code (`seedDefaultConfigs`) - now handled by server at startup
- ✅ Deleted `src/lib/defaultDisplayConfigs.ts` - migrated to JSON files
- **Deviation**: Changed from in-app seeding to server-side JSON loading for consistency with existing redis-keys pattern

---

### Phase 7.5: Generic Save/Restore System with Variants

#### Overview

Provide a generic, reusable system for saving Redis keys to JSON files and restoring them, with support for multiple named variants. This allows users to maintain different versions of their configurations (e.g., "default", "backup-2024-10-16", "launch-day") and quickly switch between them.

**Note**: "Variants" here refer to different saved copies of data for different scenarios, NOT the version metadata (`lastModifiedAt`/`lastModifiedBy`) used for conflict detection.

---

#### File Naming Strategy

**Format**: `{sanitized-key}.{variant}.json`

**Examples**:

```
redis-keys/
  display.config.mission-control.default.json
  display.config.mission-control.backup-2024-10-16-14-30-45.json
  display.config.mission-control.launch-day.json
  clockdata.default.json
  clockdata.simulation-mode.json
```

**Rules**:

- Redis key `clock-display-config:foo` → sanitized to `display.config.foo`
- Colons (`:`) replaced with dots (`.`)
- Variant appended as suffix before `.json`
- Default variant: `"default"`
- Server-side only: Client never sees/handles filenames

---

#### Step 7.5.1: Create Shared Variant Utilities

**File**: `src/shared/variantUtils.ts` (new shared directory)

**Purpose**: Shared validation and sanitization between server and client.

```typescript
/**
 * Sanitize variant name to prevent path traversal and ensure safe filenames
 * Shared between server and client for consistency
 */
export function sanitizeVariant(variant: string): string {
  // Only allow alphanumeric, dash, underscore
  return variant.replace(/[^a-zA-Z0-9-_]/g, "-").substring(0, 50);
}

/**
 * Validate variant name
 */
export function isValidVariant(variant: string): boolean {
  return /^[a-zA-Z0-9-_]{1,50}$/.test(variant);
}
```

**Why shared?**

- ✅ Single source of truth for validation
- ✅ Client can validate before sending request
- ✅ Server validates again (defense in depth)
- ✅ Consistent behavior everywhere
- ✅ Reduces code duplication

**Justification for each option property:**

1. **`addVersion?: boolean`** (default: `false`)

   - **Purpose**: Opt-in flag to inject version metadata
   - **Why**: Not all Redis keys need versioning (e.g., `clockdata`, counters, caches). Only display configs benefit from conflict detection.
   - **Justification**: Explicit opt-in prevents polluting unrelated data.

2. **`lastModifiedBy?: string`** (default: `"seed:init"`)

   - **Purpose**: Identifier for who created this record
   - **Why**: Conflict resolution UI shows "Modified by X". Distinguishes seed vs user edits.
   - **Justification**: Helpful for debugging and audit trails.

3. **`keyPattern?: RegExp`** (default: `/^clock-display-config:/`)

   - **Purpose**: Only inject version metadata for keys matching this pattern
   - **Why**: Granular control when loading multiple files in batch
   - **Justification**: Prevents accidental versioning of non-config keys.

4. **`overwriteIfPresent?: boolean`** (default: `true`)
   - **Purpose**: Controls whether to overwrite existing metadata
   - **Why**: `true` = fresh timestamps (seed), `false` = preserve (restore from backup)
   - **Justification**: Flexibility for different workflows.

---

#### Step 7.5.2: Create Server-side File Utilities

**File**: `src/server/redis-file-utils.ts` (new)

**Purpose**: Centralize all file I/O operations with comprehensive error handling.

```typescript
import fs from "fs/promises";
import path from "path";
import { sanitizeVariant } from "@/shared/variantUtils";

const REDIS_KEYS_DIR = path.resolve(__dirname, "../../redis-keys");

export function keyToFileName(redisKey: string, variant: string = "default"): string {
  const sanitized = redisKey.replace(/:/g, ".");
  const safeVariant = sanitizeVariant(variant);
  return `${sanitized}.${safeVariant}.json`;
}

export function fileNameToKey(fileName: string): { key: string; variant: string } {
  const withoutExt = fileName.replace(/\.json$/, "");
  const parts = withoutExt.split(".");
  const variant = parts[parts.length - 1];
  const keySanitized = parts.slice(0, -1).join(".");
  const key = keySanitized.replace(/\./g, ":");
  return { key, variant };
}

export async function listVariantsForKey(redisKey: string): Promise<string[]> {
  try {
    const sanitized = redisKey.replace(/:/g, ".");
    const prefix = `${sanitized}.`;
    const files = await fs.readdir(REDIS_KEYS_DIR);

    const variants = files
      .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
      .map((f) => f.replace(prefix, "").replace(".json", ""))
      .sort();

    return variants;
  } catch (error) {
    console.error(`Error listing variants for ${redisKey}:`, error);
    return [];
  }
}

export function stripVersionMetadata(data: any): any {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const { lastModifiedAt, lastModifiedBy, ...clean } = data;
    return clean;
  }
  return data;
}

export function addVersionMetadata(data: any, lastModifiedBy: string = "restore:user"): any {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const timestamp = Date.now();
    return {
      ...data,
      lastModifiedAt: timestamp,
      lastModifiedBy,
    };
  }
  return data;
}

export async function safeReadJsonFile(filePath: string): Promise<any> {
  try {
    await fs.access(filePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error("File not found");
    }
    throw new Error(`Cannot access file: ${error.message}`);
  }

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

export async function safeWriteJsonFile(filePath: string, data: any): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const jsonContent = JSON.stringify(data, null, 2);

    // Atomic write: write to temp file, then rename
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, jsonContent, "utf-8");
    await fs.rename(tempPath, filePath);
  } catch (error: any) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(`${filePath}.tmp`);
    } catch {}

    throw new Error(`Failed to write file: ${error.message}`);
  }
}

export { REDIS_KEYS_DIR };
```

**Error types handled:**

- ✅ File not found (ENOENT)
- ✅ Invalid JSON syntax
- ✅ Permission denied (EACCES)
- ✅ Disk full (ENOSPC)
- ✅ Directory doesn't exist (create recursively)
- ✅ Partial writes (atomic write via temp file + rename)

---

#### Step 7.5.3: Add RedisAPI Endpoints

**File**: `src/server/RedisAPI.ts`

**Add imports:**

```typescript
import {
  keyToFileName,
  listVariantsForKey,
  stripVersionMetadata,
  addVersionMetadata,
  safeReadJsonFile,
  safeWriteJsonFile,
  REDIS_KEYS_DIR,
} from "./redis-file-utils";
import { isValidVariant } from "@/shared/variantUtils";
```

**Update configureRoutes():**

```typescript
private configureRoutes() {
  this.app.post("/api/items", async (req, res) => {
    await this.onMessage(req, res);
  });

  this.app.post("/api/save-restore/save-keys", async (req, res) => {
    await this.saveKeysToFiles(req, res);
  });

  this.app.post("/api/save-restore/restore-keys", async (req, res) => {
    await this.restoreKeysFromFiles(req, res);
  });

  this.app.get("/api/save-restore/list-variants", async (req, res) => {
    await this.listVariants(req, res);
  });
}
```

**Add endpoint methods:**

```typescript
private async saveKeysToFiles(req: Request, res: Response) {
  try {
    const { keys, variant = "default", stripVersionFields = true } = req.body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: "keys array is required" });
    }

    if (!isValidVariant(variant)) {
      return res.status(400).json({ error: "Invalid variant name" });
    }

    const saved: { key: string; variant: string }[] = [];
    const errors: { key: string; error: string }[] = [];

    for (const key of keys) {
      try {
        const raw = await this.redis.get(key);
        if (!raw) {
          errors.push({ key, error: "Key not found in Redis" });
          continue;
        }

        let data = JSON.parse(raw);
        if (stripVersionFields) {
          data = stripVersionMetadata(data);
        }

        const fileName = keyToFileName(key, variant);
        const filePath = path.join(REDIS_KEYS_DIR, fileName);

        await safeWriteJsonFile(filePath, { key, type: "string", data });
        saved.push({ key, variant });
      } catch (error: any) {
        errors.push({ key, error: error.message });
      }
    }

    res.json({ success: true, saved, errors: errors.length > 0 ? errors : undefined });
  } catch (error: any) {
    console.error("Error in saveKeysToFiles:", error);
    res.status(500).json({ error: error.message });
  }
}

private async restoreKeysFromFiles(req: Request, res: Response) {
  try {
    const {
      keys,
      variant = "default",
      addVersionFields = true,
      versionOptions = {}
    } = req.body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: "keys array is required" });
    }

    if (!isValidVariant(variant)) {
      return res.status(400).json({ error: "Invalid variant name" });
    }

    const restored: { key: string; variant: string }[] = [];
    const errors: { key: string; variant: string; error: string }[] = [];

    for (const key of keys) {
      try {
        const fileName = keyToFileName(key, variant);
        const filePath = path.join(REDIS_KEYS_DIR, fileName);

        const fileData = await safeReadJsonFile(filePath);
        let { data } = fileData;

        if (addVersionFields) {
          data = addVersionMetadata(data, versionOptions.lastModifiedBy || "restore:user");
        }

        // Store to Redis
        await this.redis.set(key, JSON.stringify(data));

        // Update clock-display-config:list if it's a display config
        if (key.startsWith("clock-display-config:")) {
          const id = key.replace("clock-display-config:", "");
          await this.redis.sAdd("clock-display-config:list", id);
        }

        restored.push({ key, variant });
      } catch (error: any) {
        errors.push({ key, variant, error: error.message });
      }
    }

    res.json({ success: true, restored, errors: errors.length > 0 ? errors : undefined });
  } catch (error: any) {
    console.error("Error in restoreKeysFromFiles:", error);
    res.status(500).json({ error: error.message });
  }
}

private async listVariants(req: Request, res: Response) {
  try {
    const { key } = req.query;

    if (!key || typeof key !== "string") {
      return res.status(400).json({ error: "key query parameter is required" });
    }

    const variants = await listVariantsForKey(key);
    res.json({ success: true, key, variants });
  } catch (error: any) {
    console.error("Error listing variants:", error);
    res.status(500).json({ error: error.message });
  }
}
```

---

#### Step 7.5.4: Create Frontend Composable

**File**: `src/composables/useRedisFileSync.ts` (new)

**Purpose**: Generic, reusable composable for save/restore operations from any component.

```typescript
import { ref } from "vue";
import { useToaster } from "./useToaster";
import { sanitizeVariant, isValidVariant, generateBackupVariant } from "@/shared/variantUtils";

const API_BASE = "http://localhost:3000/api/save-restore";

export function useRedisFileSync() {
  const { emitToast } = useToaster();
  const isSaving = ref(false);
  const isRestoring = ref(false);

  async function saveKeysToFiles(
    keys: string[],
    variant: string = "default",
    stripVersionFields: boolean = true
  ): Promise<boolean> {
    if (!isValidVariant(variant)) {
      emitToast({ title: "Invalid variant name", type: "error", deliverTo: "all" });
      return false;
    }

    isSaving.value = true;
    try {
      const response = await fetch(`${API_BASE}/save-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys, variant, stripVersionFields }),
      });

      const result = await response.json();
      if (result.success) {
        const count = result.saved.length;
        emitToast({
          title: `Saved ${count} key${count !== 1 ? "s" : ""} as variant '${variant}'`,
          type: "success",
          deliverTo: "all",
        });
        if (result.errors) {
          console.warn("Some keys failed to save:", result.errors);
        }
        return true;
      } else {
        emitToast({ title: "Failed to save keys", type: "error", deliverTo: "all" });
        return false;
      }
    } catch (e) {
      console.error(e);
      emitToast({ title: "Error saving keys to files", type: "error", deliverTo: "all" });
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function restoreKeysFromFiles(
    keys: string[],
    variant: string = "default",
    addVersionFields: boolean = true
  ): Promise<boolean> {
    if (!isValidVariant(variant)) {
      emitToast({ title: "Invalid variant name", type: "error", deliverTo: "all" });
      return false;
    }

    isRestoring.value = true;
    try {
      const response = await fetch(`${API_BASE}/restore-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys,
          variant,
          addVersionFields,
          versionOptions: { lastModifiedBy: "restore:user" },
        }),
      });

      const result = await response.json();
      if (result.success) {
        const count = result.restored.length;
        emitToast({
          title: `Restored ${count} key${count !== 1 ? "s" : ""} from variant '${variant}'`,
          type: "success",
          deliverTo: "all",
        });
        if (result.errors) {
          console.warn("Some keys failed to restore:", result.errors);
        }
        return true;
      } else {
        emitToast({ title: "Failed to restore keys", type: "error", deliverTo: "all" });
        return false;
      }
    } catch (e) {
      console.error(e);
      emitToast({ title: "Error restoring keys from files", type: "error", deliverTo: "all" });
      return false;
    } finally {
      isRestoring.value = false;
    }
  }

  async function listVariantsForKey(key: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/list-variants?key=${encodeURIComponent(key)}`);
      const result = await response.json();
      return result.variants || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  return {
    isSaving,
    isRestoring,
    saveKeysToFiles,
    restoreKeysFromFiles,
    listVariantsForKey,
    sanitizeVariant,
    isValidVariant,
  };
}
```

**Benefits:**

- ✅ Reusable across entire app (any component can save/restore any keys)
- ✅ Centralized error handling and toasts
- ✅ Loading states exposed for UI feedback
- ✅ Type-safe and consistent

---

#### Step 7.5.5: Update DisplayConfigsList to Use Composable

**File**: `src/components/Pages/ConfigPage/views/displays/DisplayConfigsList.vue`

**Add to script setup:**

```typescript
import { useRedisFileSync } from "@/composables/useRedisFileSync";

const { isSaving, isRestoring, saveKeysToFiles, restoreKeysFromFiles, listVariantsForKey } = useRedisFileSync();

async function saveToFiles() {
  const variant = prompt("Enter variant name:", "default");
  if (!variant) return;

  const allKeys = displayConfigs.value.map((c) => `clock-display-config:${c.id}`);
  await saveKeysToFiles(allKeys, variant, true);
}

async function restoreFromFiles() {
  // Optionally list variants first
  const sampleKey = displayConfigs.value[0]
    ? `clock-display-config:${displayConfigs.value[0].id}`
    : "clock-display-config:default";
  const variants = await listVariantsForKey(sampleKey);

  const variantList = variants.length > 0 ? `\nAvailable: ${variants.join(", ")}` : "";
  const variant = prompt(`Restore from variant:${variantList}`, "default");
  if (!variant) return;

  const allKeys = displayConfigs.value.map((c) => `clock-display-config:${c.id}`);
  const success = await restoreKeysFromFiles(allKeys, variant, true);

  if (success) {
    await loadDisplayConfigs(); // Reload to show updated data
  }
}
```

**Add to template:**

```vue
<div class="flex gap-2">
  <Button @click="saveToFiles" variant="outline" :disabled="isSaving">
    <Save class="mr-2 h-4 w-4" />
    {{ isSaving ? "Saving..." : "Save to File" }}
  </Button>
  <Button @click="restoreFromFiles" variant="outline" :disabled="isRestoring">
    <Upload class="mr-2 h-4 w-4" />
    {{ isRestoring ? "Restoring..." : "Restore from File" }}
  </Button>
  <Button @click="createNew">
    <Plus class="mr-2 h-4 w-4" />
    Create Display
  </Button>
</div>
```

---

#### API Contracts

**1. Save Keys to Files**

**Endpoint**: `POST /api/save-restore/save-keys`

**Request**:

```typescript
{
  keys: string[],              // Required: ["clock-display-config:foo", ...]
  variant?: string,            // Optional: "backup-2024-10-16" (default: "default")
  stripVersionFields?: boolean // Optional: true (default)
}
```

**Response**:

```typescript
{
  success: true,
  saved: [
    { key: "clock-display-config:mission-control", variant: "default" },
    { key: "clock-display-config:launch", variant: "default" }
  ],
  errors?: [  // Optional: only present if some keys failed
    { key: "clock-display-config:missing", error: "Key not found in Redis" }
  ]
}
```

---

**2. Restore Keys from Files**

**Endpoint**: `POST /api/save-restore/restore-keys`

**Request**:

```typescript
{
  keys: string[],                    // Required: ["clock-display-config:foo", ...]
  variant?: string,                  // Optional: "backup-2024-10-16" (default: "default")
  addVersionFields?: boolean,        // Optional: true (default)
  versionOptions?: {
    lastModifiedBy?: string,         // Optional: "restore:user" (default)
    overwriteIfPresent?: boolean     // Optional: true (default)
  }
}
```

**Response**:

```typescript
{
  success: true,
  restored: [
    { key: "clock-display-config:mission-control", variant: "default" }
  ],
  errors?: [  // Optional: only present if some keys failed
    { key: "clock-display-config:missing", variant: "backup", error: "File not found" }
  ]
}
```

---

**3. List Available Variants**

**Endpoint**: `GET /api/save-restore/list-variants?key=clock-display-config:mission-control`

**Response**:

```typescript
{
  success: true,
  key: "clock-display-config:mission-control",
  variants: ["default", "backup-2024-10-16-14-30-45", "launch-day"]
}
```

---

#### Directory Structure Updates

```
src/
├── shared/                         # NEW: Shared between server and client
│   └── variantUtils.ts            # Variant validation/sanitization
├── server/
│   ├── redis-file-utils.ts        # NEW: File I/O utilities
│   ├── redis-loader.ts            # EXISTING: Enhanced with version injection
│   └── RedisAPI.ts                # UPDATE: Add generic save/restore endpoints
└── composables/
    └── useRedisFileSync.ts        # NEW: Frontend file sync composable
```

---

#### Implementation Checklist

- [x] Create `src/shared/variantUtils.ts` with sanitization/validation
- [x] Create `src/server/redis-file-utils.ts` with file I/O helpers
- [x] Update `src/server/RedisAPI.ts` with 3 new endpoints under `/api/save-restore/*`
- [x] Create `src/composables/useRedisFileSync.ts` frontend composable
- [x] Update `DisplayConfigsList.vue` to use the composable
- [x] Remove redundant Quick Backup feature (Oct 20, 2025)
- [ ] Test happy path (save/restore with default variant)
- [ ] Test error cases (missing keys, invalid variants, file I/O errors)

**Status (Oct 16, 2025):**

- ✅ Implemented all 5 steps of Phase 7.5
- ✅ Created shared `variantUtils.ts` with `sanitizeVariant`, `isValidVariant`
- ✅ Created `redis-file-utils.ts` with `addVersionMetadata` helper, file I/O with comprehensive error handling
- ✅ Replaced display-specific endpoints with generic `/api/save-restore/*` routes
- ✅ Created reusable `useRedisFileSync` composable
- ✅ Updated `DisplayConfigsList` with 2 buttons: Save to File, Restore from File
- ✅ API responses only return key/variant pairs (no file paths)
- Ready for testing

**Status (Oct 20, 2025):**

- ✅ Removed redundant Quick Backup feature for simplified UI
- ✅ Removed `generateBackupVariant` function from `variantUtils.ts`
- Users can manually create timestamped backups by entering variant names like "backup-2025-10-20"

---

#### Security Checklist

- [ ] Variant names sanitized on both client and server
- [ ] Path confinement to `redis-keys/` directory only
- [ ] No file paths exposed to client responses
- [ ] Atomic writes prevent partial file corruption
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

---

#### Testing Scenarios

**Happy path:**

1. Save all display configs as "default"
2. Modify configs in UI
3. Save as "backup-2025-10-20" (manual timestamped backup)
4. Restore from "default"
5. Verify configs reverted

**Error cases:**

1. Save key that doesn't exist → should skip, report in errors[]
2. Restore variant that doesn't exist → should skip, report in errors[]
3. Invalid variant name with `/` or `..` → should reject with 400
4. Disk full during save → should report error, clean up temp files
5. Malformed JSON in file → should report error during restore

---

#### Future Enhancements

1. **Variant metadata file**: Store creation date, creator, description
2. **Variant comparison**: Show diff between two variants before restoring
3. **Bulk operations**: "Save all display configs", "Restore all from variant X"
4. **Scheduled snapshots**: Auto-save to timestamped variants daily
5. **Cloud sync**: Upload variants to S3/GitHub
6. **Variant dialog component**: Better UX than prompt() with variant browser/selector

---

#### Step 7.2: Add Display Selection to Navigation

Update the top navigation or create a display selector to allow users to choose which display to show.

**Considerations**:

- Add dropdown in TopNav.vue to select active display
- Store selected display ID in localStorage
- Update route to show selected display (e.g., `/display/:id`)

---

### Phase 8: Testing & Validation

#### Step 8.1: Manual Testing Checklist

**Display Configurations List**:

- [ ] Page loads without errors
- [ ] All displays shown in table
- [ ] Search filters correctly
- [ ] Create button navigates to editor
- [ ] Edit button loads config in editor
- [ ] Duplicate creates copy
- [ ] Delete removes config (with confirmation)
- [ ] Preview opens modal with display

**Display Configuration Editor**:

- [ ] Create mode has blank form
- [ ] Edit mode loads existing config
- [ ] ID field disabled in edit mode
- [ ] Add Row button adds new row
- [ ] Add Clock button adds new clock
- [ ] Remove buttons work
- [ ] Form is reactive (updates propagate)
- [ ] Save creates new config (create mode)
- [ ] Save updates config (edit mode)
- [ ] Cancel returns to list
- [ ] Validation prevents incomplete configs

**Generic Clock Display**:

- [ ] Renders with valid config
- [ ] All clocks display
- [ ] Layout matches row configs
- [ ] Clock data updates in real-time
- [ ] Background animates
- [ ] Responsive to window size

**Data Persistence**:

- [ ] Configs save to Redis
- [ ] Configs load from Redis
- [ ] Configs persist after refresh
- [ ] Updates sync across composable

**Integration**:

- [ ] Routes work correctly
- [ ] Navigation flows smoothly
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] Linter passes

---

#### Step 8.2: Edge Cases

Test the following scenarios:

- [ ] Creating config with duplicate ID (should prevent)
- [ ] Editing non-existent config (should redirect)
- [ ] Deleting config currently being displayed
- [ ] Very long display names/descriptions
- [ ] Display with no rows
- [ ] Row with no clocks
- [ ] Invalid clock configurations
- [ ] Special characters in IDs/names
- [ ] Rapid creation/deletion
- [ ] Concurrent edits (if applicable)
- [ ] Redis connection failure

---

#### Step 8.3: Data Mapping Verification

Since `GenericClockDisplay` maps clock labels to data properties, verify:

- [ ] All clock labels map to correct data
- [ ] Missing labels handled gracefully
- [ ] Multiple clocks can use same data
- [ ] Timezone string displays correctly
- [ ] Custom labels work as expected

**Future Enhancement**: Consider adding explicit data binding field to `ClockConfig`:

```typescript
export interface ClockConfig {
  labelLeft?: string;
  labelRight?: string;
  labelTop?: string;
  size: "sm" | "md" | "lg" | "xl" | "2xl";
  format: "DDHHMMSS" | "HHMMSS" | "MMSS" | "SS";
  timeType: "date" | "timespan";
  dataBinding?: keyof ClockDataType; // NEW: Explicit data binding
}
```

---

### Phase 9: Documentation & Polish

#### Step 9.1: Add User Guide Comments

Add helpful comments and tooltips throughout the editor:

- Explain what each field does
- Provide examples of valid values
- Link to Tailwind documentation for classes
- Add visual examples/icons where helpful

#### Step 9.2: Error Handling

Ensure all error states are handled gracefully:

- [ ] Redis connection errors
- [ ] Invalid JSON data
- [ ] Missing required fields
- [ ] Network failures
- [ ] Concurrent modification conflicts

#### Step 9.3: Performance Optimization

- [ ] Debounce search input (if needed)
- [ ] Lazy load display list (if many displays)
- [ ] Optimize re-renders in editor
- [ ] Cache parsed configs

---

## Implementation Timeline Estimate

| Phase     | Tasks                            | Estimated Time  |
| --------- | -------------------------------- | --------------- |
| Phase 1   | Data Layer & State Management    | 2-3 hours       |
| Phase 2   | Display Configurations List Page | 2-3 hours       |
| Phase 3   | Generic Clock Display Component  | 2-3 hours       |
| Phase 4   | Display Configuration Editor     | 4-6 hours       |
| Phase 5   | Router Integration               | 30 minutes      |
| Phase 6   | App Initialization               | 30 minutes      |
| Phase 7   | Enhanced Features                | 2-3 hours       |
| Phase 8   | Testing & Validation             | 2-3 hours       |
| Phase 9   | Documentation & Polish           | 1-2 hours       |
| **Total** |                                  | **16-24 hours** |

---

## Success Criteria

The implementation will be considered complete when:

1. ✅ Users can create new display configurations via UI
2. ✅ Users can edit existing display configurations
3. ✅ Users can delete display configurations
4. ✅ Users can duplicate display configurations
5. ✅ Configurations persist in Redis
6. ✅ Generic display component renders any config correctly
7. ✅ Clock data updates in real-time
8. ✅ Search/filter works in list view
9. ✅ Preview modal shows accurate display
10. ✅ All forms validate input properly
11. ✅ No console errors or TypeScript errors
12. ✅ All manual tests pass
13. ✅ Default templates available for new users
14. ✅ Layout matches original AllClocks.vue visual style
15. ✅ Responsive to different screen sizes

**Future Enhancements** (not in this phase):

- Visual drag-and-drop editor
- Clock arrangement templates
- Data binding configuration UI
- Display scheduling (show different displays at different times)
- Multi-user collaboration
- Display versioning/history
- Export/import display configs
- Display groups/categories
- Role-based access control

---

## Data Flow Diagram

```
User Action (UI)
    ↓
useDisplayConfigs (Composable)
    ↓
useRedisCommand (Redis API)
    ↓
Redis Server (Data Storage)
    ↓
useRedisObserver (Real-time Updates)
    ↓
GenericClockDisplay (Renderer)
    ↓
Clock Components (Visual Output)
```

---

## Component Hierarchy

```
App.vue
  └── ConfigPage.vue
        ├── ConfigSidebar.vue
        └── DisplayConfigsList.vue
              ├── DisplayConfigEditor.vue
              │     ├── RowEditor.vue
              │     │     └── ClockEditor.vue
              │     └── DisplayPreview.vue
              │           └── GenericClockDisplay.vue
              └── DisplayPreview.vue (modal)
                    └── GenericClockDisplay.vue

Navigation Flow:
  HomePage → ConfigPage → DisplayConfigsList → DisplayConfigEditor → Save → Back to List
  DisplayConfigsList → Preview → Modal with GenericClockDisplay
```

---

## Key Design Considerations

### 1. Data Binding Strategy

The current implementation uses label-based mapping to bind clocks to data. This is simple but has limitations:

**Pros**:

- No configuration needed
- Works for standard use cases
- Easy to understand

**Cons**:

- Limited flexibility
- Fragile (changing labels breaks binding)
- Cannot bind to calculated values

**Future Enhancement**: Add explicit data binding configuration:

```typescript
{
  dataBinding: {
    type: "property", // or "expression"
    source: "clockData.utc", // or "clockData.t + clockData.met"
  }
}
```

### 2. Layout System

The current system uses Tailwind Flexbox classes for layout. This is flexible but requires CSS knowledge.

**Pros**:

- Very flexible
- Uses existing Tailwind system
- No custom layout engine needed

**Cons**:

- Requires CSS knowledge
- Easy to make mistakes
- Limited validation

**Future Enhancement**: Add visual layout builder with drag-and-drop.

### 3. Validation Strategy

Implement validation at multiple levels:

1. **Client-side** (immediate feedback)

   - Required fields
   - Format validation
   - Duplicate ID check

2. **Pre-save** (before Redis write)

   - Complete config structure
   - Valid JSON
   - Valid Tailwind classes (optional)

3. **Runtime** (when rendering)
   - Graceful fallbacks
   - Error boundaries
   - Default values

### 4. Scalability

Current design works well for 5-20 display configs. For larger scale:

- Implement pagination in list view
- Add virtualized rendering for large configs
- Consider config compression in Redis
- Add search/filter by category or tags

---

## Potential Challenges & Solutions

### Challenge 1: Clock Data Mapping

**Problem**: How do clocks know which data property to display?

**Solution**: Use label-based mapping initially, add explicit binding later.

### Challenge 2: Real-time Updates

**Problem**: Multiple components need access to same clock data.

**Solution**: Use existing `useRedisObserver` pattern - it's already reactive.

### Challenge 3: Complex Layouts

**Problem**: Users might want very custom layouts.

**Solution**:

1. Provide good templates
2. Support custom CSS classes
3. Future: add visual layout editor

### Challenge 4: Config Validation

**Problem**: Users might create invalid configs.

**Solution**:

1. Client-side validation
2. Preview before save
3. Graceful error handling in renderer
4. Default values for missing properties

### Challenge 5: Migration from Hard-coded

**Problem**: Existing displays are hard-coded.

**Solution**:

1. Create equivalent configs for existing displays
2. Seed as defaults
3. Gradually deprecate hard-coded versions
4. Provide migration tool/script

---

## Migration Plan

To transition from hard-coded displays like `AllClocks.vue`:

1. **Create equivalent config** for each existing display
2. **Test GenericClockDisplay** renders identically
3. **Update routes** to use GenericClockDisplay
4. **Keep hard-coded versions** temporarily as fallback
5. **Deprecate hard-coded** after testing period
6. **Remove old components** once confident

**Timeline**: 1-2 weeks of parallel running before full switch.

---

## Security Considerations

### Redis Access

- Validate all inputs before Redis commands
- Sanitize user-provided strings
- Limit config size (prevent DoS)
- Rate limit save operations

### XSS Prevention

- Sanitize display names/descriptions
- Validate CSS class strings
- Escape user input in templates

### Access Control

- Consider adding user authentication
- Role-based permissions for edit/delete
- Audit log for config changes

---

## Accessibility Considerations

### Keyboard Navigation

- All buttons accessible via keyboard
- Logical tab order in forms
- Focus management in modals

### Screen Readers

- Proper ARIA labels
- Semantic HTML structure
- Announce state changes

### Visual Design

- Sufficient color contrast
- Clear visual hierarchy
- Consistent spacing

---

## Extensibility: Adding New Display Types

The system is designed to easily accommodate new display types beyond clocks (maps, charts, 3D simulations, etc.).

### Architecture Overview

The current implementation uses:

1. **BaseDisplayConfig**: Common fields for all displays
2. **Type Discriminator**: `type` field identifies specific display type
3. **Specific Configs**: Each display type extends the base with its own needs
4. **Versioned Wrapper**: Generic versioning works for any display type

### How to Add a New Display Type

**Example: Adding a Map Display**

#### Step 1: Define the Type

```typescript
// In src/types/MapDisplayConfig.ts
import { BaseDisplayConfig } from "./ClockDisplayConfig";
import { Versioned } from "./Versioned";

export interface MapDisplayConfig extends BaseDisplayConfig {
  type: "map"; // Discriminator
  center: [number, number]; // Lat/Lng
  zoom: number;
  markers?: {
    position: [number, number];
    label: string;
  }[];
}

export type VersionedMapDisplayConfig = Versioned<MapDisplayConfig>;
```

#### Step 2: Update Union Type

```typescript
// In src/types/ClockDisplayConfig.ts
export type DisplayConfig = ClockDisplayConfig | MapDisplayConfig; // Add new type
```

#### Step 3: Create Composable (if needed)

```typescript
// Reuse useDisplayConfigs - it's already generic!
// Or create useMapDisplayConfigs if you need map-specific logic
```

#### Step 4: Create Renderer Component

```vue
<!-- src/components/Pages/Displays/MapDisplayRenderer.vue -->
<script setup lang="ts">
import { PropType } from "vue";
import { MapDisplayConfig } from "@/types/MapDisplayConfig";

const props = defineProps({
  config: {
    type: Object as PropType<MapDisplayConfig>,
    required: true,
  },
});
</script>

<template>
  <div class="w-screen h-screen">
    <!-- Your map component here -->
    <MapComponent :center="config.center" :zoom="config.zoom" />
  </div>
</template>
```

#### Step 5: Create Editor (if needed)

```vue
<!-- src/components/Pages/ConfigPage/views/displays/MapDisplayEditor.vue -->
<!-- Simple form for map-specific config -->
```

#### Step 6: Update Generic Display Router

```vue
<!-- GenericDisplayRouter.vue - dispatch to specific renderer -->
<template>
  <ClockLayoutRenderer v-if="config.type === 'clock-layout'" :config="config" />
  <MapDisplayRenderer v-else-if="config.type === 'map'" :config="config" />
  <div v-else>Unknown display type</div>
</template>
```

### Key Points

✅ **No need to match clock complexity**: Maps don't need rows/widgets like clocks  
✅ **Reuse infrastructure**: Versioning, locking, CRUD operations work automatically  
✅ **Type-safe**: TypeScript discriminated unions give you full type safety  
✅ **Independent editors**: Each display type gets its own appropriate editor  
✅ **Simple configs**: Some displays just need a few fields (e.g., map center/zoom)

### What's Already Generic

- ✅ **Versioning system**: `Versioned<T>` works for any display type
- ✅ **Locking system**: Works at display level regardless of type
- ✅ **CRUD operations**: Redis storage works for any JSON structure
- ✅ **List page**: Already displays any type from the union
- ✅ **Session management**: Type-agnostic

### What's Display-Specific

- ⚠️ **Renderer component**: Each type needs its own (e.g., `ClockLayoutRenderer.vue`)
- ⚠️ **Editor component**: Each type needs its own form (e.g., `ClockDisplayEditor.vue`)
- ⚠️ **Config structure**: Each type defines its own fields (e.g., `rows` for clocks, `center` for maps)

---

## Future Roadmap

### Version 1.1 (Short-term)

- Visual drag-and-drop layout editor (for clocks)
- Display templates/presets
- Config export/import
- Display categories/tags

### Version 1.2 (Medium-term)

- Additional display types (maps, charts, tables)
- Explicit data binding configuration
- Calculated/derived values
- Conditional display logic
- Animation configuration

### Version 1.3 (Long-term)

- Multi-user collaboration
- Version history
- Display scheduling
- Advanced theming
- 3D simulations and custom displays

---

## Getting Started

To begin implementation:

1. **Review this plan thoroughly**
2. **Set up a feature branch**: `git checkout -b feature/display-config-system`
3. **Start with Phase 1** (Data Layer)
4. **Work through phases sequentially**
5. **Test each phase before moving on**
6. **Commit frequently** with descriptive messages
7. **Update checklist** as you complete items

**Recommended Order**:

1. Data layer (foundation)
2. Generic display component (test rendering)
3. List page (basic CRUD)
4. Editor (most complex)
5. Polish and testing

---

## Questions to Consider

Before starting, consider these questions:

1. Should display configs be user-specific or global?
2. How should we handle display selection in production?
3. Should there be a "default" display that loads automatically?
4. Do we need config versioning/rollback?
5. Should configs be shareable between users?
6. Do we need config validation schema?
7. Should we support config inheritance/templates?

---

## Concurrent Editing System Summary

### How It Works

The implemented system provides **hybrid optimistic locking** that balances collaboration with data protection:

#### 1. **Session Identification (Pre-Auth)**

- Each browser tab gets a unique session ID stored in `sessionStorage`
- Users can optionally set a display name (stored in `localStorage`)
- When auth is added, session ID is replaced with actual user ID

#### 2. **Soft Locks (Awareness Layer)**

- Opening the editor acquires a "soft lock" in Redis
- Lock expires after 5 minutes, refreshed every minute while editing
- Other users see: _"User X is currently editing"_
- Doesn't prevent editing, just provides awareness

#### 3. **Version Tracking (Protection Layer)**

- Each config stores: `lastModifiedAt` (timestamp), `lastModifiedBy`
- On save, system checks if `lastModifiedAt` has changed
- If changed → show conflict resolution UI
- If unchanged → save proceeds

#### 4. **Conflict Resolution**

- User sees who made conflicting changes and when
- Shows simple diff of what changed
- Options: **Overwrite** or **Cancel**
- Future: Add merge/side-by-side comparison

### Why This Approach?

| Feature                      | Pessimistic Lock | Optimistic Lock | Our Hybrid   |
| ---------------------------- | ---------------- | --------------- | ------------ |
| Prevents conflicts           | ✅               | ❌              | ⚠️ Detects   |
| No stuck locks               | ❌               | ✅              | ✅           |
| User awareness               | ⚠️ Blocked       | ❌              | ✅ Soft lock |
| Data loss prevention         | ✅               | ⚠️ Manual       | ✅ Automatic |
| Collaborative                | ❌               | ✅              | ✅           |
| Works without auth           | ❌               | ✅              | ✅           |
| Mission-critical safe        | ✅               | ⚠️ Depends      | ✅           |
| Simple to implement          | ✅               | ✅              | ⚠️ Moderate  |
| **Best for your use case →** |                  |                 | **✅**       |

### Migration Path to Full Auth

When you add authentication, the transition is seamless:

#### Step 1: Add Auth System

- Implement login/logout
- Store user info in session/token
- Add user management

#### Step 2: Update Session Management

```typescript
// Before (pre-auth):
sessionId: "session-12345-abc";
userName: "Anonymous User"; // or localStorage name

// After (with auth):
sessionId: user.id; // from auth system
userName: user.fullName; // from auth system
```

#### Step 3: Enhanced Features

- Lock takeover requests (ask user to release lock)
- Lock history (see who locked what when)
- Forced lock release (admin only)
- User presence indicators (green dot = online)
- Lock notifications (push/email when someone locks your edit)

### Testing Concurrent Editing

To test the system with multiple "users":

1. **Open two browser tabs** (different sessions)
2. **Set different display names** in each tab
3. **Open same config for editing** in both tabs
4. **Tab 1**: Make changes, don't save yet
5. **Tab 2**: See "User 1 is editing" warning
6. **Tab 2**: Make different changes, save first
7. **Tab 1**: Try to save → see conflict modal
8. **Tab 1**: Choose overwrite or cancel

### Redis Keys Used

```
clock-display-config:list                  → Set of all display IDs
clock-display-config:{id}                  → Full config JSON
clock-display-config:lock:{id}             → Lock info { sessionId, userName, expires }
```

**Note**: Locks auto-expire via Redis TTL (EX 300 = 5 minutes)

### Performance Considerations

- **Lock refresh**: 1 API call per minute per open editor
- **Conflict check**: 1 API call per save
- **Lock check**: 1 API call on editor open
- **Impact**: Negligible for < 100 concurrent users

For high-scale (100+ concurrent editors), consider:

- WebSocket-based lock updates (push instead of poll)
- Lock pooling (batch multiple lock refreshes)
- Distributed lock manager (Redis Cluster)

---

## Comparison: Your Team's System vs. This Design

You mentioned your team uses explicit locks in another app. Here's how this compares:

### Your Team's System (Pessimistic)

```
User clicks "Edit" → Takes exclusive lock
Others blocked from editing
Lock released on Save/Cancel
Problem: Locks get stuck if user closes tab
```

### This System (Hybrid)

```
User clicks "Edit" → Takes soft lock (auto-expires)
Others see warning but can still edit
Conflict detected on save → Manual resolution
Benefit: No stuck locks, better collaboration
```

### Best of Both Worlds?

You could offer **both modes** with a toggle:

```vue
<template>
  <div class="flex items-center gap-2">
    <Label>Lock Mode:</Label>
    <Switch v-model="strictLocking" />
    <span>{{ strictLocking ? "Strict" : "Collaborative" }}</span>
  </div>
</template>
```

- **Strict mode**: Block others from editing (old system)
- **Collaborative mode**: Allow with conflict detection (new system)

Store preference per-user or per-config type.

---

_Document created: October 10, 2025_  
_Last updated: October 10, 2025 (Added concurrent editing system)_  
_Author: AI Assistant_
