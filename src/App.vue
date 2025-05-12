<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Toaster } from "@/components/ui/sonner";
import { useToaster } from "@/composables/useToaster";
// need this to enable dark mode
const mode = useColorMode();
const toaster = useToaster();
</script>

<template>
  <Toaster closeButton />
  <router-view></router-view>
</template>
