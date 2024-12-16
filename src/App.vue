<script setup lang="ts">
import MainPage from "@/components/Pages/MainPage.vue";
import { useColorMode } from "@vueuse/core";

// need this to enable dark mode
const mode = useColorMode();
</script>

<template>
  <MainPage />
</template>
