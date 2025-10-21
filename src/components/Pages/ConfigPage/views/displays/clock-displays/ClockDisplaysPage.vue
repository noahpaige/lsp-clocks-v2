<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Copy, Trash2, Eye, Save, Upload, Loader2 } from "lucide-vue-next";
import DisplayPreview from "./ClockDisplayPreview.vue";
import LockWidget from "@/components/shared/LockWidget.vue";
import VariantNameInput from "@/components/shared/VariantNameInput.vue";
import { useRedisFileSync } from "@/composables/useRedisFileSync";
import { useToaster } from "@/composables/useToaster";
import { REDIS_CONFIG } from "@/config/constants";
import { getDisplayConfigKey } from "@/utils/redisKeyUtils";

const router = useRouter();
const { displayConfigs, isLoading, loadDisplayConfigs, deleteDisplayConfig, duplicateDisplayConfig } =
  useDisplayConfigs();
const {
  isSaving,
  isRestoring,
  saveKeysToFiles,
  restoreKeysFromFiles,
  listVariantsForKey,
  listKeysForVariant,
  listAllVariants,
} = useRedisFileSync();
const { emitToast } = useToaster();

const searchQuery = ref("");
const showPreview = ref(false);
const previewConfigId = ref<string | null>(null);

// Dialog state
const showVariantDialog = ref(false);
const dialogMode = ref<"save" | "restore">("save");
const variantName = ref("default");
const availableVariants = ref<string[]>([]);
const showCustomInput = ref(false);
const customVariantName = ref("");
const variantInputRef = ref<InstanceType<typeof VariantNameInput> | null>(null);

// Delete confirmation dialog state
const showDeleteDialog = ref(false);
const deleteConfigId = ref<string | null>(null);
const deleteConfigName = ref<string>("");

const filteredConfigs = computed(() => {
  if (!searchQuery.value) return displayConfigs.value;
  const q = searchQuery.value.toLowerCase();
  return displayConfigs.value.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.id || "").toLowerCase().includes(q)
  );
});

const finalVariantName = computed(() => {
  if (showCustomInput.value) {
    return customVariantName.value;
  }
  return variantName.value;
});

// Check if default variant exists
const hasDefaultVariant = computed(() => {
  return availableVariants.value.includes("default");
});

// Check if any variants exist
const hasAnyVariants = computed(() => {
  return availableVariants.value.length > 0;
});

onMounted(() => {
  loadDisplayConfigs();
});

function createNew() {
  router.push("/config/clock-displays/create");
}

function editConfig(id: string) {
  router.push(`/config/clock-displays/${id}/edit`);
}

async function duplicateConfig(id: string) {
  await duplicateDisplayConfig(id);
}

function openDeleteDialog(id: string, name: string) {
  deleteConfigId.value = id;
  deleteConfigName.value = name;
  showDeleteDialog.value = true;
}

async function confirmDelete() {
  if (!deleteConfigId.value) return;

  await deleteDisplayConfig(deleteConfigId.value);
  showDeleteDialog.value = false;
  deleteConfigId.value = null;
  deleteConfigName.value = "";
}

function previewConfig(id: string) {
  previewConfigId.value = id;
  showPreview.value = true;
}

function getTotalClocks(config: any) {
  return config.rows?.reduce((total: number, row: any) => total + (row.clocks?.length || 0), 0) ?? 0;
}

async function openSaveDialog() {
  dialogMode.value = "save";

  // Get variants only for display configurations
  availableVariants.value = await listAllVariants(REDIS_CONFIG.KEYS.DISPLAY_CONFIG.FILE_PATTERN);

  // If no variants exist, start with custom input
  if (availableVariants.value.length === 0) {
    showCustomInput.value = true;
    customVariantName.value = "";
    variantName.value = "";
  } else {
    variantName.value = "default";
    showCustomInput.value = false;
    customVariantName.value = "";
  }

  showVariantDialog.value = true;
}

async function openRestoreDialog() {
  dialogMode.value = "restore";

  // Get variants only for display configurations
  availableVariants.value = await listAllVariants(REDIS_CONFIG.KEYS.DISPLAY_CONFIG.FILE_PATTERN);

  // If no variants exist, disable restore functionality
  if (availableVariants.value.length === 0) {
    emitToast({
      title: "No saved variants found. Save a configuration first.",
      type: "warning",
      deliverTo: "all",
    });
    return;
  }

  // If default variant exists, use it; otherwise use first available variant
  if (availableVariants.value.includes("default")) {
    variantName.value = "default";
  } else {
    variantName.value = availableVariants.value[0];
  }

  showCustomInput.value = false;
  customVariantName.value = "";

  showVariantDialog.value = true;
}

function handleVariantChange(value: string) {
  if (value === "__custom__") {
    showCustomInput.value = true;
    customVariantName.value = "";
  } else {
    showCustomInput.value = false;
    variantName.value = value;
  }
}

async function confirmVariantAction() {
  const variant = finalVariantName.value;
  if (!variant) return;

  // Check validation if using custom input
  if (showCustomInput.value && !variantInputRef.value?.isValid) {
    return; // Prevent save if validation fails
  }

  if (dialogMode.value === "save") {
    // For save: use current display configs
    const allKeys = displayConfigs.value.map((c) => getDisplayConfigKey(c.id));
    await saveKeysToFiles(allKeys, variant, true);
  } else {
    // For restore: get ALL keys that exist for this variant
    const allKeys = await listKeysForVariant(variant);
    const success = await restoreKeysFromFiles(allKeys, variant, true);
    if (success) {
      await loadDisplayConfigs();
    }
  }

  showVariantDialog.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-2">
      <div class="relative max-w-60">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search displays..." class="pl-10" />
      </div>
      <div class="flex gap-4">
        <Button @click="createNew">
          <Plus class="mr-2 h-4 w-4" />
          Create Display
        </Button>
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="openSaveDialog" variant="outline" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                <Save v-else class="mr-2 h-4 w-4" />
                {{ isSaving ? "Saving..." : "Save" }}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save to JSON file</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="openRestoreDialog" variant="outline" :disabled="isRestoring">
                <Loader2 v-if="isRestoring" class="mr-2 h-4 w-4 animate-spin" />
                <Upload v-else class="mr-2 h-4 w-4" />
                {{ isRestoring ? "Restoring..." : "Restore" }}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restore from JSON file</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </div>
    </div>

    <Card>
      <CardContent class="p-0">
        <!-- Loading skeletons -->

        <!-- Empty state -->
        <div v-if="filteredConfigs.length === 0" class="text-center py-8 text-muted-foreground">
          <p>No display configurations found.</p>
          <Button @click="createNew" variant="link" class="mt-2">Create your first display</Button>
        </div>

        <!-- Table content -->
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Clocks</TableHead>
              <TableHead class="flex items-center justify-end">
                <span class="text-right flex-1">Actions</span>
                <div class="flex-0 w-40"></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading" v-for="i in 3" :key="i">
              <TableCell class="flex-1 space-y-2">
                <Skeleton class="h-5 w-32" />
                <Skeleton class="h-4 w-20"
              /></TableCell>
              <TableCell><Skeleton class="h-6 w-30" /></TableCell>
              <TableCell><Skeleton class="h-6 w-8" /></TableCell>
              <TableCell><Skeleton class="h-9 w-8" /></TableCell>
              <TableCell><Skeleton class="h-9 w-40 r-0" /></TableCell>
            </TableRow>
            <TableRow v-else v-for="config in filteredConfigs" :key="config.id">
              <TableCell class="font-medium">
                {{ config.name }}
                <div class="text-xs text-muted-foreground">{{ config.id }}</div>
              </TableCell>
              <TableCell class="max-w-md truncate">{{ config.description || "—" }}</TableCell>
              <TableCell
                ><Badge variant="secondary">{{ config.rows?.length || 0 }}</Badge></TableCell
              >
              <TableCell
                ><Badge variant="secondary">{{ getTotalClocks(config) }}</Badge></TableCell
              >
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <LockWidget :config-id="config.id" :config-name="config.name" />
                  <Button @click="previewConfig(config.id)" variant="ghost" size="icon" title="Preview">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button @click="editConfig(config.id)" variant="ghost" size="icon" title="Edit">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button @click="duplicateConfig(config.id)" variant="ghost" size="icon" title="Duplicate">
                    <Copy class="h-4 w-4" />
                  </Button>
                  <Button @click="openDeleteDialog(config.id, config.name)" variant="ghost" size="icon" title="Delete">
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <DisplayPreview v-if="showPreview && previewConfigId" :config-id="previewConfigId" @close="showPreview = false" />

    <!-- Variant Dialog -->
    <Dialog v-model:open="showVariantDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ dialogMode === "save" ? "Save to File" : "Restore from File" }}</DialogTitle>
          <DialogDescription>
            {{
              dialogMode === "save"
                ? "Enter a variant name to save the display configurations."
                : hasAnyVariants
                ? "Enter the variant name to restore display configurations from."
                : "No saved variants found. Save a configuration first to enable restore functionality."
            }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 pt-4 pb-6 max-w-60">
          <div class="space-y-2">
            <!-- Show dropdown only if variants exist or we're in save mode -->
            <Select
              v-if="hasAnyVariants || dialogMode === 'save'"
              :model-value="showCustomInput ? '__custom__' : variantName"
              @update:model-value="handleVariantChange"
              class="max-w-48"
            >
              <SelectTrigger id="variant-select">
                <SelectValue :placeholder="hasDefaultVariant ? 'Default Variant' : 'Select variant...'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="variant in availableVariants" :key="variant" :value="variant">
                  {{ variant }}
                </SelectItem>
                <SelectItem v-if="dialogMode === 'save'" value="__custom__"> + New variant... </SelectItem>
              </SelectContent>
            </Select>

            <!-- Show message when no variants exist for restore -->
            <div
              v-else-if="dialogMode === 'restore'"
              class="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50"
            >
              No saved variants found. Save a configuration first to enable restore functionality.
            </div>
          </div>

          <div v-if="showCustomInput" class="space-y-2">
            <Label for="custom-variant-name">New Variant Name</Label>
            <VariantNameInput
              v-model="customVariantName"
              ref="variantInputRef"
              :existing-variants="availableVariants"
              mode="create"
              @keydown.enter="confirmVariantAction"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showVariantDialog = false">Cancel</Button>
          <Button
            v-if="dialogMode === 'save' || hasAnyVariants"
            @click="confirmVariantAction"
            :disabled="!finalVariantName || (showCustomInput && !variantInputRef?.isValid)"
          >
            {{ dialogMode === "save" ? "Save" : "Restore" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="w-1/2 max-w-2xl min-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Display Configuration</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this display configuration? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Card class="p-0 my-12">
          <CardContent class="py-1 px-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex flex-col items-center gap-2 h-20 mt-3 shrink-0">
                <span class="font-semibold text-lg">{{ deleteConfigName }}</span>
                <span class="text-sm text-muted-foreground">{{ deleteConfigId }}</span>
              </div>
              <Separator class="h-full border-l w-1" />
              <p class="text-sm text-muted-foreground">
                {{ displayConfigs.find((c) => c.id === deleteConfigId)?.description }}
              </p>
            </div>
          </CardContent>
        </Card>

        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
