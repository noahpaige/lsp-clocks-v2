<script setup>
import { useRoute, useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Settings, Clock } from "lucide-vue-next";
import { useToaster } from "@/composables/useToaster";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";

const route = useRoute();
const router = useRouter();

const navItems = {
  home: {
    name: "Home",
    href: "/",
  },
  displayController: {
    name: "Display Controller",
    href: "/display-controller",
  },
  configuration: {
    name: "Configuration",
    href: "/config",
  },
};

// Helper function to determine if a nav item is selected
const isNavItemSelected = (itemHref) => {
  const currentPath = route.path;
  // For home, use exact match to avoid matching all routes
  if (itemHref === "/") {
    return currentPath === "/";
  }
  // For other routes, check if the current path starts with the item href
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
};

const { emitToast } = useToaster();

const onClickSettings = () => {
  emitToast({
    title: "Settings Clicked!",
    type: "info",
    deliverTo: "all",
  });
};

const navigateTo = (href) => {
  router.push(href);
};
</script>

<template>
  <div class="flex items-center justify-between border-b h-14 bg-topnav-background">
    <div class="flex items-center gap-4 self-stretch">
      <div class="flex items-center justify-center px-4 border-r self-stretch w-64">
        <Clock class="bg-slate-300 text-black rounded-full w-7 h-7 mt-1" />
        <div class="text-3xl text-slate-300 font-bold ml-2">LSP Clocks</div>
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem v-for="(item, key) in navItems" :key="key">
            <NavigationMenuLink
              @click="navigateTo(item.href)"
              :class="[
                navigationMenuTriggerStyle(),
                isNavItemSelected(item.href) ? 'text-accent-foreground scale-105' : 'text-foreground/60',
                'bg-tranparent',
                'cursor-pointer',
                'transition-scale',
                'duration-300',
                'ease-in-out',
                'hover:scale-105',
                'bg-transparent',
              ]"
            >
              {{ item.name }}
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
    <div class="flex items-center border-l self-stretch px-4">
      <Button variant="ghost" class="w-8 h-8" @click="onClickSettings"><Settings /> </Button>
    </div>
  </div>
</template>
