<script setup>
import { useRoute } from "vue-router";
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

// Store the href of the currently selected nav item (set once on component load)
const selectedHref = route.path;

const { emitToast } = useToaster();

const onClickSettings = () => {
  emitToast({
    title: "Settings Clicked!",
    type: "info",
    deliverTo: "all",
  });
};
</script>

<template>
  <div class="flex items-center justify-between border-b p-2">
    <div class="flex items-center gap-4">
      <div class="flex items-center">
        <Clock class="bg-slate-300 text-black rounded-full w-8 h-8 mt-1" />
        <div class="text-4xl text-slate-300 font-bold ml-2">LSP Clocks</div>
      </div>
      <Separator orientation="vertical" class="h-14 -my-6" />
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem v-for="(item, key) in navItems" :key="key">
            <NavigationMenuLink
              :href="item.href"
              :class="[
                navigationMenuTriggerStyle(),
                selectedHref === item.href ? 'bg-accent/50 text-accent-foreground scale-105' : 'text-foreground/60',
              ]"
            >
              {{ item.name }}
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
    <div class="flex items-center">
      <Separator orientation="vertical" class="h-14 -my-6 mr-2" />
      <Button variant="ghost" @click="onClickSettings"><Settings /> </Button>
    </div>
  </div>
</template>
