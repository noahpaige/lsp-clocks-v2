<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import ConfigSidebar from "./ConfigSidebar.vue";

const route = useRoute();

const currentPageTitle = computed(() => {
  return route.meta.title || "Configuration";
});
</script>

<template>
  <div class="flex w-full config-layout" style="height: calc(100vh - 56px)">
    <SidebarProvider :default-open="true">
      <ConfigSidebar />
      <main class="flex-1 overflow-auto">
        <div class="border-b h-14 flex items-center px-6 gap-4 sticky top-0 bg-background z-10">
          <SidebarTrigger />
          <h1 class="text-2xl font-semibold">{{ currentPageTitle }}</h1>
        </div>
        <div class="p-6">
          <RouterView />
        </div>
      </main>
    </SidebarProvider>
  </div>
</template>

<style scoped>
.config-layout :deep(.duration-200.fixed.inset-y-0) {
  position: absolute !important;
  top: 56px !important;
  bottom: 0 !important;
  height: calc(100vh - 56px) !important;
}
</style>
