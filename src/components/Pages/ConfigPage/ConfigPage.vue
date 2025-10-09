<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import ConfigSidebar from "./ConfigSidebar.vue";

const route = useRoute();

const currentPageTitle = computed(() => {
  return route.meta.title || "Configuration";
});

const currentPageDescription = computed(() => {
  return route.meta.description || "";
});
</script>

<template>
  <div class="flex w-full">
    <SidebarProvider :default-open="true">
      <ConfigSidebar />
      <div
        class="flex-1 ml-0 transition-[margin-left] ease-linear group-data-[collapsible=offcanvas]:ml-0 group-data-[collapsible=icon]:ml-[--sidebar-width-icon] group-data-[collapsible=sidebar]:ml-[--sidebar-width]"
      >
        <div class="sticky flex items-center px-6 gap-4 inset-shadow-2xl">
          <SidebarTrigger size="2xl" />
          <div class="flex flex-col py-4 gap-2">
            <h1 class="text-3xl font-bold">{{ currentPageTitle }}</h1>
            <p class="text-sm text-muted-foreground">{{ currentPageDescription }}</p>
          </div>
        </div>
        <div class="p-6">
          <RouterView />
        </div>
      </div>
    </SidebarProvider>
  </div>
</template>
