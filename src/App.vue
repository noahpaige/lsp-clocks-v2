<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Toaster } from "@/components/ui/sonner";
import NotificationManager from "@/logic/NotificationManager";
import { onUnmounted } from "vue";

const notificationMan = NotificationManager.getInstance();

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
