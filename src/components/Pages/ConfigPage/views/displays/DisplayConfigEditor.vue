<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { useEditLock } from "@/composables/useEditLock";
import { getDisplayConfigKey } from "@/utils/redisKeyUtils";
import ConflictResolution from "./ConflictResolution.vue";
import { ClockDisplayConfig } from "@/types/ClockDisplayConfig";
import { ClockRowConfig, defaultRowConfig } from "@/types/ClockRowConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, X, AlertCircle, Loader2 } from "lucide-vue-next";
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

// Validation state
const errors = ref<Record<string, string | null>>({
  id: null,
  name: null,
});

// Validate individual fields
const validateField = (field: "id" | "name") => {
  if (field === "id") {
    if (!displayConfig.value.id.trim()) {
      errors.value.id = "Display ID is required";
    } else if (!/^[a-zA-Z0-9-_]+$/.test(displayConfig.value.id)) {
      errors.value.id = "ID must contain only letters, numbers, hyphens, or underscores";
    } else {
      errors.value.id = null;
    }
  }

  if (field === "name") {
    if (!displayConfig.value.name.trim()) {
      errors.value.name = "Display name is required";
    } else {
      errors.value.name = null;
    }
  }
};

// Check if form is valid
const canSave = computed(() => {
  return !errors.value.id && !errors.value.name && displayConfig.value.id.trim() && displayConfig.value.name.trim();
});

onMounted(async () => {
  if (isEditMode.value && configId.value) {
    const existing = getDisplayConfig(configId.value);
    if (existing) {
      displayConfig.value = JSON.parse(JSON.stringify(existing));
      // store the lastModifiedAt if present
      // @ts-ignore
      originalLastModifiedAt.value = existing.lastModifiedAt || 0;

      // Check if someone else is editing before acquiring our lock
      lockInfo.value = await checkLock(getDisplayConfigKey(configId.value));

      // Acquire our own lock
      const lockResult = await acquireLock(getDisplayConfigKey(configId.value));
      console.log("[DisplayConfigEditor] Lock acquired:", lockResult);
    } else {
      router.push("/config/display-configs");
    }
  }
});

// Release lock when navigating away or closing tab
onBeforeUnmount(async () => {
  if (isEditMode.value && configId.value) {
    console.log("[DisplayConfigEditor] Releasing lock on unmount");
    await releaseLock(getDisplayConfigKey(configId.value));
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
  // Validate all fields before saving
  validateField("id");
  validateField("name");

  if (!canSave.value) {
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
      // Release lock before navigating away
      if (configId.value) {
        console.log("[DisplayConfigEditor] Releasing lock after save");
        await releaseLock(getDisplayConfigKey(configId.value));
      }
      router.push("/config/display-configs");
    }
  } else {
    const success = await createDisplayConfig(displayConfig.value);
    if (success) router.push("/config/display-configs");
  }
  isSaving.value = false;
}

async function cancel() {
  // Release lock before navigating away
  if (isEditMode.value && configId.value) {
    console.log("[DisplayConfigEditor] Releasing lock on cancel");
    await releaseLock(getDisplayConfigKey(configId.value));
  }
  router.push("/config/display-configs");
}

function handleOverwrite() {
  // Advance baseline to the latest and retry save
  originalLastModifiedAt.value = conflictConfig.value!.lastModifiedAt || 0;
  showConflictModal.value = false;
  save();
}

async function handleCancelConflict() {
  // Release lock before navigating away
  if (isEditMode.value && configId.value) {
    console.log("[DisplayConfigEditor] Releasing lock on conflict cancel");
    await releaseLock(getDisplayConfigKey(configId.value));
  }
  showConflictModal.value = false;
  router.push("/config/display-configs");
}
</script>

<template>
  <div class="space-y-6">
    <!-- Lock Warning Banner -->
    <div v-if="lockInfo" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
      <div class="flex items-start gap-3">
        <AlertCircle class="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-yellow-800">
            <strong>{{ lockInfo.userName }}</strong> is currently editing this configuration.
          </p>
          <p class="text-xs text-yellow-700 mt-1">
            You can still make edits, but be aware of potential conflicts when saving.
          </p>
        </div>
      </div>
    </div>

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
        <Button @click="save" :disabled="isSaving || !canSave">
          <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />
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
            <Input
              v-model="displayConfig.id"
              placeholder="e.g., mission-control-main"
              :disabled="isEditMode"
              :class="{ 'border-red-500 focus-visible:ring-red-500': errors.id }"
              @blur="validateField('id')"
            />
            <p v-if="errors.id" class="text-sm text-red-500 mt-1">{{ errors.id }}</p>
            <p v-else class="text-xs text-muted-foreground mt-1">
              Unique identifier (cannot be changed after creation)
            </p>
          </div>
          <div>
            <Label>Display Name *</Label>
            <Input
              v-model="displayConfig.name"
              placeholder="e.g., Mission Control Display"
              :class="{ 'border-red-500 focus-visible:ring-red-500': errors.name }"
              @blur="validateField('name')"
            />
            <p v-if="errors.name" class="text-sm text-red-500 mt-1">{{ errors.name }}</p>
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
