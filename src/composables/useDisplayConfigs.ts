import { ref, readonly, computed } from "vue";
import { useRedisCommand } from "./useRedisCommand";
import { useToaster } from "./useToaster";
import {
  parseClockDisplayConfig,
  parseVersionedClockDisplayConfig,
  type ClockDisplayConfig,
  type VersionedClockDisplayConfig,
} from "@/types/ClockDisplayConfig";
import { withVersion, updateVersion } from "@/types/Versioned";
import { useSessionId } from "./useSessionId";
import { getDisplayConfigKey, getDisplayConfigListKey } from "@/utils/redisKeyUtils";
import { logError, createUserErrorMessage } from "@/utils/errorUtils";

// Local reactive state for all display configurations
const displayConfigs = ref<ClockDisplayConfig[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useDisplayConfigs() {
  const { sendInstantCommand } = useRedisCommand();
  const { emitToast } = useToaster();
  const { sessionId } = useSessionId();

  // Redis key helpers
  const DISPLAY_LIST_KEY = getDisplayConfigListKey();
  const getDisplayKey = getDisplayConfigKey;

  async function loadDisplayConfigs() {
    isLoading.value = true;
    error.value = null;
    try {
      // Fetch the set of IDs
      const idsResp = await sendInstantCommand("SMEMBERS", DISPLAY_LIST_KEY);
      const ids = (idsResp?.data ?? []) as string[];

      if (!Array.isArray(ids) || ids.length === 0) {
        displayConfigs.value = [];
        return;
      }

      const loaded: ClockDisplayConfig[] = [];
      for (const id of ids) {
        const getResp = await sendInstantCommand("GET", getDisplayKey(id));
        const raw = getResp?.data;
        if (typeof raw === "string" && raw.length > 0) {
          try {
            const parsed = JSON.parse(raw);
            loaded.push(parseClockDisplayConfig(parsed));
          } catch (e) {
            // skip malformed entries, but continue loading others
            console.warn(`Invalid JSON for display: ${id}`, e);
          }
        }
      }

      displayConfigs.value = loaded;
    } catch (e) {
      logError("useDisplayConfigs", "load display configurations", e);
      error.value = "Failed to load display configurations";
      const errorMsg = createUserErrorMessage("load display configurations", undefined, e);
      emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
    } finally {
      isLoading.value = false;
    }
  }

  function getDisplayConfig(id: string): ClockDisplayConfig | undefined {
    return displayConfigs.value.find((c) => c.id === id);
  }

  async function getVersionedDisplayConfig(id: string): Promise<VersionedClockDisplayConfig | undefined> {
    try {
      const resp = await sendInstantCommand("GET", getDisplayKey(id));
      const raw = resp?.data;
      if (!raw || typeof raw !== "string") return undefined;
      return parseVersionedClockDisplayConfig(JSON.parse(raw));
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  async function createDisplayConfig(config: ClockDisplayConfig): Promise<boolean> {
    try {
      if (!config?.id?.trim()) {
        emitToast({ title: "Display ID is required", type: "error", deliverTo: "all" });
        return false;
      }

      if (displayConfigs.value.some((c) => c.id === config.id)) {
        emitToast({ title: "A display with this ID already exists", type: "error", deliverTo: "all" });
        return false;
      }

      const versioned = withVersion(config, sessionId.value);
      const json = JSON.stringify(versioned);
      await sendInstantCommand("SET", getDisplayKey(config.id), [json]);
      await sendInstantCommand("SADD", DISPLAY_LIST_KEY, [config.id]);

      displayConfigs.value.push(config);
      emitToast({ title: `Display "${config.name}" created`, type: "success", deliverTo: "all" });
      return true;
    } catch (e) {
      logError("useDisplayConfigs", "create display configuration", e, { configId: config.id });
      const errorMsg = createUserErrorMessage("create display configuration", config.id, e);
      emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
      return false;
    }
  }

  async function updateDisplayConfig(config: ClockDisplayConfig): Promise<boolean> {
    try {
      if (!config?.id?.trim()) {
        emitToast({ title: "Display ID is required", type: "error", deliverTo: "all" });
        return false;
      }

      const versioned = updateVersion(config, sessionId.value);
      const json = JSON.stringify(versioned);
      await sendInstantCommand("SET", getDisplayKey(config.id), [json]);

      const idx = displayConfigs.value.findIndex((c) => c.id === config.id);
      if (idx !== -1) displayConfigs.value[idx] = config;

      emitToast({ title: `Display "${config.name}" updated`, type: "success", deliverTo: "all" });
      return true;
    } catch (e) {
      logError("useDisplayConfigs", "update display configuration", e, { configId: config.id });
      const errorMsg = createUserErrorMessage("update display configuration", config.id, e);
      emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
      return false;
    }
  }

  async function updateDisplayConfigWithVersion(
    config: ClockDisplayConfig,
    originalLastModifiedAt: number
  ): Promise<{ success: boolean; conflict?: boolean; currentConfig?: VersionedClockDisplayConfig }> {
    try {
      const resp = await sendInstantCommand("GET", getDisplayKey(config.id));
      const raw = resp?.data;
      if (raw && typeof raw === "string") {
        const current = parseVersionedClockDisplayConfig(JSON.parse(raw));
        if ((current.lastModifiedAt ?? 0) !== (originalLastModifiedAt ?? 0)) {
          return { success: false, conflict: true, currentConfig: current };
        }
      }

      const versioned = updateVersion(config, sessionId.value);
      const json = JSON.stringify(versioned);
      await sendInstantCommand("SET", getDisplayKey(config.id), [json]);

      const idx = displayConfigs.value.findIndex((c) => c.id === config.id);
      if (idx !== -1) displayConfigs.value[idx] = config;

      emitToast({ title: `Display "${config.name}" updated`, type: "success", deliverTo: "all" });
      return { success: true };
    } catch (e) {
      logError("useDisplayConfigs", "update display configuration with version", e, {
        configId: config.id,
        originalLastModifiedAt,
      });
      const errorMsg = createUserErrorMessage("update display configuration", config.id, e);
      emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
      return { success: false };
    }
  }

  async function deleteDisplayConfig(id: string): Promise<boolean> {
    try {
      await sendInstantCommand("DEL", getDisplayKey(id));
      await sendInstantCommand("SREM", DISPLAY_LIST_KEY, [id]);

      displayConfigs.value = displayConfigs.value.filter((c) => c.id !== id);
      emitToast({ title: "Display configuration deleted", type: "success", deliverTo: "all" });
      return true;
    } catch (e) {
      logError("useDisplayConfigs", "delete display configuration", e, { configId: id });
      const errorMsg = createUserErrorMessage("delete display configuration", id, e);
      emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
      return false;
    }
  }

  async function duplicateDisplayConfig(id: string): Promise<boolean> {
    const original = getDisplayConfig(id);
    if (!original) return false;

    // Strip any existing "-copy-<digits>" from id to avoid copy chains
    const baseId = original.id.replace(/-copy-\d+$/, "");
    const duplicate: ClockDisplayConfig = {
      ...original,
      id: `${baseId}-copy-${Date.now()}`,
      name: original.name.endsWith(" (Copy)") ? original.name : `${original.name} (Copy)`,
    };

    return createDisplayConfig(duplicate);
  }

  return {
    displayConfigs: readonly(displayConfigs),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadDisplayConfigs,
    getDisplayConfig,
    getVersionedDisplayConfig,
    createDisplayConfig,
    updateDisplayConfig,
    updateDisplayConfigWithVersion,
    deleteDisplayConfig,
    duplicateDisplayConfig,
  };
}
