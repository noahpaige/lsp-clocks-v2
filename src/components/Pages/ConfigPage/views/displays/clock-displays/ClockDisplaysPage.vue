<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, Edit, Copy, Trash2 } from "lucide-vue-next";
import DisplayPreview from "./ClockDisplayPreview.vue";
import LockWidget from "@/components/shared/LockWidget.vue";
import ConfigHeaderBar from "@/components/shared/config/ConfigHeaderBar.vue";
import ConfigDataTable from "@/components/shared/config/ConfigDataTable.vue";
import ActionsRow from "@/components/shared/config/ActionsRow.vue";
import SaveRestoreDialog from "@/components/shared/config/SaveRestoreDialog.vue";
import ConfigDeleteDialog from "@/components/shared/config/ConfigDeleteDialog.vue";
import { useRedisFileSync } from "@/composables/useRedisFileSync";
import { REDIS_CONFIG } from "@/config/constants";
import { getDisplayConfigKey } from "@/utils/redisKeyUtils";
import type { Action } from "@/types/ConfigComponents";
import ConfigFlexLayout from "@/components/shared/layouts/ConfigFlexLayout.vue";

const router = useRouter();
const { displayConfigs, isLoading, loadDisplayConfigs, deleteDisplayConfig, duplicateDisplayConfig } =
  useDisplayConfigs();
const { isSaving, isRestoring, saveKeysToFiles, restoreKeysFromFiles, listKeysForVariant } = useRedisFileSync();

const searchQuery = ref("");
const showPreview = ref(false);
const previewConfigId = ref<string | null>(null);

// Dialog state
const showSaveDialog = ref(false);
const showRestoreDialog = ref(false);
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

async function handleSave(variant: string) {
  const allKeys = displayConfigs.value.map((c) => getDisplayConfigKey(c.id));
  await saveKeysToFiles(allKeys, variant, true);
  showSaveDialog.value = false;
}

async function handleRestore(variant: string) {
  const allKeys = await listKeysForVariant(variant);
  const success = await restoreKeysFromFiles(allKeys, variant, true);
  if (success) {
    await loadDisplayConfigs();
  }
  showRestoreDialog.value = false;
}

function handleAction(actionId: string, itemId?: string, itemName?: string) {
  switch (actionId) {
    case "preview":
      if (itemId) previewConfig(itemId);
      break;
    case "edit":
      if (itemId) editConfig(itemId);
      break;
    case "duplicate":
      if (itemId) duplicateConfig(itemId);
      break;
    case "delete":
      if (itemId && itemName) openDeleteDialog(itemId, itemName);
      break;
  }
}

// Define columns for ConfigDataTable
const columns = [
  { key: "name", label: "Name", width: "w-48" },
  { key: "description", label: "Description", width: "max-w-md" },
  { key: "rows", label: "Rows", align: "center" as const },
  { key: "clocks", label: "Clocks", align: "center" as const },
  { key: "actions", label: "Actions", align: "right" as const, width: "w-40" },
];

// Define actions for ActionsRow
const getActionsForConfig = (config: any): Action[] => [
  {
    id: "lock",
    component: LockWidget,
    componentProps: {
      configId: config.id,
      configName: config.name,
    },
  },
  {
    id: "preview",
    icon: Eye,
    tooltip: "Preview",
  },
  {
    id: "edit",
    icon: Edit,
    tooltip: "Edit",
  },
  {
    id: "duplicate",
    icon: Copy,
    tooltip: "Duplicate",
  },
  {
    id: "delete",
    icon: Trash2,
    tooltip: "Delete",
    class: "text-destructive",
  },
];
</script>

<template>
  <ConfigFlexLayout>
    <template #header>
      <ConfigHeaderBar
        v-model:search-query="searchQuery"
        search-placeholder="Search displays..."
        create-button-text="Create Display"
        :show-save-restore="true"
        :is-saving="isSaving"
        :is-restoring="isRestoring"
        save-tooltip="Save all displays to JSON file"
        restore-tooltip="Restore displays from JSON file"
        @create="createNew"
        @save="showSaveDialog = true"
        @restore="showRestoreDialog = true"
      />
    </template>
    <template #body>
      <ConfigDataTable
        :is-loading="isLoading"
        :is-empty="filteredConfigs.length === 0 && !isLoading"
        :columns="columns"
        empty-message="No display configurations found."
        empty-action-text="Create your first display"
        @empty-action="createNew"
      >
        <template #tablebody>
          <TableRow v-for="config in filteredConfigs" :key="config.id">
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
              <ActionsRow
                :actions="getActionsForConfig(config)"
                :item-id="config.id"
                :item-name="config.name"
                @action="handleAction"
              />
            </TableCell>
          </TableRow>
        </template>
      </ConfigDataTable>
    </template>
  </ConfigFlexLayout>

  <!-- Preview Dialog -->
  <DisplayPreview v-if="showPreview && previewConfigId" :config-id="previewConfigId" @close="showPreview = false" />

  <!-- Save Dialog -->
  <SaveRestoreDialog
    v-model:open="showSaveDialog"
    mode="save"
    :file-pattern="REDIS_CONFIG.KEYS.DISPLAY_CONFIG.FILE_PATTERN"
    :is-processing="isSaving"
    save-description="Enter a variant name to save all display configurations."
    @save="handleSave"
  />

  <!-- Restore Dialog -->
  <SaveRestoreDialog
    v-model:open="showRestoreDialog"
    mode="restore"
    :file-pattern="REDIS_CONFIG.KEYS.DISPLAY_CONFIG.FILE_PATTERN"
    :is-processing="isRestoring"
    restore-description="Select a variant to restore display configurations from."
    @restore="handleRestore"
  />

  <!-- Delete Confirmation Dialog -->
  <ConfigDeleteDialog
    v-model:open="showDeleteDialog"
    title="Delete Display Configuration"
    description="Are you sure you want to delete this display configuration? This action cannot be undone."
    :item-name="deleteConfigName"
    :item-id="deleteConfigId"
    @confirm="confirmDelete"
  >
    <template #item-details>
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
    </template>
  </ConfigDeleteDialog>
</template>
