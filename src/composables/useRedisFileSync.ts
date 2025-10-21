import { ref } from "vue";
import { useToaster } from "./useToaster";
import { sanitizeVariant, isValidVariant } from "@/shared/variantUtils";
import { getApiUrl } from "@/utils/apiUtils";
import { API_CONFIG } from "@/config/constants";
import { logError, createUserErrorMessage } from "@/utils/errorUtils";

const API_BASE = getApiUrl(API_CONFIG.ENDPOINTS.SAVE_RESTORE.BASE);

export function useRedisFileSync() {
  const { emitToast } = useToaster();
  const isSaving = ref(false);
  const isRestoring = ref(false);

  async function saveKeysToFiles(
    keys: string[],
    variant: string = "default",
    stripVersionFields: boolean = true,
    deleteOrphans: boolean = true
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
        body: JSON.stringify({ keys, variant, stripVersionFields, deleteOrphans }),
      });

      const result = await response.json();
      if (result.success) {
        const savedCount = result.saved.length;
        const deletedCount = result.deleted?.length || 0;

        let message = `Saved ${savedCount} key${savedCount !== 1 ? "s" : ""} as variant '${variant}'`;
        if (deletedCount > 0) {
          message += ` (deleted ${deletedCount} orphaned file${deletedCount !== 1 ? "s" : ""})`;
        }

        emitToast({
          title: message,
          type: "success",
          deliverTo: "all",
        });

        if (result.errors) {
          console.warn("Some keys failed to save:", result.errors);
        }
        if (result.deleted && result.deleted.length > 0) {
          console.log("Deleted orphaned files for keys:", result.deleted);
        }
        return true;
      } else {
        const errorMsg = createUserErrorMessage("save to variant", variant);
        emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
        return false;
      }
    } catch (e) {
      logError("useRedisFileSync", "save keys to files", e, { variant, keyCount: keys.length });
      const errorMsg = createUserErrorMessage("save to variant", variant, e);
      emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function restoreKeysFromFiles(
    keys: string[],
    variant: string = "default",
    addVersionFields: boolean = true,
    deleteExisting: boolean = true
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
          deleteExisting,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const restoredCount = result.restored.length;
        const deletedCount = result.deleted?.length || 0;

        let message = `Restored ${restoredCount} key${restoredCount !== 1 ? "s" : ""} from variant '${variant}'`;
        if (deletedCount > 0) {
          message += ` (deleted ${deletedCount} existing key${deletedCount !== 1 ? "s" : ""})`;
        }

        emitToast({
          title: message,
          type: "success",
          deliverTo: "all",
        });

        if (result.errors) {
          console.warn("Some keys failed to restore:", result.errors);
        }
        if (result.deleted && result.deleted.length > 0) {
          console.log("Deleted existing keys:", result.deleted);
        }
        return true;
      } else {
        const errorMsg = createUserErrorMessage("restore from variant", variant);
        emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
        return false;
      }
    } catch (e) {
      logError("useRedisFileSync", "restore keys from files", e, { variant, keyCount: keys.length });
      const errorMsg = createUserErrorMessage("restore from variant", variant, e);
      emitToast({ ...errorMsg, type: "error", deliverTo: "all" });
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
      logError("useRedisFileSync", "list variants for key", e, { key });
      return [];
    }
  }

  async function listKeysForVariant(variant: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/list-keys?variant=${encodeURIComponent(variant)}`);
      const result = await response.json();
      return result.keys || [];
    } catch (e) {
      logError("useRedisFileSync", "list keys for variant", e, { variant });
      return [];
    }
  }

  async function listAllVariants(keyPattern?: RegExp): Promise<string[]> {
    try {
      const url = keyPattern
        ? `${API_BASE}/list-all-variants?pattern=${encodeURIComponent(keyPattern.source)}`
        : `${API_BASE}/list-all-variants`;
      const response = await fetch(url);
      const result = await response.json();
      return result.variants || [];
    } catch (e) {
      logError("useRedisFileSync", "list all variants", e, {
        pattern: keyPattern?.source,
      });
      return [];
    }
  }

  return {
    isSaving,
    isRestoring,
    saveKeysToFiles,
    restoreKeysFromFiles,
    listVariantsForKey,
    listKeysForVariant,
    listAllVariants,
    sanitizeVariant,
    isValidVariant,
  };
}
