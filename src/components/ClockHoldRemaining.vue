<script setup lang="ts">
import Clock from "@/components/Clock.vue";

const props = defineProps({
  time: {
    type: Number,
    default: 0,
  },
  size: {
    type: String,
    default: "md",
  },
});
</script>

<template>
  <Clock labelTop="Hold Remaining" :time="props.time" :size="props.size" />
</template>
