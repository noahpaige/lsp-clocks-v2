<script setup lang="ts">
import { ref, watch } from "vue";
import { ClockConfig } from "@/types/ClockConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-vue-next";

const props = defineProps<{
  clock: ClockConfig;
  index: number;
}>();

const emit = defineEmits<{
  update: [clock: ClockConfig];
  remove: [];
}>();

const localClock = ref<ClockConfig>({ ...props.clock });

watch(
  localClock,
  (newValue) => {
    emit("update", newValue);
  },
  { deep: true }
);
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm">Clock {{ index + 1 }}</CardTitle>
        <Button @click="emit('remove')" variant="ghost" size="icon">
          <Trash2 class="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="grid grid-cols-3 gap-2">
        <div>
          <Label>Label Left</Label>
          <Input v-model="localClock.labelLeft" placeholder="e.g., T" />
        </div>
        <div>
          <Label>Label Top</Label>
          <Input v-model="localClock.labelTop" placeholder="e.g., T-Zero" />
        </div>
        <div>
          <Label>Label Right</Label>
          <Input v-model="localClock.labelRight" placeholder="e.g., UTC" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div>
          <Label>Size</Label>
          <select
            v-model="localClock.size"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
            <option value="2xl">2XL</option>
          </select>
        </div>
        <div>
          <Label>Format</Label>
          <select
            v-model="localClock.format"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="DDHHMMSS">DD:HH:MM:SS</option>
            <option value="HHMMSS">HH:MM:SS</option>
            <option value="MMSS">MM:SS</option>
            <option value="SS">SS</option>
          </select>
        </div>
        <div>
          <Label>Time Type</Label>
          <select
            v-model="localClock.timeType"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="date">Date</option>
            <option value="timespan">Timespan</option>
          </select>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
