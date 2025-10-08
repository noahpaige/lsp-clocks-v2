<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { Settings, Monitor, Palette, Bell } from "lucide-vue-next";
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
</script>

<template>
  <Sidebar>
    <SidebarHeader class="border-b p-4">
      <div class="flex items-center gap-2 mb-3">
        <Settings class="h-5 w-5" />
        <h2 class="font-semibold text-lg">Configuration</h2>
      </div>
      <Input v-model="searchQuery" placeholder="Search settings..." class="h-9" />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="section in filteredSections" :key="section.label" class="px-2">
        <Collapsible :default-open="true" class="group/collapsible">
          <CollapsibleTrigger as-child>
            <SidebarGroupLabel class="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-2">
              {{ section.label }}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
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
