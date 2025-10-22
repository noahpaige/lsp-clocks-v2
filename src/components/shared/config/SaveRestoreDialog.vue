<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-vue-next";
import VariantNameInput from "@/components/shared/VariantNameInput.vue";
import { useRedisFileSync } from "@/composables/useRedisFileSync";
import { useToaster } from "@/composables/useToaster";

/**
 * SaveRestoreDialog
 *
 * Generic dialog for saving and restoring Redis data with variant management.
 *
 * Usage:
 * <SaveRestoreDialog
 *   v-model:open="showSaveDialog"
 *   mode="save"
 *   :file-pattern="REDIS_CONFIG.KEYS.DISPLAY_CONFIG.FILE_PATTERN"
 *   :is-processing="isSaving"
 *   @save="handleSave"
 * />
 */

interface Props {
  open: boolean;
  mode: "save" | "restore";

  // Text customization
  title?: string;
  description?: string;
  saveDescription?: string;
  restoreDescription?: string;
  noVariantsMessage?: string;

  // Button text
  confirmText?: string;
  cancelText?: string;

  // State
  isProcessing?: boolean;

  // For getting available variants
  filePattern: RegExp;
}

const props = withDefaults(defineProps<Props>(), {
  cancelText: "Cancel",
  isProcessing: false,
  noVariantsMessage: "No saved variants found. Save a configuration first to enable restore functionality.",
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  save: [variant: string];
  restore: [variant: string];
  cancel: [];
}>();

const { listAllVariants } = useRedisFileSync();
const { emitToast } = useToaster();

// Internal state
const variantName = ref("default");
const availableVariants = ref<string[]>([]);
const showCustomInput = ref(false);
const customVariantName = ref("");
const variantInputRef = ref<InstanceType<typeof VariantNameInput> | null>(null);

// Computed properties
const finalVariantName = computed(() => (showCustomInput.value ? customVariantName.value : variantName.value));

const hasDefaultVariant = computed(() => availableVariants.value.includes("default"));

const hasAnyVariants = computed(() => availableVariants.value.length > 0);

const isValidVariant = computed(() => {
  const variant = finalVariantName.value;
  if (!variant) return false;
  if (showCustomInput.value && !variantInputRef.value?.isValid) return false;
  return true;
});

const computedDescription = computed(() => {
  if (props.mode === "save") {
    return props.saveDescription || props.description || "Enter a variant name to save the configurations.";
  } else {
    if (!hasAnyVariants.value) return props.noVariantsMessage;
    return props.restoreDescription || props.description || "Enter the variant name to restore configurations from.";
  }
});

const computedTitle = computed(() => {
  if (props.title) return props.title;
  return props.mode === "save" ? "Save to File" : "Restore from File";
});

const computedConfirmText = computed(() => {
  if (props.confirmText) return props.confirmText;
  return props.mode === "save" ? "Save" : "Restore";
});

// Load variants when dialog opens
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;

    availableVariants.value = await listAllVariants(props.filePattern);

    if (props.mode === "restore" && availableVariants.value.length === 0) {
      emitToast({
        title: props.noVariantsMessage,
        type: "warning",
        deliverTo: "all",
      });
      emit("update:open", false);
      return;
    }

    // Initialize variant selection
    if (availableVariants.value.length === 0) {
      // No variants - start with custom input
      showCustomInput.value = true;
      customVariantName.value = "";
      variantName.value = "";
    } else {
      // Has variants - select default or first
      variantName.value = hasDefaultVariant.value ? "default" : availableVariants.value[0];
      showCustomInput.value = false;
      customVariantName.value = "";
    }
  }
);

function handleVariantChange(value: string) {
  if (value === "__custom__") {
    showCustomInput.value = true;
    customVariantName.value = "";
  } else {
    showCustomInput.value = false;
    variantName.value = value;
  }
}

function handleConfirm() {
  if (!isValidVariant.value) return;

  const variant = finalVariantName.value;
  if (props.mode === "save") {
    emit("save", variant);
  } else {
    emit("restore", variant);
  }
}

function handleCancel() {
  emit("cancel");
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ computedTitle }}</DialogTitle>
        <DialogDescription>
          {{ computedDescription }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 pt-4 pb-6 max-w-60">
        <!-- Variant Selection -->
        <div class="space-y-2">
          <!-- Dropdown (shown if variants exist or in save mode) -->
          <Select
            v-if="hasAnyVariants || mode === 'save'"
            :model-value="showCustomInput ? '__custom__' : variantName"
            @update:model-value="handleVariantChange"
            class="max-w-48"
          >
            <SelectTrigger>
              <SelectValue :placeholder="hasDefaultVariant ? 'Default Variant' : 'Select variant...'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="variant in availableVariants" :key="variant" :value="variant">
                {{ variant }}
              </SelectItem>
              <SelectItem v-if="mode === 'save'" value="__custom__"> + New variant... </SelectItem>
            </SelectContent>
          </Select>

          <!-- No variants message (restore mode only) -->
          <div v-else-if="mode === 'restore'" class="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
            {{ noVariantsMessage }}
          </div>
        </div>

        <!-- Custom variant input -->
        <div v-if="showCustomInput" class="space-y-2">
          <Label>New Variant Name</Label>
          <VariantNameInput
            v-model="customVariantName"
            ref="variantInputRef"
            :existing-variants="availableVariants"
            mode="create"
            @keydown.enter="handleConfirm"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel" :disabled="isProcessing">
          {{ cancelText }}
        </Button>
        <Button
          v-if="mode === 'save' || hasAnyVariants"
          @click="handleConfirm"
          :disabled="!isValidVariant || isProcessing"
        >
          <Loader2 v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
          {{ isProcessing ? "Processing..." : computedConfirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
