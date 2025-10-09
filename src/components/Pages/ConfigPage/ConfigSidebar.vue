<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { Settings, Monitor, Palette, Bell, ChevronDown, ChevronRight, X } from "lucide-vue-next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const route = useRoute();
const searchQuery = ref("");

// Sidebar menu structure
const sidebarSections = [
  {
    label: "General",
    items: [
      {
        title: "Application Settings",
        path: "/config/application-settings",
        icon: Settings,
        keywords: ["app", "title", "general", "redis", "settings"],
      },
    ],
  },
  {
    label: "Displays",
    items: [
      {
        title: "Display Configurations",
        path: "/config/display-configs",
        icon: Monitor,
        keywords: ["display", "clock", "config", "layout", "configurations"],
      },
    ],
  },
  {
    label: "Appearance",
    items: [
      {
        title: "Theme",
        path: "/config/theme",
        icon: Palette,
        keywords: ["theme", "dark", "light", "colors", "appearance"],
      },
    ],
  },
  {
    label: "Notifications",
    items: [
      {
        title: "Notification Settings",
        path: "/config/notifications",
        icon: Bell,
        keywords: ["notifications", "toast", "alerts", "messages"],
      },
    ],
  },
];

// Filter sections based on search query
const filteredSections = computed(() => {
  if (!searchQuery.value) return sidebarSections;

  const query = searchQuery.value.toLowerCase();

  return sidebarSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.title.toLowerCase().includes(query) || item.keywords.some((keyword) => keyword.includes(query))
      ),
    }))
    .filter((section) => section.items.length > 0);
});

// Check if a route is active
const isActive = (path) => {
  return route.path === path;
};

// Clear search query
const clearSearch = () => {
  searchQuery.value = "";
};
</script>

<template>
  <Sidebar>
    <SidebarHeader class="px-3">
      <!-- Spacer to account for TopNav height -->
      <div class="h-14"></div>

      <div class="relative">
        <Input v-model="searchQuery" placeholder="Search config pages..." class="h-9 pr-9" />
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          @click="clearSearch"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="section in filteredSections" :key="section.label" class="px-2 py-0">
        <Collapsible :default-open="false" class="group">
          <CollapsibleTrigger as-child>
            <SidebarGroupLabel
              class="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-2 flex items-center justify-between text-md font-normal text-sidebar-foreground"
            >
              <span>{{ section.label }}</span>
              <ChevronDown class="h-4 w-4 transition-transform duration-200 group-data-[state=closed]:hidden" />
              <ChevronRight class="h-4 w-4 transition-transform duration-200 group-data-[state=open]:hidden" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent class="ml-4 border-l border-sidebar-border pl-4 w-[calc(100%-16px)] pt-1">
              <SidebarMenu>
                <SidebarMenuItem v-for="item in section.items" :key="item.path">
                  <SidebarMenuButton as-child :is-active="isActive(item.path)">
                    <a :href="item.path" @click.prevent="$router.push(item.path)">
                      <component :is="item.icon" />
                      <span>{{ item.title }}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
