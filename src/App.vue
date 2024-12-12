<script setup lang="ts">
import UTCClock from "./components/UTCClock.vue";
import { useColorMode } from "@vueuse/core";

const mode = useColorMode();
</script>

<template>
  <div class="w-screen h-screen flex flex-col justify-center items-center">
    <UTCClock />
  </div>
</template>
