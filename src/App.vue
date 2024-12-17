<script setup lang="ts">
import AnotherPage from "./components/Pages/AnotherPage.vue";
import { useColorMode } from "@vueuse/core";

// need this to enable dark mode
const mode = useColorMode();
</script>

<template>
  <AnotherPage />
</template>
