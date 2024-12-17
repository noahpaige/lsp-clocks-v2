<script setup lang="ts">
import Clock from "@/components/Clocks/Clock/Clock.vue";
import { ref } from "vue";

const props = defineProps({
  time: {
    type: Number,
    default: 0,
  },
  size: {
    type: String,
    default: "md",
  },
  labelRight: {
    type: String,
    default: "",
  },
});

const timezoneStr = ref(new Date().toLocaleString("en-US", { timeZoneName: "short" }).split(" ")[3]);
</script>

<template>
  <Clock :labelRight="timezoneStr" :time="props.time" :size="props.size" />
</template>
