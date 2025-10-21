<script setup lang="ts">
import { ref, watch } from "vue";
import { ClockRowConfig } from "@/types/ClockRowConfig";
import { ClockConfig } from "@/types/ClockConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-vue-next";
import ClockEditor from "./ClockEditor.vue";

const props = defineProps<{
  row: ClockRowConfig;
  index: number;
}>();

const emit = defineEmits<{
  update: [row: ClockRowConfig];
  remove: [];
}>();

const localRow = ref<ClockRowConfig>({ ...props.row });

watch(
  localRow,
  (newValue) => {
    emit("update", newValue);
  },
  { deep: true }
);

function addClock() {
  const newClock: ClockConfig = {
    size: "md",
    format: "HHMMSS",
    timeType: "date",
  };
  localRow.value.clocks.push(newClock);
}

function updateClock(index: number, clock: ClockConfig) {
  localRow.value.clocks[index] = clock;
}

function removeClock(index: number) {
  localRow.value.clocks.splice(index, 1);
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Row {{ index + 1 }}</CardTitle>
        <Button @click="emit('remove')" variant="ghost" size="icon">
          <Trash2 class="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-3 gap-4">
        <div>
          <Label>Gap</Label>
          <Input v-model.number="localRow.gap" type="number" placeholder="8" />
        </div>
        <div>
          <Label>Justify</Label>
          <Input v-model="localRow.justify" placeholder="center" />
        </div>
        <div>
          <Label>Align</Label>
          <Input v-model="localRow.align" placeholder="center" />
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label class="text-sm font-medium">Clocks in Row</Label>
          <Button @click="addClock" variant="outline" size="sm">
            <Plus class="mr-1 h-3 w-3" />
            Add Clock
          </Button>
        </div>

        <div v-if="localRow.clocks.length === 0" class="text-center py-4 text-sm text-muted-foreground">
          No clocks in this row. Click "Add Clock" to get started.
        </div>

        <div class="space-y-2">
          <ClockEditor
            v-for="(clock, clockIndex) in localRow.clocks"
            :key="clockIndex"
            :clock="clock"
            :index="clockIndex"
            @update="(c) => updateClock(clockIndex, c)"
            @remove="removeClock(clockIndex)"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
