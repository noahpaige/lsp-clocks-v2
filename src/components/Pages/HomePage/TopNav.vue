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
  <div class="flex items-center justify-between border-b h-14">
    <div class="flex items-center gap-4 self-stretch">
      <div class="flex items-center px-4 border-r self-stretch">
        <Clock class="bg-slate-300 text-black rounded-full w-7 h-7 mt-1" />
        <div class="text-3xl text-slate-300 font-bold ml-2">LSP Clocks</div>
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem v-for="(item, key) in navItems" :key="key">
            <NavigationMenuLink
              :href="item.href"
              :class="[
                navigationMenuTriggerStyle(),
                selectedHref === item.href ? 'text-accent-foreground scale-105' : 'text-foreground/60',
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
