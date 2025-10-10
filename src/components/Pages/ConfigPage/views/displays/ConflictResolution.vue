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

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

const differences = computed(() => {
  const diffs: string[] = [];
  if (props.yourConfig.name !== props.theirConfig.name)
    diffs.push(`Name: "${props.theirConfig.name}" → "${props.yourConfig.name}"`);
  if (props.yourConfig.description !== props.theirConfig.description) diffs.push("Description changed");
  if (props.yourConfig.rows.length !== props.theirConfig.rows.length)
    diffs.push(`Rows: ${props.theirConfig.rows.length} → ${props.yourConfig.rows.length}`);
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
          at {{ formatTime(theirConfig.lastModifiedAt || theirConfig.version) }} while you were editing.
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
          <Button @click="emit('cancel')" variant="outline">Cancel and Discard My Changes</Button>
          <Button @click="emit('overwrite')" variant="destructive">Save and Overwrite Their Changes</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
