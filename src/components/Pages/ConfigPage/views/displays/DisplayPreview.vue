<script setup lang="ts">
import { computed } from "vue";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import GenericClockDisplay from "@/components/Pages/Displays/GenericClockDisplay.vue";
import { X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  configId: string;
}>();

const emit = defineEmits<{ close: [] }>();

const { getDisplayConfig } = useDisplayConfigs();
const config = computed(() => getDisplayConfig(props.configId));
</script>

<template>
  <div class="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
    <Button @click="emit('close')" variant="ghost" size="icon" class="absolute top-4 right-4 z-10">
      <X class="h-6 w-6" />
    </Button>

    <div v-if="config" class="w-full h-full">
      <GenericClockDisplay :config="config" />
    </div>
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-muted-foreground">Configuration not found</p>
    </div>
  </div>
</template>
