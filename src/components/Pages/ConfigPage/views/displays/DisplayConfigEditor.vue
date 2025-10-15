<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { useEditLock } from "@/composables/useEditLock";
import ConflictResolution from "./ConflictResolution.vue";
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
const { getDisplayConfig, createDisplayConfig, updateDisplayConfigWithVersion } = useDisplayConfigs();
const { acquireLock, releaseLock, checkLock } = useEditLock();

const isEditMode = computed(() => route.name === "config-display-config-edit");
const configId = computed(() => route.params.id as string);

const displayConfig = ref<ClockDisplayConfig>({
  id: "",
  name: "",
  description: "",
  containerClasses: "flex flex-col w-full gap-8 justify-center items-center",
  rows: [],
});

const isSaving = ref(false);
const lockInfo = ref<any | null>(null);
const originalLastModifiedAt = ref<number>(0);
const showConflictModal = ref(false);
const conflictConfig = ref<any | null>(null);

onMounted(async () => {
  if (isEditMode.value && configId.value) {
    const existing = getDisplayConfig(configId.value);
    if (existing) {
      displayConfig.value = JSON.parse(JSON.stringify(existing));
      // store the lastModifiedAt if present
      // @ts-ignore
      originalLastModifiedAt.value = existing.lastModifiedAt || 0;

      lockInfo.value = await checkLock(configId.value);
      await acquireLock(configId.value);
    } else {
      router.push("/config/display-configs");
    }
  }
});

function addRow() {
  displayConfig.value.rows.push({ ...defaultRowConfig, clocks: [] });
}

function updateRow(index: number, row: ClockRowConfig) {
  displayConfig.value.rows[index] = row;
}

function removeRow(index: number) {
  displayConfig.value.rows.splice(index, 1);
}

async function save() {
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
    const result = await updateDisplayConfigWithVersion(displayConfig.value, originalLastModifiedAt.value);
    if (result.conflict && result.currentConfig) {
      conflictConfig.value = result.currentConfig;
      showConflictModal.value = true;
      isSaving.value = false;
      return;
    }
    if (result.success) {
      if (configId.value) await releaseLock(configId.value);
      router.push("/config/display-configs");
    }
  } else {
    const success = await createDisplayConfig(displayConfig.value);
    if (success) router.push("/config/display-configs");
  }
  isSaving.value = false;
}

function cancel() {
  router.push("/config/display-configs");
}

function handleOverwrite() {
  // Advance baseline to the latest and retry save
  originalLastModifiedAt.value = conflictConfig.value!.lastModifiedAt || 0;
  showConflictModal.value = false;
  save();
}

function handleCancelConflict() {
  showConflictModal.value = false;
  router.push("/config/display-configs");
}
</script>

<template>
  <div class="space-y-6">
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

  <ConflictResolution
    v-if="showConflictModal && conflictConfig"
    :your-config="(displayConfig as any)"
    :their-config="conflictConfig"
    @overwrite="handleOverwrite"
    @cancel="handleCancelConflict"
  />
</template>
