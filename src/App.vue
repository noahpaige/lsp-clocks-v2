<script setup lang="ts">
import ClocksDemoPage from "./components/Pages/ClocksDemoPage.vue";
import { useColorMode } from "@vueuse/core";

// need this to enable dark mode
const mode = useColorMode();
</script>

<template>
  <ClocksDemoPage />
</template>
