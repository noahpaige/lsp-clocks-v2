<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { useRoute } from "vue-router";
import { Toaster } from "@/components/ui/sonner";
import notificationManager from "@/logic/NotificationManager";
import { onUnmounted } from "vue";

const notificationMan = new notificationManager();

// need this to enable dark mode
const mode = useColorMode();

onUnmounted(() => {
  notificationMan.onUnmounted();
});
</script>

<template>
  <Toaster closeButton />
  <router-view></router-view>
</template>
