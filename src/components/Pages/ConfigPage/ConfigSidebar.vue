<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronDown, ChevronRight, X } from "lucide-vue-next";
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
import { CATEGORY_LABELS, type RouteMeta } from "@/router/routes";

const route = useRoute();
const router = useRouter();
const searchQuery = ref("");

// Build sidebar menu from router config
const sidebarSections = computed(() => {
  // Find the /config route
  const configRoute = router.options.routes.find((r) => r.path === "/config");
  if (!configRoute?.children) return [];

  // Group routes by category
  const categoryMap = new Map<
    string,
    Array<{
      title: string;
      path: string;
      icon: any;
      keywords: string[];
    }>
  >();

  configRoute.children.forEach((child) => {
    const meta = child.meta as RouteMeta;

    // Only include routes that should be shown in sidebar
    if (!meta?.showInSidebar) return;

    const category = meta.category || "other";
    const fullPath = `/config/${child.path}`;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }

    categoryMap.get(category)!.push({
      title: meta.title || (child.name as string) || child.path,
      path: fullPath,
      icon: meta.icon,
      keywords: meta.keywords || [],
    });
  });

  // Convert map to array of sections
  return Array.from(categoryMap.entries()).map(([category, items]) => ({
    label: CATEGORY_LABELS[category] || category,
    items,
  }));
});

// Filter sections based on search query
const filteredSections = computed(() => {
  if (!searchQuery.value) return sidebarSections.value;

  const query = searchQuery.value.toLowerCase();

  return sidebarSections.value
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.title.toLowerCase().includes(query) || item.keywords.some((keyword) => keyword.includes(query))
      ),
    }))
    .filter((section) => section.items.length > 0);
});

// Check if a route is active
const isActive = (path: string) => {
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

      <div class="relative pb-4">
        <Input v-model="searchQuery" placeholder="Search config pages..." class="h-9 pr-9" />
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1 h-7 w-7"
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
