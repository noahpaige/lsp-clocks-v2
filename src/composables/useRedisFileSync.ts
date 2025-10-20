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
