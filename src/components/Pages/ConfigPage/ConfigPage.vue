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
  <div class="flex w-full">
    <SidebarProvider :default-open="true">
      <ConfigSidebar />
      <div
        class="flex-1 ml-0 transition-[margin-left] ease-linear group-data-[collapsible=offcanvas]:ml-0 group-data-[collapsible=icon]:ml-[--sidebar-width-icon] group-data-[collapsible=sidebar]:ml-[--sidebar-width]"
      >
        <div class="sticky top-14 border-b h-14 flex items-center px-6 gap-4 bg-background z-10">
          <SidebarTrigger />
          <h1 class="text-xl font-semibold">{{ currentPageTitle }}</h1>
        </div>
        <div class="p-6">
          <RouterView />
        </div>
      </div>
    </SidebarProvider>
  </div>
</template>
