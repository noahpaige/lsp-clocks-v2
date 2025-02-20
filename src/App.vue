<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { useRoute } from "vue-router";
import routes from "./router/routes";

const route = useRoute();

// need this to enable dark mode
const mode = useColorMode();
</script>

<template>
  <router-view></router-view>
</template>
