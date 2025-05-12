<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Toaster } from "@/components/ui/sonner";
import { useToaster } from "@/composables/useToaster";
import { useWindowManager } from "@/composables/WindowManager/useWindowManager";
// need this to enable dark mode
const mode = useColorMode();
const toaster = useToaster();
const windowMan = useWindowManager();
</script>

<template>
  <Toaster closeButton />
  <router-view></router-view>
</template>
