<script setup lang="ts">
import Clock from "@/components/Clocks/Clock/Clock.vue";

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
  <Clock labelLeft="L-" :time="props.time" :size="props.size" />
</template>
