import { ref } from "vue";
import { useToaster } from "./useToaster";
import { sanitizeVariant, isValidVariant } from "@/shared/variantUtils";

const API_BASE = "http://localhost:3000/api/save-restore";

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

  async function listKeysForVariant(variant: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/list-keys?variant=${encodeURIComponent(variant)}`);
      const result = await response.json();
      return result.keys || [];
    } catch (e) {
      console.error(e);
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
    listKeysForVariant,
    listAllVariants,
    sanitizeVariant,
    isValidVariant,
  };
}
