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
import { CATEGORY_LABELS, CATEGORY_ORDER, type RouteMeta } from "@/router/routes";

const route = useRoute();
const router = useRouter();
const searchQuery = ref("");

// Build unified sidebar items (combines top-level items and sections)
const sidebarItems = computed(() => {
  const configRoute = router.options.routes.find((r) => r.path === "/config");
  if (!configRoute?.children) return [];

  const items: Array<{
    type: "item" | "section";
    order: number;
    keywords: string[];
    // For type === "item"
    title?: string;
    path?: string;
    icon?: any;
    // For type === "section"
    label?: string;
    category?: string;
    items?: Array<{
      title: string;
      path: string;
      icon: any;
      keywords: string[];
      order: number;
    }>;
  }> = [];

  // Collect top-level items
  configRoute.children.forEach((child) => {
    const meta = child.meta as RouteMeta;
    if (meta?.showInSidebar && meta?.topLevel) {
      items.push({
        type: "item",
        title: meta.title || (child.name as string) || child.path,
        path: `/config/${child.path}`,
        icon: meta.icon,
        keywords: meta.keywords || [],
        order: meta.order ?? 999,
      });
    }
  });

  // Collect sections
  const categoryMap = new Map<
    string,
    Array<{
      title: string;
      path: string;
      icon: any;
      keywords: string[];
      order: number;
    }>
  >();

  configRoute.children.forEach((child) => {
    const meta = child.meta as RouteMeta;
    if (meta?.showInSidebar && !meta?.topLevel) {
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
        order: meta.order ?? 999,
      });
    }
  });

  // Add sections to items array
  categoryMap.forEach((sectionItems, category) => {
    items.push({
      type: "section",
      label: CATEGORY_LABELS[category] || category,
      category,
      items: sectionItems.sort((a, b) => a.order - b.order),
      keywords: sectionItems.flatMap((item) => item.keywords),
      order: CATEGORY_ORDER[category] ?? 999,
    });
  });

  // Sort all items by order
  return items.sort((a, b) => a.order - b.order);
});

// Filter unified sidebar items based on search query
const filteredSidebarItems = computed(() => {
  if (!searchQuery.value) return sidebarItems.value;

  const query = searchQuery.value.toLowerCase();

  return sidebarItems.value
    .map((item) => {
      if (item.type === "item") {
        // For top-level items, check if title or keywords match
        const matches =
          item.title?.toLowerCase().includes(query) || item.keywords.some((keyword) => keyword.includes(query));
        return matches ? item : null;
      } else {
        // For sections, filter items within the section
        const filteredItems = item.items!.filter(
          (sectionItem) =>
            sectionItem.title.toLowerCase().includes(query) ||
            sectionItem.keywords.some((keyword) => keyword.includes(query))
        );
        return filteredItems.length > 0 ? { ...item, items: filteredItems } : null;
      }
    })
    .filter((item) => item !== null);
});

// Check if a route is active
const isActive = (path: string) => {
  return route.path === path;
};

// Check if a section contains the active route
const isSectionActive = (items?: Array<{ path: string }>) => {
  return items?.some((item) => isActive(item.path)) ?? false;
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
      <!-- Unified sidebar items (can be top-level items or sections) -->
      <template v-for="item in filteredSidebarItems" :key="item.type === 'item' ? item.path : item.category">
        <!-- Top-level item -->
        <SidebarGroup v-if="item.type === 'item'" class="px-2 py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as-child :is-active="isActive(item.path!)">
                  <a :href="item.path" @click.prevent="$router.push(item.path!)">
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <!-- Section with collapsible items -->
        <SidebarGroup v-else class="px-2 py-0">
          <Collapsible :default-open="isSectionActive(item.items)" class="group">
            <CollapsibleTrigger as-child>
              <SidebarGroupLabel
                :class="[
                  'cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-2 flex items-center justify-between text-md font-normal',
                  isSectionActive(item.items)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground',
                ]"
              >
                <span>{{ item.label }}</span>
                <ChevronDown class="h-4 w-4 transition-transform duration-200 group-data-[state=closed]:hidden" />
                <ChevronRight class="h-4 w-4 transition-transform duration-200 group-data-[state=open]:hidden" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent class="ml-4 border-l border-sidebar-border pl-4 w-[calc(100%-16px)] pt-1">
                <SidebarMenu>
                  <SidebarMenuItem v-for="sectionItem in item.items" :key="sectionItem.path">
                    <SidebarMenuButton as-child :is-active="isActive(sectionItem.path)">
                      <a :href="sectionItem.path" @click.prevent="$router.push(sectionItem.path)">
                        <component :is="sectionItem.icon" />
                        <span>{{ sectionItem.title }}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </template>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
